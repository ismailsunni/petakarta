import { useCallback } from 'react'
import useDatasetsStore from '../../store/datasetsStore'

export default function UserLayerStylePanel() {
  const userLayers = useDatasetsStore((s) => s.userLayers)
  const selectedLayerId = useDatasetsStore((s) => s.selectedLayerId)
  const updateLayerStyle = useDatasetsStore((s) => s.updateLayerStyle)

  const selectedLayer = userLayers.find((l) => l.id === selectedLayerId)

  const handleStyleChange = useCallback((key, value) => {
    if (!selectedLayerId) return
    updateLayerStyle(selectedLayerId, { [key]: value })
  }, [selectedLayerId, updateLayerStyle])

  if (!selectedLayer) {
    return (
      <div className="text-center py-4 text-sm text-muted">
        Select a user layer from the Datasets tab to style it
      </div>
    )
  }

  const style = selectedLayer.style
  const geometryType = selectedLayer.geometryType?.toLowerCase() || ''
  const isPolygon = geometryType.includes('polygon')
  const isLine = geometryType.includes('line')
  const isPoint = geometryType.includes('point')

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 pb-2 border-b border-border">
        <div
          className="w-6 h-6 rounded border border-border"
          style={{
            backgroundColor: style.fill || style.stroke || '#888',
            opacity: style.fillOpacity ?? 1,
          }}
        />
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">{selectedLayer.name}</p>
          <p className="text-xs text-muted capitalize">{selectedLayer.geometryType}</p>
        </div>
      </div>

      {/* Fill Color (for polygons and points) */}
      {(isPolygon || isPoint) && (
        <div>
          <label className="block text-xs text-muted mb-1">Fill Color</label>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={style.fill || '#3498DB'}
              onChange={(e) => handleStyleChange('fill', e.target.value)}
              className="w-8 h-8 rounded border border-border cursor-pointer"
            />
            <input
              type="text"
              value={style.fill || '#3498DB'}
              onChange={(e) => handleStyleChange('fill', e.target.value)}
              className="flex-1 rounded border border-border bg-paper px-2 py-1 text-sm font-mono"
              placeholder="#3498DB"
            />
          </div>
        </div>
      )}

      {/* Fill Opacity (for polygons) */}
      {isPolygon && (
        <div>
          <label className="block text-xs text-muted mb-1">
            Fill Opacity: {Math.round((style.fillOpacity ?? 0.6) * 100)}%
          </label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={style.fillOpacity ?? 0.6}
            onChange={(e) => handleStyleChange('fillOpacity', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* Stroke Color */}
      <div>
        <label className="block text-xs text-muted mb-1">Stroke Color</label>
        <div className="flex gap-2 items-center">
          <input
            type="color"
            value={style.stroke || '#2980B9'}
            onChange={(e) => handleStyleChange('stroke', e.target.value)}
            className="w-8 h-8 rounded border border-border cursor-pointer"
          />
          <input
            type="text"
            value={style.stroke || '#2980B9'}
            onChange={(e) => handleStyleChange('stroke', e.target.value)}
            className="flex-1 rounded border border-border bg-paper px-2 py-1 text-sm font-mono"
            placeholder="#2980B9"
          />
        </div>
      </div>

      {/* Stroke Width */}
      <div>
        <label className="block text-xs text-muted mb-1">
          Stroke Width: {style.strokeWidth ?? 2}px
        </label>
        <input
          type="range"
          min="0"
          max="10"
          step="0.5"
          value={style.strokeWidth ?? 2}
          onChange={(e) => handleStyleChange('strokeWidth', parseFloat(e.target.value))}
          className="w-full"
        />
      </div>

      {/* Point Radius (for points) */}
      {isPoint && (
        <div>
          <label className="block text-xs text-muted mb-1">
            Point Size: {style.radius ?? 6}px
          </label>
          <input
            type="range"
            min="2"
            max="20"
            step="1"
            value={style.radius ?? 6}
            onChange={(e) => handleStyleChange('radius', parseInt(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* Line Width (for lines - same as stroke width but with different range) */}
      {isLine && (
        <div>
          <label className="block text-xs text-muted mb-1">
            Line Width: {style.strokeWidth ?? 3}px
          </label>
          <input
            type="range"
            min="1"
            max="15"
            step="0.5"
            value={style.strokeWidth ?? 3}
            onChange={(e) => handleStyleChange('strokeWidth', parseFloat(e.target.value))}
            className="w-full"
          />
        </div>
      )}

      {/* Style Presets */}
      <div>
        <label className="block text-xs text-muted mb-2">Quick Presets</label>
        <div className="flex flex-wrap gap-2">
          {getPresets(selectedLayer.geometryType).map((preset) => (
            <button
              key={preset.name}
              onClick={() => {
                Object.entries(preset.style).forEach(([key, value]) => {
                  handleStyleChange(key, value)
                })
              }}
              className="px-2 py-1 text-xs rounded border border-border hover:border-accent transition-colors flex items-center gap-1.5"
            >
              <span
                className="w-3 h-3 rounded-sm"
                style={{
                  backgroundColor: preset.style.fill || preset.style.stroke,
                }}
              />
              {preset.name}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

function getPresets(geometryType) {
  const normalized = geometryType?.toLowerCase() || ''

  if (normalized.includes('polygon')) {
    return [
      { name: 'Blue', style: { fill: '#3498DB', fillOpacity: 0.6, stroke: '#2980B9', strokeWidth: 2 } },
      { name: 'Green', style: { fill: '#2ECC71', fillOpacity: 0.6, stroke: '#27AE60', strokeWidth: 2 } },
      { name: 'Red', style: { fill: '#E74C3C', fillOpacity: 0.6, stroke: '#C0392B', strokeWidth: 2 } },
      { name: 'Purple', style: { fill: '#9B59B6', fillOpacity: 0.6, stroke: '#8E44AD', strokeWidth: 2 } },
      { name: 'Orange', style: { fill: '#F39C12', fillOpacity: 0.6, stroke: '#D68910', strokeWidth: 2 } },
    ]
  }

  if (normalized.includes('line')) {
    return [
      { name: 'Blue', style: { stroke: '#3498DB', strokeWidth: 3 } },
      { name: 'Red', style: { stroke: '#E74C3C', strokeWidth: 3 } },
      { name: 'Green', style: { stroke: '#2ECC71', strokeWidth: 3 } },
      { name: 'Black', style: { stroke: '#2C3E50', strokeWidth: 2 } },
      { name: 'Orange', style: { stroke: '#F39C12', strokeWidth: 3 } },
    ]
  }

  // Points
  return [
    { name: 'Blue', style: { fill: '#3498DB', stroke: '#2980B9', strokeWidth: 1, radius: 6 } },
    { name: 'Red', style: { fill: '#E74C3C', stroke: '#C0392B', strokeWidth: 1, radius: 6 } },
    { name: 'Green', style: { fill: '#2ECC71', stroke: '#27AE60', strokeWidth: 1, radius: 6 } },
    { name: 'Yellow', style: { fill: '#F1C40F', stroke: '#D4AC0D', strokeWidth: 1, radius: 6 } },
    { name: 'Large', style: { fill: '#9B59B6', stroke: '#8E44AD', strokeWidth: 2, radius: 10 } },
  ]
}
