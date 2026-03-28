import { supabase } from "./supabase";

const BUCKET_NAME = "dataset";
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

/**
 * Upload a GeoJSON file to Supabase storage and create dataset metadata
 * @param {File} file - The GeoJSON file to upload
 * @param {string} userId - The user's ID
 * @param {string} name - Optional custom name for the dataset
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function uploadDataset(file, userId, name = null) {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } };
  }

  // Validate file size
  if (file.size > MAX_FILE_SIZE) {
    return { data: null, error: { message: "File size exceeds 10MB limit" } };
  }

  // Parse and validate GeoJSON
  let geojson;
  try {
    const text = await file.text();
    geojson = JSON.parse(text);
    if (
      !geojson.type ||
      (geojson.type !== "FeatureCollection" && geojson.type !== "Feature")
    ) {
      throw new Error("Invalid GeoJSON structure");
    }
  } catch (err) {
    return {
      data: null,
      error: { message: "Invalid GeoJSON file: " + err.message },
    };
  }

  // Determine geometry type and calculate bounding box
  const { geometryType, bbox, featureCount } = analyzeGeoJSON(geojson);

  // Generate unique dataset ID and storage path
  const datasetId = crypto.randomUUID();
  const storagePath = `${userId}/${datasetId}.geojson`;
  const datasetName = name || file.name.replace(/\.geojson$/i, "");

  // Upload to storage
  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: "application/json",
      upsert: false,
    });

  if (uploadError) {
    return {
      data: null,
      error: { message: "Upload failed: " + uploadError.message },
    };
  }

  // Insert metadata into database
  const { data, error: insertError } = await supabase
    .from("datasets")
    .insert({
      id: datasetId,
      name: datasetName,
      owner: userId,
      storage_path: storagePath,
      geometry_type: geometryType,
      bbox: bbox,
      feature_count: featureCount,
    })
    .select()
    .single();

  if (insertError) {
    // Cleanup uploaded file if metadata insert fails
    await supabase.storage.from(BUCKET_NAME).remove([storagePath]);
    return {
      data: null,
      error: {
        message: "Failed to save dataset metadata: " + insertError.message,
      },
    };
  }

  return { data: { ...data, geojson }, error: null };
}

/**
 * Fetch all datasets for a user
 * @param {string} userId - The user's ID
 * @returns {Promise<{data: array|null, error: object|null}>}
 */
export async function fetchUserDatasets(userId) {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } };
  }

  const { data, error } = await supabase
    .from("datasets")
    .select("*")
    .eq("owner", userId)
    .order("created_at", { ascending: false });

  if (error) {
    return {
      data: null,
      error: { message: "Failed to fetch datasets: " + error.message },
    };
  }

  return { data, error: null };
}

/**
 * Download and parse a dataset's GeoJSON
 * @param {string} storagePath - The storage path of the dataset
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function downloadDataset(storagePath) {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } };
  }

  // Use authenticated download directly (bucket requires auth per RLS policies)
  const { data, error } = await supabase.storage
    .from(BUCKET_NAME)
    .download(storagePath);

  if (error) {
    return {
      data: null,
      error: { message: "Failed to download dataset: " + error.message },
    };
  }

  try {
    const text = await data.text();
    const geojson = JSON.parse(text);
    return { data: geojson, error: null };
  } catch (err) {
    return {
      data: null,
      error: { message: "Failed to parse dataset: " + err.message },
    };
  }
}

/**
 * Rename a dataset
 * @param {string} datasetId - The dataset ID
 * @param {string} newName - The new name
 * @returns {Promise<{data: object|null, error: object|null}>}
 */
export async function renameDataset(datasetId, newName) {
  if (!supabase) {
    return { data: null, error: { message: "Supabase not configured" } };
  }

  const { data, error } = await supabase
    .from("datasets")
    .update({ name: newName })
    .eq("id", datasetId)
    .select()
    .single();

  if (error) {
    return {
      data: null,
      error: { message: "Failed to rename dataset: " + error.message },
    };
  }

  return { data, error: null };
}

/**
 * Delete a dataset (storage file and metadata)
 * @param {string} datasetId - The dataset ID
 * @param {string} storagePath - The storage path
 * @returns {Promise<{error: object|null}>}
 */
export async function deleteDataset(datasetId, storagePath) {
  if (!supabase) {
    return { error: { message: "Supabase not configured" } };
  }

  // Delete from storage
  const { error: storageError } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([storagePath]);

  if (storageError) {
    return {
      error: { message: "Failed to delete file: " + storageError.message },
    };
  }

  // Delete metadata
  const { error: dbError } = await supabase
    .from("datasets")
    .delete()
    .eq("id", datasetId);

  if (dbError) {
    return {
      error: {
        message: "Failed to delete dataset metadata: " + dbError.message,
      },
    };
  }

  return { error: null };
}

/**
 * Analyze GeoJSON to extract geometry type, bbox, and feature count
 * @param {object} geojson - The parsed GeoJSON object
 * @returns {{geometryType: string, bbox: number[], featureCount: number}}
 */
function analyzeGeoJSON(geojson) {
  const features =
    geojson.type === "FeatureCollection" ? geojson.features : [geojson];

  const featureCount = features.length;

  // Determine predominant geometry type
  const typeCounts = {};
  for (const feature of features) {
    const type = feature.geometry?.type || "Unknown";
    typeCounts[type] = (typeCounts[type] || 0) + 1;
  }

  const geometryType =
    Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || "Unknown";

  // Calculate bounding box
  let minX = Infinity,
    minY = Infinity,
    maxX = -Infinity,
    maxY = -Infinity;

  function processCoords(coords) {
    if (typeof coords[0] === "number") {
      const [x, y] = coords;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    } else {
      for (const c of coords) {
        processCoords(c);
      }
    }
  }

  for (const feature of features) {
    if (feature.geometry?.coordinates) {
      processCoords(feature.geometry.coordinates);
    }
  }

  const bbox = [minX, minY, maxX, maxY].map((v) =>
    Number.isFinite(v) ? v : 0
  );

  return { geometryType, bbox, featureCount };
}

/**
 * Get default style for a geometry type
 * @param {string} geometryType - The geometry type
 * @returns {object}
 */
export function getDefaultStyle(geometryType) {
  const normalizedType = geometryType?.toLowerCase() || "";

  if (normalizedType.includes("polygon")) {
    return {
      type: "polygon",
      fill: "#3498DB",
      fillOpacity: 0.6,
      stroke: "#2980B9",
      strokeWidth: 2,
    };
  }

  if (normalizedType.includes("line")) {
    return {
      type: "line",
      stroke: "#E74C3C",
      strokeWidth: 3,
    };
  }

  // Point or default
  return {
    type: "point",
    fill: "#2ECC71",
    radius: 6,
    stroke: "#27AE60",
    strokeWidth: 1,
  };
}
