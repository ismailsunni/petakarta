import chroma from 'chroma-js'

export const PRESETS = {
  // Sequential
  Blues: ['#f7fbff', '#08306b'],
  Greens: ['#f7fcf5', '#00441b'],
  Reds: ['#fff5f0', '#67000d'],
  YlOrRd: ['#ffffcc', '#800026'],
  Viridis: ['#440154', '#482777', '#3e4989', '#31688e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'],
  Magma: ['#000004', '#180f3d', '#440f76', '#721f81', '#9e2f7f', '#cd4071', '#f1605d', '#fc9f6f', '#fcfdbf'],
  // Diverging
  RdBu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
  BrBG: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
}

export const PRESET_GROUPS = {
  Sequential: ['Blues', 'Greens', 'Reds', 'YlOrRd', 'Viridis', 'Magma'],
  Diverging: ['RdBu', 'BrBG'],
}

export function buildColorScale(presetKey, numClasses, reversed) {
  const colors = PRESETS[presetKey]
  if (!colors) return null
  let scale = chroma.scale(colors).mode('lab')
  if (reversed) scale = scale.domain([1, 0])
  return scale.classes(numClasses)
}

// Qualitative palette for categorized maps (12 distinct colors)
export const QUALITATIVE_COLORS = [
  '#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00',
  '#a65628', '#f781bf', '#999999', '#66c2a5', '#fc8d62',
  '#8da0cb', '#e78ac3',
]

export function getCategoryColor(index) {
  return QUALITATIVE_COLORS[index % QUALITATIVE_COLORS.length]
}

export function getSwatchColors(presetKey, count = 7) {
  const colors = PRESETS[presetKey]
  if (!colors) return []
  return chroma.scale(colors).mode('lab').colors(count)
}
