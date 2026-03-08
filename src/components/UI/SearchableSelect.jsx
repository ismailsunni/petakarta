import { useEffect, useRef, useState } from 'react'

// options: [{ value, label, group? }]
export default function SearchableSelect({ options, value, onChange, placeholder = 'Select...' }) {
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const containerRef = useRef(null)
  const inputRef = useRef(null)

  const selected = options.find((o) => o.value === value)

  useEffect(() => {
    if (!open) return
    const handler = (e) => {
      if (!containerRef.current?.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const handleOpen = () => {
    setOpen(true)
    setQuery('')
    setTimeout(() => inputRef.current?.focus(), 0)
  }

  const q = query.toLowerCase()
  const filtered = options.filter(
    (o) => o.label.toLowerCase().includes(q) || o.group?.toLowerCase().includes(q)
  )

  // Preserve group order while filtering
  const groups = []
  const seen = new Set()
  for (const opt of filtered) {
    const g = opt.group ?? ''
    if (!seen.has(g)) { groups.push(g); seen.add(g) }
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={handleOpen}
        className="w-full rounded border border-border bg-paper px-2 py-1 text-sm text-left flex items-center justify-between gap-1"
      >
        <span className={selected ? 'text-ink truncate' : 'text-muted'}>
          {selected?.label ?? placeholder}
        </span>
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" stroke="currentColor" strokeWidth="1.5" className="shrink-0 text-muted">
          <path d="M2 3.5L5 6.5L8 3.5" />
        </svg>
      </button>

      {open && (
        <div className="absolute z-50 mt-1 w-full rounded border border-border bg-paper shadow-lg">
          <div className="p-1.5 border-b border-border">
            <input
              ref={inputRef}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search..."
              className="w-full rounded border border-border bg-paper px-2 py-1 text-sm focus:outline-none focus:border-accent"
            />
          </div>
          <div className="max-h-64 overflow-y-auto">
            {filtered.length === 0 && (
              <p className="px-3 py-2 text-xs text-muted">No results</p>
            )}
            {groups.map((group) => (
              <div key={group}>
                {group && (
                  <div className="px-2 py-1 text-[10px] font-semibold text-muted uppercase tracking-wide bg-canvas sticky top-0">
                    {group}
                  </div>
                )}
                {filtered.filter((o) => (o.group ?? '') === group).map((opt) => (
                  <button
                    key={opt.value}
                    type="button"
                    onClick={() => { onChange(opt.value); setOpen(false) }}
                    className={`w-full text-left px-3 py-1.5 text-sm hover:bg-canvas transition-colors ${
                      opt.value === value ? 'text-accent font-medium' : 'text-ink'
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
