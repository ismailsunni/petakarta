import { supabase } from "./supabase";

/**
 * Normalize project state for loading (apply migrations if needed)
 */
export function normalizeProjectState(state) {
  if (!state) return state;

  // Future: Add version migrations here
  // For now, just return the state as-is since we're using the new layer tree format
  return state;
}

/**
 * Extract project state for saving
 * This function is used by the old mapStore - keeping for backwards compatibility
 * New code should use layerTreeStore.getProjectState() directly
 */
export function extractProjectState(storeState) {
  // If storeState has layers array, it's already in new format
  if (storeState.layers) {
    return storeState;
  }

  // Legacy support - extract old format keys
  const PERSIST_KEYS = [
    "featureValues",
    "adminLayerId",
    "styleMode",
    "colorPreset",
    "colorReversed",
    "classMethod",
    "numClasses",
    "manualBreaks",
    "categoryColors",
    "strokeColor",
    "strokeWidth",
    "noDataColor",
    "basemap",
    "showFeatureLabels",
    "mapTitle",
    "legendTitle",
    "legendPosition",
    "attribution",
    "exportExtent",
  ];

  const state = {};
  for (const key of PERSIST_KEYS) {
    if (storeState[key] !== undefined) {
      state[key] = storeState[key];
    }
  }
  return state;
}

export async function listPublicProjects({ limit = 10, offset = 0 } = {}) {
  if (!supabase) return { data: [], error: null, count: 0 };
  const { data, error, count } = await supabase
    .from("projects")
    .select("id, name, is_public, created_at, updated_at", { count: "exact" })
    .eq("is_public", true)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return { data: data ?? [], error, count };
}

export async function listProjects(userId) {
  if (!supabase) return { data: [], error: null };
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, is_public, created_at, updated_at")
    .eq("user_id", userId)
    .order("updated_at", { ascending: false });
  return { data: data ?? [], error };
}

export async function loadProject(id) {
  if (!supabase) return { data: null, error: null };
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("id", id)
    .single();
  return { data, error };
}

export async function saveProject(userId, name, stateJson, isPublic = false) {
  if (!supabase) return { data: null, error: null };
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name,
      state_json: stateJson,
      is_public: isPublic,
    })
    .select()
    .single();
  return { data, error };
}

export async function updateProject(id, updates) {
  if (!supabase) return { data: null, error: null };
  const { data, error } = await supabase
    .from("projects")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", id)
    .select()
    .single();
  return { data, error };
}

export async function deleteProject(id) {
  if (!supabase) return { error: null };
  const { error } = await supabase.from("projects").delete().eq("id", id);
  return { error };
}
