import { useRef, useCallback, useEffect } from 'react'
import useMapInstance from '../../hooks/useMapInstance'
import useProvinceLayer from '../../hooks/useProvinceLayer'
import useMapExport from '../../hooks/useMapExport'
import useMapStore from '../../store/mapStore'
import ExportBounds from './ExportBounds'
import Legend from './Legend'
import Tooltip from './Tooltip'
import { INDONESIA_EXTENT_3857, FIT_PADDING } from '../../utils/mapConstants'

export default function MapView() {
  const containerRef = useRef(null)
  const { map } = useMapInstance(containerRef)
  useProvinceLayer(map)
  const { exportMap } = useMapExport(map)
  const setExportMapFn = useMapStore((s) => s.setExportMapFn)

  useEffect(() => {
    if (exportMap) setExportMapFn(exportMap)
  }, [exportMap, setExportMapFn])

  const fitToIndonesia = useCallback(() => {
    if (!map) return
    map.getView().fit(INDONESIA_EXTENT_3857, { padding: FIT_PADDING, duration: 500 })
  }, [map])

  return (
    <div className="relative flex-1 h-full">
      <div ref={containerRef} className="w-full h-full" />
      <ExportBounds map={map}>
        <Legend />
      </ExportBounds>
      <Tooltip map={map} />
      <div className="absolute top-3 right-3 flex flex-col gap-1.5 z-10">
        <button
          onClick={fitToIndonesia}
          className="bg-paper/90 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-paper transition-all shadow-md"
          title="Fit to Indonesia"
        >
          Fit
        </button>
        <button
          onClick={() => exportMap(2)}
          className="bg-paper/90 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-paper transition-all shadow-md"
          title="Export as PNG"
        >
          Export
        </button>
      </div>
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 md:hidden bg-ink/80 backdrop-blur-sm text-paper text-xs px-4 py-2 rounded-full shadow-lg">
        Use desktop for full editing features
      </div>
    </div>
  )
}
