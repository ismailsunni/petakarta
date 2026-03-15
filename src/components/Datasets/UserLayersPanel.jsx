import { useCallback } from 'react'
import useDatasetsStore from '../../store/datasetsStore'

export default function UserLayersPanel() {
  const userLayers = useDatasetsStore((s) => s.userLayers)
  const selectedLayerId = useDatasetsStore((s) => s.selectedLayerId)
  const removeLayer = useDatasetsStore((s) => s.removeLayer)
  const toggleLayerVisibility = useDatasetsStore((s) => s.toggleLayerVisibility)
  const selectLayer = useDatasetsStore((s) => s.selectLayer)

  const handleFitToLayer = useCallback((layer) => {
    // This will be connected via a custom event or ref
    window.dispatchEvent(new CustomEvent('fitToUserLayer', { detail: { bbox: layer.bbox } }))
  }, [])

  const getGeometryIcon = (type) => {
    const normalized = type?.toLowerCase() || ''
    if (normalized.includes('polygon')) {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M4 6l6-3 6 3 4 2v10l-4 2-6 3-6-3-4-2V6z" />
        </svg>
      )
    }
    if (normalized.includes('line')) {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M4 20L20 4" strokeLinecap="round" />
        </svg>
      )
    }
    return (
      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="12" r="4" />
      </svg>
    )
  }

  if (userLayers.length === 0) {
    return (
      <div className="text-center py-4 text-sm text-muted">
        No layers added yet
      </div>
    )
  }

  return (
    <div className="space-y-2">
      <h4 className="text-xs font-medium text-muted uppercase tracking-wide">
        Map Layers
      </h4>

      {userLayers.map((layer) => {
        const isSelected = selectedLayerId === layer.id

        return (
          <div
            key={layer.id}
            onClick={() => selectLayer(layer.id)}
            className={`rounded border p-2 cursor-pointer transition-colors ${
              isSelected
                ? 'border-accent bg-accent/5'
                : 'border-border bg-paper hover:border-accent/50'
            }`}
          >
            <div className="flex items-center gap-2">
              {/* Visibility toggle */}
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  toggleLayerVisibility(layer.id)
                }}
                className={`p-0.5 rounded transition-colors ${
                  layer.visible ? 'text-accent' : 'text-muted'
                }`}
                title={layer.visible ? 'Hide layer' : 'Show layer'}
              >
                {layer.visible ? (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
                    <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19m-6.72-1.07a3 3 0 11-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                )}
              </button>

              {/* Style preview swatch */}
              <div
                className="w-4 h-4 rounded-sm border border-border shrink-0"
                style={{
                  backgroundColor: layer.style?.fill || layer.style?.stroke || '#888',
                  opacity: layer.style?.fillOpacity ?? 1,
                }}
              />

              {/* Layer info */}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{layer.name}</p>
              </div>

              {/* Geometry type icon */}
              <span className="text-muted">{getGeometryIcon(layer.geometryType)}</span>
            </div>

            {/* Actions row */}
            <div className="flex gap-2 mt-2 pt-2 border-t border-border">
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleFitToLayer(layer)
                }}
                className="text-xs text-muted hover:text-accent transition-colors"
              >
                Fit to layer
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  removeLayer(layer.id)
                }}
                className="text-xs text-red-500 hover:text-red-600 transition-colors"
              >
                Remove
              </button>
            </div>

            {isSelected && (
              <div className="mt-2 pt-2 border-t border-accent/20 text-xs text-accent">
                Selected for styling
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
