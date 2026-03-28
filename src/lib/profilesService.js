import { supabase } from './supabase'

export async function fetchProfile(userId) {
  if (!supabase) return { data: null, error: null }
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single()
  return { data, error }
}

export async function updateProfile(userId, updates) {
  if (!supabase) return { data: null, error: null }
  const { data, error } = await supabase
    .from('profiles')
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq('id', userId)
    .select()
    .single()
  return { data, error }
}

export async function checkUsernameAvailable(username) {
  if (!supabase) return { available: true }
  const { data } = await supabase
    .from('profiles')
    .select('id')
    .eq('username', username)
    .maybeSingle()
  return { available: !data }
}
