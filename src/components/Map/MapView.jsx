import { useRef, useCallback, useEffect } from 'react'
import useMapInstance from '../../hooks/useMapInstance'
import useAdminLayer from '../../hooks/useAdminLayer'
import useUserLayers from '../../hooks/useUserLayers'
import useMapExport from '../../hooks/useMapExport'
import useLayerTreeStore from '../../store/layerTreeStore'
import { useExportContext } from '../../contexts/ExportContext'
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
  const { exportMap } = useMapExport(map)
  const exportFnRef = useExportContext()
  const viewMode = useLayerTreeStore((s) => s.viewMode)
  const selectedLayerId = useLayerTreeStore((s) => s.selectedLayerId)
  const layers = useLayerTreeStore((s) => s.layers)

  useEffect(() => {
    exportFnRef.current = exportMap
  }, [exportMap, exportFnRef])

  const fitToLayer = useCallback(() => {
    if (!map) return
    // Find the selected layer or first admin layer to fit to
    const selectedLayer = layers.find(l => l.id === selectedLayerId)
    const adminLayer = selectedLayer?.type === 'admin'
      ? selectedLayer
      : layers.find(l => l.type === 'admin')

    if (adminLayer?.adminConfig?.adminLayerId) {
      const { bbox } = getLayer(adminLayer.adminConfig.adminLayerId)
      const extent = transformExtent(bbox, 'EPSG:4326', 'EPSG:3857')
      map.getView().fit(extent, { padding: FIT_PADDING, duration: 500 })
    }
  }, [map, selectedLayerId, layers])

  return (
    <div className="relative flex-1 h-full">
      <div ref={containerRef} className="w-full h-full" />
      <MapTitle />
      <ExportBounds map={map} />
      <Legend />
      <MapAttribution />
      <Tooltip map={map} />
      <MapControls
        onFit={fitToLayer}
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
