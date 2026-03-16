import { useEffect, useRef, useCallback } from 'react'
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

  // Function to update bounds from current view
  const updateCurrentViewBounds = useCallback(() => {
    if (!map || !sourceRef.current) return
    
    sourceRef.current.clear()
    const view = map.getView()
    const extent = view.calculateExtent(map.getSize())
    
    // Add padding (shrink the extent by ~5% on each side)
    const width = extent[2] - extent[0]
    const height = extent[3] - extent[1]
    const paddingX = width * 0.05
    const paddingY = height * 0.05
    const paddedExtent = [
      extent[0] + paddingX,
      extent[1] + paddingY,
      extent[2] - paddingX,
      extent[3] - paddingY,
    ]
    
    const feature = new Feature(fromExtent(paddedExtent))
    sourceRef.current.addFeature(feature)
  }, [map])

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

  // Listen to view changes when "current view" is selected
  useEffect(() => {
    if (!map) return

    // Only listen when current view is selected (empty string)
    if (exportExtent !== '') return

    // Update immediately
    updateCurrentViewBounds()

    // Listen for view changes
    const view = map.getView()
    const handleChange = () => updateCurrentViewBounds()
    
    view.on('change:center', handleChange)
    view.on('change:resolution', handleChange)

    return () => {
      view.un('change:center', handleChange)
      view.un('change:resolution', handleChange)
    }
  }, [map, exportExtent, updateCurrentViewBounds])

  // Update extent display when layer selection changes
  useEffect(() => {
    if (!sourceRef.current) return

    // Current view is handled by the other effect
    if (exportExtent === '') return

    sourceRef.current.clear()

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
