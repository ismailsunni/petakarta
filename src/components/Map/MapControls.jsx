import { useEffect, useRef, useState } from 'react'
import useMapStore from '../../store/mapStore'
import { BASEMAP_OPTIONS } from '../../utils/basemapSources'

const BTN = 'relative group bg-paper/90 backdrop-blur-sm border border-border rounded-lg p-2 hover:bg-paper transition-all shadow-md text-ink flex items-center justify-center'

function Tooltip({ children }) {
  return (
    <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-1.5 px-2 py-1 bg-ink text-paper text-[10px] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-50">
      {children}
    </div>
  )
}

function FitIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M1 4V1h3M10 1h3v3M13 10v3h-3M4 13H1v-3" />
      <circle cx="7" cy="7" r="2" />
    </svg>
  )
}

function ExportIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M7 1v7M4 5l3 3 3-3" />
      <path d="M1 10v2a1 1 0 0 0 1 1h10a1 1 0 0 0 1-1v-2" />
    </svg>
  )
}

function BasemapIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M1 3.5L5 2l4 2 4-1.5v8L9 12 5 10 1 11.5V3.5Z" />
      <path d="M5 2v8M9 4v8" />
    </svg>
  )
}

function ShareIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="2.5" r="1.5" />
      <circle cx="11" cy="11.5" r="1.5" />
      <circle cx="3" cy="7" r="1.5" />
      <path d="M4.5 6.2L9.5 3.3M4.5 7.8l5 2.9" />
    </svg>
  )
}

export default function MapControls({ onFit, onExport }) {
  const containerRef = useRef(null)
  const [showBasemaps, setShowBasemaps] = useState(false)
  const [copied, setCopied] = useState(false)
  const basemap = useMapStore((s) => s.basemap)
  const setBasemap = useMapStore((s) => s.setBasemap)
  const activeProjectId = useMapStore((s) => s.activeProjectId)

  useEffect(() => {
    if (!showBasemaps) return
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setShowBasemaps(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [showBasemaps])

  const handleShare = () => {
    if (!activeProjectId) return
    const url = `${window.location.origin}${import.meta.env.BASE_URL}?project=${activeProjectId}`
    navigator.clipboard.writeText(url).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }

  return (
    <div ref={containerRef} className="absolute top-3 right-3 z-10 flex items-start gap-1.5">
      <button onClick={onFit} className={BTN} title="Fit to Indonesia">
        <FitIcon />
        <Tooltip>Fit to Indonesia</Tooltip>
      </button>

      <button onClick={onExport} className={BTN} title="Export as PNG">
        <ExportIcon />
        <Tooltip>Export as PNG</Tooltip>
      </button>

      {activeProjectId && (
        <button onClick={handleShare} className={BTN} title="Copy share link">
          <ShareIcon />
          <Tooltip>{copied ? 'Copied!' : 'Copy share link'}</Tooltip>
        </button>
      )}

      <div className="relative">
        <button
          onClick={() => setShowBasemaps((v) => !v)}
          className={BTN}
          title="Switch basemap"
        >
          <BasemapIcon />
          <Tooltip>Basemap</Tooltip>
        </button>
        {showBasemaps && (
          <div className="absolute top-full mt-1 right-0 bg-paper/95 backdrop-blur-sm border border-border rounded-lg shadow-lg py-1 min-w-[160px]">
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
