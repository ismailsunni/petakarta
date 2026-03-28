import { Style, Fill, Stroke, Text } from 'ol/style'
import { buildColorScale } from './colorUtils'
import { getBreaks, classifyValue } from './classificationUtils'

export function makeLabelStyle(feature, labelField, labelFontSize = 11, labelColor = '#1a1a2e') {
  const geom = feature.getGeometry()
  let labelPoint
  if (geom.getType() === 'MultiPolygon') {
    const polygons = geom.getPolygons()
    let largest = polygons[0]
    let maxArea = largest.getArea()
    for (let i = 1; i < polygons.length; i++) {
      const area = polygons[i].getArea()
      if (area > maxArea) {
        largest = polygons[i]
        maxArea = area
      }
    }
    labelPoint = largest.getInteriorPoint()
  } else {
    labelPoint = geom.getInteriorPoint()
  }

  const labelText = feature.get(labelField)
  if (!labelText) return null

  return new Style({
    geometry: labelPoint,
    text: new Text({
      text: String(labelText),
      font: `${labelFontSize}px "IBM Plex Sans", sans-serif`,
      fill: new Fill({ color: labelColor }),
      stroke: new Stroke({ color: '#ffffff', width: 3 }),
      overflow: false,
      padding: [2, 4, 2, 4],
    }),
  })
}

export function buildGraduatedStyleFn({
  valueMap, layerConfig, numClasses, classMethod, manualBreaks,
  colorPreset, colorReversed, strokeColor, strokeWidth, noDataColor, showFeatureLabels, labelColumn,
  labelFontSize = 11, labelColor = '#1a1a2e',
}) {
  const numericMap = {}
  for (const [code, raw] of Object.entries(valueMap)) {
    const n = Number(raw)
    if (!isNaN(n)) numericMap[code] = n
  }

  const values = Object.values(numericMap)
  if (values.length === 0) return null

  const effectiveClasses = Math.min(numClasses, values.length)
  const breaks = (classMethod === 'manual' && manualBreaks.length === effectiveClasses + 1)
    ? manualBreaks
    : getBreaks(values, classMethod, effectiveClasses)

  const scale = buildColorScale(colorPreset, effectiveClasses, colorReversed)
  if (!scale || breaks.length < 2) return null

  const classColors = []
  for (let i = 0; i < effectiveClasses; i++) {
    const t = effectiveClasses === 1 ? 0.5 : i / (effectiveClasses - 1)
    classColors.push(scale(t).hex())
  }

  // Use labelColumn if provided, otherwise default to featureNameField
  const labelField = labelColumn || layerConfig.featureNameField

  return (feature) => {
    const featureCode = feature.get(layerConfig.featureIdField)
    const value = numericMap[featureCode]

    let fillColor
    if (value === undefined || value === null || isNaN(value)) {
      fillColor = noDataColor
    } else {
      fillColor = classColors[classifyValue(value, breaks)] || noDataColor
    }

    const styles = [new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
    })]
    if (showFeatureLabels) {
      const labelStyle = makeLabelStyle(feature, labelField, labelFontSize, labelColor)
      if (labelStyle) styles.push(labelStyle)
    }
    return styles
  }
}

export function buildCategorizedStyleFn({
  valueMap, layerConfig, categoryColors, strokeColor, strokeWidth, noDataColor, showFeatureLabels, labelColumn,
  labelFontSize = 11, labelColor = '#1a1a2e',
}) {
  // Use labelColumn if provided, otherwise default to featureNameField
  const labelField = labelColumn || layerConfig.featureNameField

  return (feature) => {
    const featureCode = feature.get(layerConfig.featureIdField)
    const value = valueMap[featureCode]

    const fillColor = (value === undefined || value === null || value === '')
      ? noDataColor
      : (categoryColors[String(value)] || noDataColor)

    const styles = [new Style({
      fill: new Fill({ color: fillColor }),
      stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
    })]
    if (showFeatureLabels) {
      const labelStyle = makeLabelStyle(feature, labelField, labelFontSize, labelColor)
      if (labelStyle) styles.push(labelStyle)
    }
    return styles
  }
}
