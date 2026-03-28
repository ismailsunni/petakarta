import { useRef, useCallback, useEffect } from 'react'
import useMapInstance from '../../hooks/useMapInstance'
import useAdminLayer from '../../hooks/useAdminLayer'
import useUserLayers from '../../hooks/useUserLayers'
import useCatalogLayers from '../../hooks/useCatalogLayers'
import useMapExport from '../../hooks/useMapExport'
import useLayerTreeStore from '../../store/layerTreeStore'
import { useExportContext } from '../../contexts/ExportContext'
import { captureMapThumbnail } from '../../utils/thumbnailUtils'
import ExportBounds from './ExportBounds'
import Legend from './Legend'
import MapAttribution from './MapAttribution'
import MapTitle from './MapTitle'
import Tooltip from './Tooltip'
import MapControls from './MapControls'
import { transformExtent } from 'ol/proj'
import { FIT_PADDING } from '../../utils/mapConstants'
import { getLayer } from '../../utils/adminLayers'

export default function MapView() {
  const containerRef = useRef(null)
  const { map } = useMapInstance(containerRef)
  useAdminLayer(map)
  useUserLayers(map)
  useCatalogLayers(map)
  const { exportMap } = useMapExport(map)
  const exportFnRef = useExportContext()
  const viewMode = useLayerTreeStore((s) => s.viewMode)
  const selectedLayerId = useLayerTreeStore((s) => s.selectedLayerId)
  const layers = useLayerTreeStore((s) => s.layers)

  const exportExtent = useLayerTreeStore((s) => s.exportExtent)

  useEffect(() => {
    exportFnRef.current = exportMap
  }, [exportMap, exportFnRef])

  const zoomToMapExtent = useCallback(() => {
    if (!map) return

    // Get current state from store (in case layers changed)
    const currentLayers = useLayerTreeStore.getState().layers
    const currentExportExtent = useLayerTreeStore.getState().exportExtent

    // If a specific layer is selected for export extent, zoom to it
    if (currentExportExtent) {
      const selectedLayer = currentLayers.find(l => l.id === currentExportExtent)
      if (selectedLayer) {
        let bbox = null
        if (selectedLayer.type === 'admin') {
          const layerConfig = getLayer(selectedLayer.adminConfig?.adminLayerId)
          bbox = layerConfig?.bbox
        } else if (selectedLayer.userConfig?.bbox) {
          bbox = selectedLayer.userConfig.bbox
        }
        if (bbox && bbox.length === 4) {
          const extent = transformExtent(bbox, 'EPSG:4326', 'EPSG:3857')
          map.getView().fit(extent, { padding: FIT_PADDING, duration: 500 })
          return
        }
      }
    }

    // Otherwise zoom to first admin layer if available
    const adminLayer = currentLayers.find(l => l.type === 'admin')
    if (adminLayer?.adminConfig?.adminLayerId) {
      const layerConfig = getLayer(adminLayer.adminConfig.adminLayerId)
      if (layerConfig?.bbox) {
        const extent = transformExtent(layerConfig.bbox, 'EPSG:4326', 'EPSG:3857')
        map.getView().fit(extent, { padding: FIT_PADDING, duration: 500 })
      }
    }
  }, [map])

  // Listen for zoomToMapExtent event (triggered when project loads)
  useEffect(() => {
    const handleZoomToExtent = () => {
      if (map) map.updateSize()
      zoomToMapExtent()
    }
    window.addEventListener('zoomToMapExtent', handleZoomToExtent)
    // Also re-fit on resize (handles iframe embed sizing)
    window.addEventListener('resize', handleZoomToExtent)
    return () => {
      window.removeEventListener('zoomToMapExtent', handleZoomToExtent)
      window.removeEventListener('resize', handleZoomToExtent)
    }
  }, [map, zoomToMapExtent])

  // Listen for captureThumbnail event from Header
  useEffect(() => {
    const handleCapture = async () => {
      const dataUrl = await captureMapThumbnail(map)
      window.dispatchEvent(new CustomEvent('thumbnailCaptured', { detail: { dataUrl } }))
    }
    window.addEventListener('captureThumbnail', handleCapture)
    return () => window.removeEventListener('captureThumbnail', handleCapture)
  }, [map])

  return (
    <div className="relative flex-1 h-full">
      <div ref={containerRef} className="w-full h-full" />
      <MapTitle />
      <ExportBounds map={map} />
      <Legend />
      <MapAttribution />
      <Tooltip map={map} />
      <MapControls
        onFit={zoomToMapExtent}
        onExport={() => exportMap(2)}
      />
      {viewMode === 'view' && (
        <a
          href={import.meta.env.BASE_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="absolute bottom-2 right-2 z-10 bg-paper/80 backdrop-blur-sm text-xs text-muted hover:text-ink px-2 py-1 rounded shadow-sm transition-colors"
        >
          Made with PetaKarta
        </a>
      )}

    </div>
  )
}
