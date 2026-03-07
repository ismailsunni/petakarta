import chroma from 'chroma-js'

export const PRESETS = {
  // Sequential
  Blues: ['#f7fbff', '#08306b'],
  Greens: ['#f7fcf5', '#00441b'],
  Reds: ['#fff5f0', '#67000d'],
  Oranges: ['#fff5eb', '#7f2704'],
  Purples: ['#fcfbfd', '#3f007d'],
  YlOrRd: ['#ffffcc', '#800026'],
  OrRd: ['#fff7ec', '#7f0000'],
  PuBu: ['#fff7fb', '#023858'],
  YlGn: ['#ffffe5', '#004529'],
  Viridis: ['#440154', '#482777', '#3e4989', '#31688e', '#26838f', '#1f9d8a', '#6cce5a', '#b6de2b', '#fee825'],
  Magma: ['#000004', '#180f3d', '#440f76', '#721f81', '#9e2f7f', '#cd4071', '#f1605d', '#fc9f6f', '#fcfdbf'],
  Inferno: ['#000004', '#1b0c41', '#4a0c6b', '#781c6d', '#a52c60', '#cf4446', '#ed6925', '#fb9b06', '#f7d13d', '#fcffa4'],
  // Diverging
  RdBu: ['#67001f', '#b2182b', '#d6604d', '#f4a582', '#fddbc7', '#f7f7f7', '#d1e5f0', '#92c5de', '#4393c3', '#2166ac', '#053061'],
  BrBG: ['#543005', '#8c510a', '#bf812d', '#dfc27d', '#f6e8c3', '#f5f5f5', '#c7eae5', '#80cdc1', '#35978f', '#01665e', '#003c30'],
  Spectral: ['#9e0142', '#d53e4f', '#f46d43', '#fdae61', '#fee08b', '#ffffbf', '#e6f598', '#abdda4', '#66c2a5', '#3288bd', '#5e4fa2'],
  PiYG: ['#8e0152', '#c51b7d', '#de77ae', '#f1b6da', '#fde0ef', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#276419'],
  PRGn: ['#40004b', '#762a83', '#9970ab', '#c2a5cf', '#e7d4e8', '#f7f7f7', '#d9f0d3', '#a6dba0', '#5aae61', '#1b7837', '#00441b'],
}

export const PRESET_GROUPS = {
  Sequential: ['Blues', 'Greens', 'Reds', 'Oranges', 'Purples', 'YlOrRd', 'OrRd', 'PuBu', 'YlGn', 'Viridis', 'Magma', 'Inferno'],
  Diverging: ['RdBu', 'BrBG', 'Spectral', 'PiYG', 'PRGn'],
}

export function buildColorScale(presetKey, numClasses, reversed) {
  const colors = PRESETS[presetKey]
  if (!colors) return null
  const colorList = reversed ? [...colors].reverse() : colors
  return chroma.scale(colorList).mode('lab').classes(numClasses)
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
