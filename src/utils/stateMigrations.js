import { DEFAULT_LAYER_ID } from './adminLayers'

export function migrateShowBasemap(state) {
  if ('showBasemap' in state && !('basemap' in state)) {
    const { showBasemap, ...rest } = state
    return { ...rest, basemap: showBasemap === false ? 'none' : 'osm' }
  }
  return state
}

export function migrateAdminLayerId(state) {
  if (!('adminLayerId' in state)) {
    return { ...state, adminLayerId: DEFAULT_LAYER_ID }
  }
  return state
}

export function migrateProvinceLabels(state) {
  let s = state
  if ('provinceFeatures' in s) {
    const { provinceFeatures, ...rest } = s
    s = rest
  }
  if ('showProvinceLabels' in s && !('showFeatureLabels' in s)) {
    const { showProvinceLabels, ...rest } = s
    s = { ...rest, showFeatureLabels: showProvinceLabels ?? false }
  }
  return s
}

export function applyAllMigrations(state) {
  let s = migrateShowBasemap(state)
  s = migrateAdminLayerId(s)
  s = migrateProvinceLabels(s)
  return s
}
