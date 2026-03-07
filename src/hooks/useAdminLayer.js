import { useEffect, useRef } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { Style, Fill, Stroke } from 'ol/style'
import { transformExtent } from 'ol/proj'
import useMapStore from '../store/mapStore'
import { getLayer } from '../utils/adminLayers'
import { makeLabelStyle, buildGraduatedStyleFn, buildCategorizedStyleFn } from '../utils/styleUtils'
import { FIT_PADDING } from '../utils/mapConstants'

const DEFAULT_STYLE = new Style({
  fill: new Fill({ color: '#d4d0c8' }),
  stroke: new Stroke({ color: '#ffffff', width: 0.8 }),
})

export default function useAdminLayer(map) {
  const layerRef = useRef(null)
  const sourceRef = useRef(null)
  const adminLayerId = useMapStore((s) => s.adminLayerId)
  const update = useMapStore((s) => s.update)
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
  const showFeatureLabels = useMapStore((s) => s.showFeatureLabels)

  // Load/reload OL layer when map or adminLayerId changes
  useEffect(() => {
    if (!map) return

    const layerConfig = getLayer(adminLayerId)

    const source = new VectorSource({
      url: import.meta.env.BASE_URL + layerConfig.geojsonPath,
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
        const featureData = features.map((f) => ({
          featureId: f.get(layerConfig.featureIdField),
          featureName: f.get(layerConfig.featureNameField),
        }))
        update({ adminFeatures: featureData })

        const extent3857 = transformExtent(layerConfig.bbox, 'EPSG:4326', 'EPSG:3857')
        map.getView().fit(extent3857, { padding: FIT_PADDING, duration: 400 })
      }
    })

    map.addLayer(layer)
    layerRef.current = layer
    sourceRef.current = source

    return () => {
      map.removeLayer(layer)
    }
  }, [map, adminLayerId, update])

  // Update styles when any style-related state changes
  useEffect(() => {
    const layer = layerRef.current
    if (!layer) return

    const layerConfig = getLayer(adminLayerId)

    if (!joinResult?.valueMap) {
      if (showFeatureLabels) {
        layer.setStyle((feature) => [
          new Style({ fill: new Fill({ color: '#d4d0c8' }), stroke: new Stroke({ color: '#ffffff', width: 0.8 }) }),
          makeLabelStyle(feature, layerConfig),
        ])
      } else {
        layer.setStyle(DEFAULT_STYLE)
      }
      return
    }

    const { valueMap } = joinResult
    const styleFunction = styleMode === 'categorized'
      ? buildCategorizedStyleFn({ valueMap, layerConfig, categoryColors, strokeColor, strokeWidth, noDataColor, showFeatureLabels })
      : buildGraduatedStyleFn({ valueMap, layerConfig, numClasses, classMethod, manualBreaks, colorPreset, colorReversed, strokeColor, strokeWidth, noDataColor, showFeatureLabels })

    layer.setStyle(styleFunction || DEFAULT_STYLE)
  }, [map, adminLayerId, joinResult, styleMode, colorPreset, colorReversed, classMethod, numClasses, manualBreaks, categoryColors, strokeColor, strokeWidth, noDataColor, showFeatureLabels])

  return { layer: layerRef.current, source: sourceRef.current }
}
