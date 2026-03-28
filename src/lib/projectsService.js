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

/**
 * Generate a URL-friendly slug from a title
 */
export function generateSlug(title) {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 60)
}

/**
 * Check if a slug is available
 */
export async function checkSlugAvailable(slug) {
  if (!supabase) return { available: true }
  const { data } = await supabase
    .from('projects')
    .select('id')
    .eq('slug', slug)
    .maybeSingle()
  return { available: !data }
}

/**
 * Find a unique slug, appending a suffix if needed
 */
async function findUniqueSlug(baseSlug) {
  if (!baseSlug) return null
  const { available } = await checkSlugAvailable(baseSlug)
  if (available) return baseSlug
  const withSuffix = `${baseSlug}-${Date.now().toString(36)}`
  return withSuffix
}

export async function listPublicProjects({ limit = 10, offset = 0 } = {}) {
  if (!supabase) return { data: [], error: null, count: 0 };
  const { data, error, count } = await supabase
    .from("projects")
    .select(
      "id, name, visibility, slug, created_at, updated_at, state_json, thumbnail_url, profiles!projects_user_id_profiles_fkey(full_name, username)",
      { count: "exact" }
    )
    .eq("visibility", "public")
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return { data: data ?? [], error, count };
}

export async function listProjects(userId) {
  if (!supabase) return { data: [], error: null };
  const { data, error } = await supabase
    .from("projects")
    .select("id, name, is_public, visibility, slug, created_at, updated_at, thumbnail_url")
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

export async function loadProjectBySlug(slug) {
  if (!supabase) return { data: null, error: null };
  const { data, error } = await supabase
    .from("projects")
    .select("*")
    .eq("slug", slug)
    .in("visibility", ["public", "unlisted"])
    .single();
  return { data, error };
}

export async function saveProject(userId, name, stateJson, visibility = 'private') {
  if (!supabase) return { data: null, error: null };
  const baseSlug = generateSlug(name)
  const slug = await findUniqueSlug(baseSlug)
  const { data, error } = await supabase
    .from("projects")
    .insert({
      user_id: userId,
      name,
      state_json: stateJson,
      visibility,
      is_public: visibility === 'public',
      slug,
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
