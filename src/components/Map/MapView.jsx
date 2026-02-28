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
    <div className="relative flex-1 h-full">
      <div ref={containerRef} className="w-full h-full" />
      <Legend />
      <Tooltip map={map} />
      <div className="absolute top-3 right-3 flex flex-col gap-1">
        <button
          onClick={fitToIndonesia}
          className="bg-paper border border-border rounded px-2 py-1 text-sm hover:bg-canvas transition-colors shadow-sm"
          title="Fit to Indonesia"
        >
          Fit
        </button>
        <button
          onClick={() => exportMap(2)}
          className="bg-paper border border-border rounded px-2 py-1 text-sm hover:bg-canvas transition-colors shadow-sm"
          title="Export as PNG"
        >
          Export
        </button>
      </div>
    </div>
  )
}
