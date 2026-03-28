import { useState, useRef, useEffect } from 'react'
import { PRESET_GROUPS, getSwatchColors } from '../../utils/colorUtils'

function SwatchBar({ presetKey, count = 7 }) {
  const colors = getSwatchColors(presetKey, count)
  return (
    <div className="flex w-full h-3 rounded-sm overflow-hidden">
      {colors.map((c, i) => (
        <div key={i} className="flex-1" style={{ backgroundColor: c }} />
      ))}
    </div>
  )
}

export default function ColorRampPicker({ value, reversed, onChange }) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  // Close dropdown on outside click
  useEffect(() => {
    if (!open) return
    const handleClick = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  const handleSelect = (key) => {
    onChange(key, reversed)
    setOpen(false)
  }

  return (
    <div className="space-y-2">
      <div ref={containerRef} className="relative">
        <button
          onClick={() => setOpen(!open)}
          className="w-full flex items-center gap-2 rounded border border-border bg-paper px-2 py-1.5 text-sm hover:border-muted transition-colors"
        >
          <div className="flex-1">
            <SwatchBar presetKey={value} />
          </div>
          <span className="text-xs text-muted shrink-0">{value}</span>
          <svg className={`w-3 h-3 text-muted transition-transform ${open ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && (
          <div className="absolute z-20 left-0 right-0 mt-1 bg-paper border border-border rounded shadow-lg max-h-64 overflow-y-auto">
            {Object.entries(PRESET_GROUPS).map(([group, presets], gi) => (
              <div key={group}>
                {gi > 0 && <div className="border-t border-border" />}
                <div className="px-2 py-1 text-[10px] font-medium text-muted uppercase tracking-wider bg-canvas">
                  {group}
                </div>
                {presets.map((key) => (
                  <button
                    key={key}
                    onClick={() => handleSelect(key)}
                    className={`w-full flex items-center gap-2 px-2 py-1.5 text-sm hover:bg-canvas transition-colors ${
                      value === key ? 'bg-accent/10' : ''
                    }`}
                  >
                    <div className="flex-1">
                      <SwatchBar presetKey={key} />
                    </div>
                    <span className="text-xs text-muted shrink-0">{key}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          checked={reversed}
          onChange={(e) => onChange(value, e.target.checked)}
        />
        Reverse colors
      </label>
    </div>
  )
}
