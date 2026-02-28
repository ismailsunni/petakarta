import { useRef, useCallback, useEffect } from 'react'
import useMapInstance from '../../hooks/useMapInstance'
import useProvinceLayer from '../../hooks/useProvinceLayer'
import useMapExport from '../../hooks/useMapExport'
import useMapStore from '../../store/mapStore'
import Legend from './Legend'
import Tooltip from './Tooltip'
import { fromLonLat } from 'ol/proj'

const INDONESIA_BBOX = [94.5, -11.5, 141.5, 6.5]

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
    const extent = [
      ...fromLonLat([INDONESIA_BBOX[0], INDONESIA_BBOX[1]]),
      ...fromLonLat([INDONESIA_BBOX[2], INDONESIA_BBOX[3]]),
    ]
    map.getView().fit(extent, { padding: [20, 20, 20, 20], duration: 500 })
  }, [map])

  return (
    <div className="relative w-full max-h-full" style={{ aspectRatio: '5 / 2' }}>
      <div ref={containerRef} className="absolute inset-0" />
      <Legend />
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
