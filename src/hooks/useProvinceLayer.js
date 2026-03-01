import { useEffect, useRef } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { Style, Fill, Stroke, Text } from 'ol/style'
import useMapStore from '../store/mapStore'
import { buildColorScale } from '../utils/colorUtils'
import { getBreaks, classifyValue } from '../utils/classificationUtils'

const DEFAULT_STYLE = new Style({
  fill: new Fill({ color: '#d4d0c8' }),
  stroke: new Stroke({ color: '#ffffff', width: 0.8 }),
})

export default function useProvinceLayer(map) {
  const layerRef = useRef(null)
  const sourceRef = useRef(null)
  const joinResult = useMapStore((s) => s.joinResult)
  const styleMode = useMapStore((s) => s.styleMode)
  const colorPreset = useMapStore((s) => s.colorPreset)
  const colorReversed = useMapStore((s) => s.colorReversed)
  const classMethod = useMapStore((s) => s.classMethod)
  const numClasses = useMapStore((s) => s.numClasses)
  const manualBreaks = useMapStore((s) => s.manualBreaks)
  const categoryColors = useMapStore((s) => s.categoryColors)
  const strokeColor = useMapStore((s) => s.strokeColor)
  const strokeWidth = useMapStore((s) => s.strokeWidth)
  const noDataColor = useMapStore((s) => s.noDataColor)
  const showProvinceLabels = useMapStore((s) => s.showProvinceLabels)
  const setProvinceFeatures = useMapStore((s) => s.setProvinceFeatures)

  useEffect(() => {
    if (!map) return

    const source = new VectorSource({
      url: import.meta.env.BASE_URL + 'data/indonesia_provinces.geojson',
      format: new GeoJSON(),
    })

    const layer = new VectorLayer({
      source,
      style: DEFAULT_STYLE,
      declutter: true,
    })

    source.once('change', () => {
      if (source.getState() === 'ready') {
        const features = source.getFeatures()
        const provinceData = features.map((f) => ({
          ADM1_PCODE: f.get('ADM1_PCODE'),
          province_name: f.get('province_name'),
        }))
        setProvinceFeatures(provinceData)
      }
    })

    map.addLayer(layer)
    layerRef.current = layer
    sourceRef.current = source

    return () => {
      map.removeLayer(layer)
    }
  }, [map, setProvinceFeatures])

  // Update styles when any style-related state changes
  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return

    const makeLabelStyle = (feature) => {
      if (!showProvinceLabels) return null
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
      return new Style({
        geometry: labelPoint,
        text: new Text({
          text: feature.get('province_name'),
          font: '11px "IBM Plex Sans", sans-serif',
          fill: new Fill({ color: '#1a1a2e' }),
          stroke: new Stroke({ color: '#ffffff', width: 3 }),
          overflow: true,
        }),
      })
    }

    if (!joinResult || !joinResult.valueMap) {
      if (showProvinceLabels) {
        layer.setStyle((feature) => {
          const styles = [new Style({
            fill: new Fill({ color: '#d4d0c8' }),
            stroke: new Stroke({ color: '#ffffff', width: 0.8 }),
          })]
          const label = makeLabelStyle(feature)
          if (label) styles.push(label)
          return styles
        })
      } else {
        layer.setStyle(DEFAULT_STYLE)
      }
      return
    }

    const { valueMap } = joinResult

    if (styleMode === 'categorized') {
      // Categorized: use raw string values and categoryColors map
      const styleFunction = (feature) => {
        const pcode = feature.get('ADM1_PCODE')
        const value = valueMap[pcode]

        const fillColor = (value === undefined || value === null || value === '')
          ? noDataColor
          : (categoryColors[String(value)] || noDataColor)

        const styles = [new Style({
          fill: new Fill({ color: fillColor }),
          stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
        })]
        const label = makeLabelStyle(feature)
        if (label) styles.push(label)
        return styles
      }

      layer.setStyle(styleFunction)
      return
    }

    // Graduated: parse values to numbers
    const numericMap = {}
    for (const [pcode, raw] of Object.entries(valueMap)) {
      const n = Number(raw)
      if (!isNaN(n)) numericMap[pcode] = n
    }

    const values = Object.values(numericMap)

    if (values.length === 0) {
      layer.setStyle(DEFAULT_STYLE)
      return
    }

    // Compute breaks
    const effectiveClasses = Math.min(numClasses, values.length)
    let breaks
    if (classMethod === 'manual' && manualBreaks.length === effectiveClasses + 1) {
      breaks = manualBreaks
    } else {
      breaks = getBreaks(values, classMethod, effectiveClasses)
    }

    // Build color scale
    const scale = buildColorScale(colorPreset, effectiveClasses, colorReversed)
    if (!scale || breaks.length < 2) {
      layer.setStyle(DEFAULT_STYLE)
      return
    }

    // Precompute class colors
    const classColors = []
    for (let i = 0; i < effectiveClasses; i++) {
      const t = effectiveClasses === 1 ? 0.5 : i / (effectiveClasses - 1)
      classColors.push(scale(t).hex())
    }

    const styleFunction = (feature) => {
      const pcode = feature.get('ADM1_PCODE')
      const value = numericMap[pcode]

      let fillColor
      if (value === undefined || value === null || isNaN(value)) {
        fillColor = noDataColor
      } else {
        const classIndex = classifyValue(value, breaks)
        fillColor = classColors[classIndex] || noDataColor
      }

      const styles = [new Style({
        fill: new Fill({ color: fillColor }),
        stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
      })]
      const label = makeLabelStyle(feature)
      if (label) styles.push(label)
      return styles
    }

    layer.setStyle(styleFunction)
  }, [map, joinResult, styleMode, colorPreset, colorReversed, classMethod, numClasses, manualBreaks, categoryColors, strokeColor, strokeWidth, noDataColor, showProvinceLabels])

  return { layer: layerRef.current, source: sourceRef.current }
}
