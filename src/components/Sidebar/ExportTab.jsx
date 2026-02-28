import { useState } from 'react'
import useMapStore from '../../store/mapStore'

export default function ExportTab() {
  const exportMapFn = useMapStore((s) => s.exportMapFn)
  const [resolution, setResolution] = useState(2)

  const handleExport = () => {
    exportMapFn?.(resolution)
  }

  return (
    <div className="space-y-4">
      <h3 className="text-sm font-medium">Download Map</h3>

      <div>
        <span className="text-xs text-muted">Resolution</span>
        <div className="flex flex-col gap-1 mt-1">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="resolution"
              value={1}
              checked={resolution === 1}
              onChange={() => setResolution(1)}
            />
            Standard (1x)
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="radio"
              name="resolution"
              value={2}
              checked={resolution === 2}
              onChange={() => setResolution(2)}
            />
            High-res (2x)
          </label>
        </div>
      </div>

      <button
        onClick={handleExport}
        className="w-full bg-accent text-paper py-2 rounded text-sm font-medium hover:bg-accentMuted transition-colors"
      >
        Download PNG
      </button>

      <p className="text-xs text-muted">
        Legend and title will be included in export in a future update.
      </p>
    </div>
  )
}
