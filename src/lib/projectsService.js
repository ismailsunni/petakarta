import { supabase } from './supabase'

const PERSIST_KEYS = [
  'csvData', 'csvColumns', 'keyColumn', 'keyType', 'valueColumn', 'joinResult',
  'styleMode', 'colorPreset', 'colorReversed', 'classMethod', 'numClasses',
  'manualBreaks', 'categoryColors', 'strokeColor', 'strokeWidth', 'noDataColor',
  'showBasemap', 'showProvinceLabels', 'mapTitle', 'legendTitle', 'legendPosition', 'attribution',
]

export function extractProjectState(storeState) {
  const state = {}
  for (const key of PERSIST_KEYS) {
    state[key] = storeState[key]
  }
  return state
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
