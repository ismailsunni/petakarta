import { useEffect, useRef, useState } from 'react'
import Control from 'ol/control/Control'
import useMapStore from '../../store/mapStore'
import { BASEMAP_OPTIONS } from '../../utils/basemapSources'

export default function BasemapControl({ map }) {
  const containerRef = useRef(null)
  const [open, setOpen] = useState(false)
  const basemap = useMapStore((s) => s.basemap)
  const update = useMapStore((s) => s.update)

  useEffect(() => {
    if (!map || !containerRef.current) return
    const control = new Control({ element: containerRef.current })
    map.addControl(control)
    return () => map.removeControl(control)
  }, [map])

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const current = BASEMAP_OPTIONS.find((o) => o.key === basemap)

  return (
    <div
      ref={containerRef}
      className="ol-unselectable ol-control"
      style={{ position: 'absolute', bottom: '2rem', left: '0.5rem' }}
    >
      <div className="relative">
        {open && (
          <div className="absolute bottom-full mb-1 left-0 bg-paper/95 backdrop-blur-sm border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
            {BASEMAP_OPTIONS.map((opt) => (
              <button
                key={opt.key}
                onClick={() => { update({ basemap: opt.key }); setOpen(false) }}
                className={`w-full text-left px-3 py-1.5 text-xs hover:bg-canvas transition-colors ${
                  opt.key === basemap ? 'font-semibold text-accent' : 'text-ink'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        )}
        <button
          onClick={() => setOpen((o) => !o)}
          className="bg-paper/90 backdrop-blur-sm border border-border rounded-lg px-2.5 py-1.5 text-xs font-medium hover:bg-paper transition-all shadow-md flex items-center gap-1.5"
          title="Switch basemap"
        >
          <span>🗺</span>
          <span>{current?.label ?? 'Basemap'}</span>
        </button>
      </div>
    </div>
  )
}
