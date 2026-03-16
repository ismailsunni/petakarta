import { useEffect, useRef } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import { fromExtent } from 'ol/geom/Polygon'
import { Style, Stroke, Fill } from 'ol/style'
import { transformExtent } from 'ol/proj'
import useLayerTreeStore from '../../store/layerTreeStore'
import { getLayer } from '../../utils/adminLayers'

const boundsStyle = new Style({
  stroke: new Stroke({ color: 'rgba(59, 130, 246, 0.8)', width: 2, lineDash: [8, 6] }),
  fill: new Fill({ color: 'rgba(59, 130, 246, 0.05)' }),
})

export default function ExportBounds({ map }) {
  const layerRef = useRef(null)
  const sourceRef = useRef(null)
  const exportExtent = useLayerTreeStore((s) => s.exportExtent)
  const layers = useLayerTreeStore((s) => s.layers)

  // Initialize layer once
  useEffect(() => {
    if (!map) return

    const source = new VectorSource()
    const layer = new VectorLayer({
      source,
      style: boundsStyle,
      zIndex: 100,
    })

    map.addLayer(layer)
    layerRef.current = layer
    sourceRef.current = source

    return () => {
      map.removeLayer(layer)
      layerRef.current = null
      sourceRef.current = null
    }
  }, [map])

  // Update extent when selection changes
  useEffect(() => {
    if (!sourceRef.current) return

    sourceRef.current.clear()

    // Don't show bounds for "current view"
    if (exportExtent === 'current') return

    // Find the selected layer
    const selectedLayer = layers.find((l) => l.id === exportExtent)
    if (!selectedLayer) return

    let bbox = null
    if (selectedLayer.type === 'admin') {
      const layerConfig = getLayer(selectedLayer.adminConfig?.adminLayerId)
      bbox = layerConfig?.bbox
    } else if (selectedLayer.userConfig?.bbox) {
      bbox = selectedLayer.userConfig.bbox
    }

    if (bbox && bbox.length === 4) {
      const extent3857 = transformExtent(bbox, 'EPSG:4326', 'EPSG:3857')
      const feature = new Feature(fromExtent(extent3857))
      sourceRef.current.addFeature(feature)
    }
  }, [exportExtent, layers])

  return null
}
