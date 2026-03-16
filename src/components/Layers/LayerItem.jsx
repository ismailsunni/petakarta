import { useCallback, useState } from 'react'
import useLayerTreeStore from '../../store/layerTreeStore'

export default function LayerItem({ layer, isFirst, isLast }) {
  const [expanded, setExpanded] = useState(false)
  const toggleVisibility = useLayerTreeStore((s) => s.toggleVisibility)
  const setOpacity = useLayerTreeStore((s) => s.setOpacity)
  const removeLayer = useLayerTreeStore((s) => s.removeLayer)
  const moveLayerUp = useLayerTreeStore((s) => s.moveLayerUp)
  const moveLayerDown = useLayerTreeStore((s) => s.moveLayerDown)

  const isAdmin = layer.type === 'admin'

  const handleFitToLayer = useCallback(() => {
    if (layer.type === 'user' && layer.userConfig?.bbox) {
      window.dispatchEvent(new CustomEvent('fitToUserLayer', { detail: { bbox: layer.userConfig.bbox } }))
    } else if (layer.type === 'admin' && layer.adminConfig?.adminLayerId) {
      window.dispatchEvent(new CustomEvent('fitToAdminLayer', { detail: { adminLayerId: layer.adminConfig.adminLayerId } }))
    }
  }, [layer])

  const getGeometryIcon = () => {
    if (isAdmin) {
      // Admin layers are always polygons
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M4 6l6-3 6 3 4 2v10l-4 2-6 3-6-3-4-2V6z" />
        </svg>
      )
    }

    const type = layer.userConfig?.geometryType?.toLowerCase() || ''
    if (type.includes('polygon')) {
      return (
        <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
          <path d="M4 6l6-3 6 3 4 2v10l-4 2-6 3-6-3-4-2V6z" />
        </svg>
      )
    }
    if (type.includes('line')) {
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

  const getStylePreview = () => {
    if (isAdmin) {
      return (
        <div className="w-4 h-4 rounded-sm border border-border bg-gradient-to-r from-blue-500 to-yellow-500" />
      )
    }
    const style = layer.userConfig?.style || {}
    return (
      <div
        className="w-4 h-4 rounded-sm border border-border"
        style={{
          backgroundColor: style.fill || style.stroke || '#888',
          opacity: style.fillOpacity ?? 1,
        }}
      />
    )
  }

  return (
    <div className="rounded border border-border bg-paper hover:border-accent/50 transition-colors">
      {/* Main row */}
      <div className="flex items-center gap-2 p-2">
        {/* Visibility toggle */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            toggleVisibility(layer.id)
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

        {/* Style preview */}
        {getStylePreview()}

        {/* Layer info */}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{layer.name}</p>
          <p className="text-xs text-muted">
            {isAdmin ? 'Admin' : 'User'} • {Math.round(layer.opacity * 100)}%
          </p>
        </div>

        {/* Geometry type icon */}
        <span className="text-muted">{getGeometryIcon()}</span>

        {/* Expand/collapse button */}
        <button
          onClick={(e) => {
            e.stopPropagation()
            setExpanded(!expanded)
          }}
          className="p-0.5 text-muted hover:text-ink transition-colors"
        >
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </button>
      </div>

      {/* Expanded controls */}
      {expanded && (
        <div className="px-2 pb-2 pt-0 border-t border-border space-y-2">
          {/* Opacity slider */}
          <div>
            <label className="text-xs text-muted">Opacity: {Math.round(layer.opacity * 100)}%</label>
            <input
              type="range"
              min="0"
              max="1"
              step="0.05"
              value={layer.opacity}
              onChange={(e) => setOpacity(layer.id, parseFloat(e.target.value))}
              className="w-full"
              onClick={(e) => e.stopPropagation()}
            />
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={(e) => {
                e.stopPropagation()
                handleFitToLayer()
              }}
              className="text-xs text-muted hover:text-accent transition-colors"
            >
              Fit to layer
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                moveLayerUp(layer.id)
              }}
              disabled={isLast}
              className="text-xs text-muted hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Move up
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                moveLayerDown(layer.id)
              }}
              disabled={isFirst}
              className="text-xs text-muted hover:text-accent transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
            >
              Move down
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
        </div>
      )}

    </div>
  )
}
