import { supabase } from './supabase'

const PERSIST_KEYS = [
  'csvData', 'csvColumns', 'keyColumn', 'keyType', 'valueColumn', 'joinResult',
  'adminLayerId',
  'styleMode', 'colorPreset', 'colorReversed', 'classMethod', 'numClasses',
  'manualBreaks', 'categoryColors', 'strokeColor', 'strokeWidth', 'noDataColor',
  'basemap', 'showFeatureLabels', 'mapTitle', 'legendTitle', 'legendPosition', 'attribution',
]

export function normalizeProjectState(state) {
  if (!state) return state
  let s = state
  if ('showBasemap' in s && !('basemap' in s)) {
    const { showBasemap, ...rest } = s
    s = { ...rest, basemap: showBasemap === false ? 'none' : 'osm' }
  }
  if (!('adminLayerId' in s)) {
    s = { ...s, adminLayerId: 'idn-province' }
  }
  if ('showProvinceLabels' in s && !('showFeatureLabels' in s)) {
    const { showProvinceLabels, ...rest } = s
    s = { ...rest, showFeatureLabels: showProvinceLabels }
  }
  return s
}

export function extractProjectState(storeState) {
  const state = {}
  for (const key of PERSIST_KEYS) {
    state[key] = storeState[key]
  }
  return state
}

export async function listPublicProjects({ limit = 10, offset = 0 } = {}) {
  if (!supabase) return { data: [], error: null, count: 0 }
  const { data, error, count } = await supabase
    .from('projects')
    .select('id, name, is_public, created_at, updated_at', { count: 'exact' })
    .eq('is_public', true)
    .order('updated_at', { ascending: false })
    .range(offset, offset + limit - 1)
  return { data: data ?? [], error, count }
}

export async function listProjects(userId) {
  if (!supabase) return { data: [], error: null }
  const { data, error } = await supabase
    .from('projects')
    .select('id, name, is_public, created_at, updated_at')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
  return { data: data ?? [], error }
}

export async function loadProject(id) {
  if (!supabase) return { data: null, error: null }
  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .single()
  return { data, error }
}

export async function saveProject(userId, name, stateJson, isPublic = false) {
  if (!supabase) return { data: null, error: null }
  const { data, error } = await supabase
    .from('projects')
    .insert({ user_id: userId, name, state_json: stateJson, is_public: isPublic })
    .select()
    .single()
  return { data, error }
}

export async function updateProject(id, updates) {
  if (!supabase) return { data: null, error: null }
  const { data, error } = await supabase
    .from('projects')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', id)
    .select()
    .single()
  return { data, error }
}

export async function deleteProject(id) {
  if (!supabase) return { error: null }
  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', id)
  return { error }
}
