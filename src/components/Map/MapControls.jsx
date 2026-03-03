import { useEffect, useRef, useState } from 'react'
import useMapStore from '../../store/mapStore'
import { BASEMAP_OPTIONS } from '../../utils/basemapSources'

const BTN = 'bg-paper/90 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-paper transition-all shadow-md text-ink whitespace-nowrap'

export default function MapControls({ onFit, onExport, editMode }) {
  const containerRef = useRef(null)
  const [showBasemaps, setShowBasemaps] = useState(false)
  const basemap = useMapStore((s) => s.basemap)
  const setBasemap = useMapStore((s) => s.setBasemap)

  useEffect(() => {
    if (!showBasemaps) return
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setShowBasemaps(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showBasemaps])

  return (
    <div ref={containerRef} className="absolute top-3 right-3 z-10 flex flex-col items-end gap-1.5">
      {editMode && (
        <>
          <button onClick={onFit} className={BTN} title="Fit to Indonesia">Fit</button>
          <button onClick={onExport} className={BTN} title="Export as PNG">Export</button>
        </>
      )}
      <div className="relative">
        <button
          onClick={() => setShowBasemaps((v) => !v)}
          className={BTN}
          title="Switch basemap"
        >
          🗺 Basemap
        </button>
        {showBasemaps && (
          <div className="absolute top-0 right-full mr-2 bg-paper/95 backdrop-blur-sm border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
            {BASEMAP_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => { setBasemap(opt.key); setShowBasemaps(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-canvas transition-colors ${
                  opt.key === basemap ? 'font-semibold text-accent' : 'text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
