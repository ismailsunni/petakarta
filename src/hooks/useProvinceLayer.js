import { useEffect, useRef } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { Style, Fill, Stroke } from 'ol/style'
import useMapStore from '../store/mapStore'
import { buildColorScale } from '../utils/colorUtils'
import { getBreaks, classifyValue } from '../utils/classificationUtils'

const DEFAULT_STYLE = new Style({
  fill: new Fill({ color: 'transparent' }),
  stroke: new Stroke({ color: '#999999', width: 0.5 }),
})

export default function useProvinceLayer(map) {
  const layerRef = useRef(null)
  const sourceRef = useRef(null)
  const joinResult = useMapStore((s) => s.joinResult)
  const colorPreset = useMapStore((s) => s.colorPreset)
  const colorReversed = useMapStore((s) => s.colorReversed)
  const classMethod = useMapStore((s) => s.classMethod)
  const numClasses = useMapStore((s) => s.numClasses)
  const manualBreaks = useMapStore((s) => s.manualBreaks)
  const strokeColor = useMapStore((s) => s.strokeColor)
  const strokeWidth = useMapStore((s) => s.strokeWidth)
  const noDataColor = useMapStore((s) => s.noDataColor)
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

    if (!joinResult || !joinResult.valueMap) {
      layer.setStyle(DEFAULT_STYLE)
      return
    }

    const { valueMap } = joinResult
    const values = Object.values(valueMap).filter((v) => typeof v === 'number' && !isNaN(v))

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
      const value = valueMap[pcode]

      if (value === undefined || value === null || isNaN(value)) {
        return new Style({
          fill: new Fill({ color: 'transparent' }),
          stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
        })
      }

      const classIndex = classifyValue(value, breaks)
      const color = classColors[classIndex] || noDataColor

      return new Style({
        fill: new Fill({ color }),
        stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
      })
    }

    layer.setStyle(styleFunction)
  }, [joinResult, colorPreset, colorReversed, classMethod, numClasses, manualBreaks, strokeColor, strokeWidth, noDataColor])

  return { layer: layerRef.current, source: sourceRef.current }
}
