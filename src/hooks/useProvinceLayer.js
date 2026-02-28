import { useEffect, useRef } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { Style, Fill, Stroke } from 'ol/style'
import useMapStore from '../store/mapStore'

const DEFAULT_STYLE = new Style({
  fill: new Fill({ color: '#d4d0c8' }),
  stroke: new Stroke({ color: '#ffffff', width: 0.8 }),
})

export default function useProvinceLayer(map) {
  const layerRef = useRef(null)
  const sourceRef = useRef(null)
  const joinResult = useMapStore((s) => s.joinResult)
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

  // Update styles when join result or style settings change
  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return

    if (!joinResult || !joinResult.valueMap) {
      layer.setStyle(DEFAULT_STYLE)
      return
    }

    const { valueMap } = joinResult
    const values = Object.values(valueMap)
    const min = Math.min(...values)
    const max = Math.max(...values)
    const range = max - min || 1

    // Simple linear color ramp for P1 (Viridis-like: yellow to purple)
    const styleFunction = (feature) => {
      const pcode = feature.get('ADM1_PCODE')
      const value = valueMap[pcode]

      if (value === undefined) {
        return new Style({
          fill: new Fill({ color: noDataColor }),
          stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
        })
      }

      const t = (value - min) / range
      const r = Math.round(68 + t * (253 - 68))
      const g = Math.round(1 + t * (231 - 1))
      const b = Math.round(84 + t * (37 - 84))
      const color = `rgb(${r},${g},${b})`

      return new Style({
        fill: new Fill({ color }),
        stroke: new Stroke({ color: strokeColor, width: strokeWidth }),
      })
    }

    layer.setStyle(styleFunction)
  }, [joinResult, strokeColor, strokeWidth, noDataColor])

  return { layer: layerRef.current, source: sourceRef.current }
}
