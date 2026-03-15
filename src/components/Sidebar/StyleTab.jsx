import { useEffect, useMemo, useState, useCallback } from 'react'
import useLayerTreeStore from '../../store/layerTreeStore'
import ColorRampPicker from '../UI/ColorRampPicker'
import ClassBreakEditor from '../UI/ClassBreakEditor'
import { getCategoryColor } from '../../utils/colorUtils'

const CLASS_METHODS = [
  { value: 'quantile', label: 'Quantile' },
  { value: 'equalInterval', label: 'Equal Interval' },
  { value: 'jenks', label: 'Natural Breaks (Jenks)' },
  { value: 'manual', label: 'Manual' },
]

export default function StyleTab() {
  const layers = useLayerTreeStore((s) => s.layers)
  const selectedLayerId = useLayerTreeStore((s) => s.selectedLayerId)
  const selectLayer = useLayerTreeStore((s) => s.selectLayer)
  const updateAdminConfig = useLayerTreeStore((s) => s.updateAdminConfig)
  const updateUserStyle = useLayerTreeStore((s) => s.updateUserStyle)
  const mapTitle = useLayerTreeStore((s) => s.mapTitle)
  const legendTitle = useLayerTreeStore((s) => s.legendTitle)
  const attribution = useLayerTreeStore((s) => s.attribution)
  const update = useLayerTreeStore((s) => s.update)

  const selectedLayer = layers.find((l) => l.id === selectedLayerId)

  // Local state for text inputs
  const [localMapTitle, setLocalMapTitle] = useState(mapTitle)
  const [localLegendTitle, setLocalLegendTitle] = useState(legendTitle)
  const [localAttribution, setLocalAttribution] = useState(attribution)

  useEffect(() => {
    setLocalMapTitle(mapTitle)
  }, [mapTitle])
  useEffect(() => {
    setLocalLegendTitle(legendTitle)
  }, [legendTitle])
  useEffect(() => {
    setLocalAttribution(attribution)
  }, [attribution])

  // Layer selector component
  const LayerSelector = () => (
    <div className="pb-3 border-b border-border">
      <label className="block text-xs text-muted mb-1">Style Layer</label>
      <select
        value={selectedLayerId || ''}
        onChange={(e) => selectLayer(e.target.value || null)}
        className="w-full rounded border border-border bg-paper px-2 py-1.5 text-sm"
      >
        {layers.length === 0 ? (
          <option value="">No layers available</option>
        ) : (
          <>
            <option value="">Select a layer...</option>
            {layers.map((layer) => (
              <option key={layer.id} value={layer.id}>
                {layer.name} ({layer.type === 'admin' ? 'Admin' : 'User'})
              </option>
            ))}
          </>
        )}
      </select>
    </div>
  )

  if (!selectedLayer) {
    return (
      <div className="space-y-5">
        <LayerSelector />
        <div className="text-center py-4 text-sm text-muted">
          <p>Select a layer above to style it</p>
        </div>
        <AnnotationControls
          localMapTitle={localMapTitle}
          setLocalMapTitle={setLocalMapTitle}
          localLegendTitle={localLegendTitle}
          setLocalLegendTitle={setLocalLegendTitle}
          localAttribution={localAttribution}
          setLocalAttribution={setLocalAttribution}
          update={update}
        />
      </div>
    )
  }

  if (selectedLayer.type === 'admin') {
    return (
      <AdminLayerStylePanel
        layer={selectedLayer}
        layers={layers}
        selectedLayerId={selectedLayerId}
        selectLayer={selectLayer}
        updateAdminConfig={updateAdminConfig}
        localMapTitle={localMapTitle}
        setLocalMapTitle={setLocalMapTitle}
        localLegendTitle={localLegendTitle}
        setLocalLegendTitle={setLocalLegendTitle}
        localAttribution={localAttribution}
        setLocalAttribution={setLocalAttribution}
        update={update}
      />
    )
  }

  return (
    <UserLayerStylePanel
      layer={selectedLayer}
      layers={layers}
      selectedLayerId={selectedLayerId}
      selectLayer={selectLayer}
      updateUserStyle={updateUserStyle}
      localMapTitle={localMapTitle}
      setLocalMapTitle={setLocalMapTitle}
      localLegendTitle={localLegendTitle}
      setLocalLegendTitle={setLocalLegendTitle}
      localAttribution={localAttribution}
      setLocalAttribution={setLocalAttribution}
      update={update}
    />
  )
}

function AdminLayerStylePanel({
  layer,
  layers,
  selectedLayerId,
  selectLayer,
  updateAdminConfig,
  ...annotationProps
}) {
  const config = layer.adminConfig
  const layerId = layer.id

  const handleUpdate = useCallback(
    (updates) => {
      updateAdminConfig(layerId, updates)
    },
    [layerId, updateAdminConfig]
  )

  // Extract unique values for categorized mode
  const uniqueValues = useMemo(() => {
    const featureValues = config.featureValues || {}
    if (Object.keys(featureValues).length === 0) return []
    const vals = [...new Set(Object.values(featureValues).map(String))]
    vals.sort()
    return vals
  }, [config.featureValues])

  const effectiveCategoryColors = useMemo(() => {
    const colors = { ...config.categoryColors }
    uniqueValues.forEach((val, i) => {
      if (!colors[val]) {
        colors[val] = getCategoryColor(i)
      }
    })
    return colors
  }, [uniqueValues, config.categoryColors])

  const handleModeChange = (mode) => {
    if (mode === 'categorized') {
      const colors = {}
      uniqueValues.forEach((val, i) => {
        colors[val] = config.categoryColors?.[val] || getCategoryColor(i)
      })
      handleUpdate({ styleMode: mode, categoryColors: colors })
    } else {
      handleUpdate({ styleMode: mode })
    }
  }

  return (
    <div className="space-y-5">
      {/* Layer selector */}
      <div className="pb-3 border-b border-border">
        <label className="block text-xs text-muted mb-1">Style Layer</label>
        <select
          value={selectedLayerId || ''}
          onChange={(e) => selectLayer(e.target.value || null)}
          className="w-full rounded border border-border bg-paper px-2 py-1.5 text-sm"
        >
          {layers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ({l.type === 'admin' ? 'Admin' : 'User'})
            </option>
          ))}
        </select>
      </div>

      {/* Style Mode */}
      <div>
        <h3 className="text-sm font-medium mb-2">Style Mode</h3>
        <div className="flex rounded border border-border overflow-hidden">
          <button
            onClick={() => handleModeChange('graduated')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              config.styleMode === 'graduated'
                ? 'bg-accent text-white'
                : 'bg-paper text-muted hover:text-ink'
            }`}
          >
            Graduated
          </button>
          <button
            onClick={() => handleModeChange('categorized')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              config.styleMode === 'categorized'
                ? 'bg-accent text-white'
                : 'bg-paper text-muted hover:text-ink'
            }`}
          >
            Categorized
          </button>
        </div>
      </div>

      {config.styleMode === 'graduated' && (
        <>
          <div>
            <h3 className="text-sm font-medium mb-2">Color Ramp</h3>
            <ColorRampPicker 
              value={config.colorPreset}
              reversed={config.colorReversed}
              onChange={(preset, reversed) => handleUpdate({ colorPreset: preset, colorReversed: reversed })}
            />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Classification</h3>
            <div className="space-y-2">
              <label className="block">
                <span className="text-xs text-muted">Method</span>
                <select
                  value={config.classMethod}
                  onChange={(e) => handleUpdate({ classMethod: e.target.value })}
                  className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-sm"
                >
                  {CLASS_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>

              <div>
                <span className="text-xs text-muted">Classes: {config.numClasses}</span>
                <input
                  type="range"
                  min={3}
                  max={9}
                  value={config.numClasses}
                  onChange={(e) => handleUpdate({ numClasses: Number(e.target.value) })}
                  className="w-full mt-1 accent-accent"
                />
              </div>

              {config.classMethod === 'manual' && (
                <ClassBreakEditor
                  breaks={config.manualBreaks}
                  onChange={(breaks) => handleUpdate({ manualBreaks: breaks })}
                />
              )}
            </div>
          </div>
        </>
      )}

      {config.styleMode === 'categorized' && (
        <div>
          <h3 className="text-sm font-medium mb-2">Category Colors</h3>
          {uniqueValues.length === 0 ? (
            <p className="text-xs text-muted">No data values yet. Add data to see categories.</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {uniqueValues.map((val) => (
                <div key={val} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={effectiveCategoryColors[val] || '#e0e0e0'}
                    onChange={(e) => handleUpdate({ categoryColors: { ...effectiveCategoryColors, [val]: e.target.value } })}
                    className="w-6 h-6 rounded border border-border cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-ink truncate">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appearance */}
      <div>
        <h3 className="text-sm font-medium mb-2">Appearance</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm flex-1">
              <span className="text-xs text-muted">Stroke</span>
              <input
                type="color"
                value={config.strokeColor}
                onChange={(e) => handleUpdate({ strokeColor: e.target.value })}
                className="w-6 h-6 rounded border border-border cursor-pointer"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-xs text-muted">Width</span>
              <input
                type="number"
                value={config.strokeWidth}
                onChange={(e) => handleUpdate({ strokeWidth: Number(e.target.value) })}
                min={0}
                max={5}
                step={0.1}
                className="w-16 rounded border border-border bg-paper px-2 py-1 text-sm font-mono"
              />
            </label>
          </div>

          <label className="flex items-center gap-2 text-sm">
            <span className="text-xs text-muted">No-data color</span>
            <input
              type="color"
              value={config.noDataColor}
              onChange={(e) => handleUpdate({ noDataColor: e.target.value })}
              className="w-6 h-6 rounded border border-border cursor-pointer"
            />
          </label>

          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={config.showFeatureLabels}
              onChange={(e) => handleUpdate({ showFeatureLabels: e.target.checked })}
            />
            Show area names
          </label>
        </div>
      </div>

      <AnnotationControls {...annotationProps} />
    </div>
  )
}

function UserLayerStylePanel({
  layer,
  layers,
  selectedLayerId,
  selectLayer,
  updateUserStyle,
  ...annotationProps
}) {
  const config = layer.userConfig
  const style = config.style
  const layerId = layer.id

  const handleStyleChange = useCallback(
    (key, value) => {
      updateUserStyle(layerId, { [key]: value })
    },
    [layerId, updateUserStyle]
  )

  const geometryType = config.geometryType?.toLowerCase() || ''
  const isPolygon = geometryType.includes('polygon')
  const isLine = geometryType.includes('line')
  const isPoint = geometryType.includes('point')

  return (
    <div className="space-y-5">
      {/* Layer selector */}
      <div className="pb-3 border-b border-border">
        <label className="block text-xs text-muted mb-1">Style Layer</label>
        <select
          value={selectedLayerId || ''}
          onChange={(e) => selectLayer(e.target.value || null)}
          className="w-full rounded border border-border bg-paper px-2 py-1.5 text-sm"
        >
          {layers.map((l) => (
            <option key={l.id} value={l.id}>
              {l.name} ({l.type === 'admin' ? 'Admin' : 'User'})
            </option>
          ))}
        </select>
      </div>

      {/* Fill Color */}
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
            />
          </div>
        </div>
      )}

      {/* Fill Opacity */}
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

      {/* Point Radius */}
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

      {/* Quick Presets */}
      <div>
        <label className="block text-xs text-muted mb-2">Quick Presets</label>
        <div className="flex flex-wrap gap-2">
          {getPresets(config.geometryType).map((preset) => (
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
                style={{ backgroundColor: preset.style.fill || preset.style.stroke }}
              />
              {preset.name}
            </button>
          ))}
        </div>
      </div>

      <AnnotationControls {...annotationProps} />
    </div>
  )
}

function AnnotationControls({ localMapTitle, setLocalMapTitle, localLegendTitle, setLocalLegendTitle, localAttribution, setLocalAttribution, update }) {
  return (
    <div>
      <h3 className="text-sm font-medium mb-2">Labels</h3>
      <div className="space-y-2">
        <label className="block">
          <span className="text-xs text-muted">Map title</span>
          <input
            type="text"
            value={localMapTitle}
            onChange={(e) => setLocalMapTitle(e.target.value)}
            onBlur={() => update({ mapTitle: localMapTitle })}
            onKeyDown={(e) => e.key === 'Enter' && update({ mapTitle: localMapTitle })}
            placeholder="e.g. GDP per Capita 2023"
            className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">Legend title</span>
          <input
            type="text"
            value={localLegendTitle}
            onChange={(e) => setLocalLegendTitle(e.target.value)}
            onBlur={() => update({ legendTitle: localLegendTitle })}
            onKeyDown={(e) => e.key === 'Enter' && update({ legendTitle: localLegendTitle })}
            placeholder="e.g. Million IDR"
            className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-sm"
          />
        </label>
        <label className="block">
          <span className="text-xs text-muted">Attribution / Source</span>
          <input
            type="text"
            value={localAttribution}
            onChange={(e) => setLocalAttribution(e.target.value)}
            onBlur={() => update({ attribution: localAttribution })}
            onKeyDown={(e) => e.key === 'Enter' && update({ attribution: localAttribution })}
            placeholder="e.g. Source: BPS 2023"
            className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-sm"
          />
        </label>
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
    ]
  }

  if (normalized.includes('line')) {
    return [
      { name: 'Blue', style: { stroke: '#3498DB', strokeWidth: 3 } },
      { name: 'Red', style: { stroke: '#E74C3C', strokeWidth: 3 } },
      { name: 'Green', style: { stroke: '#2ECC71', strokeWidth: 3 } },
      { name: 'Black', style: { stroke: '#2C3E50', strokeWidth: 2 } },
    ]
  }

  // Points
  return [
    { name: 'Blue', style: { fill: '#3498DB', stroke: '#2980B9', strokeWidth: 1, radius: 6 } },
    { name: 'Red', style: { fill: '#E74C3C', stroke: '#C0392B', strokeWidth: 1, radius: 6 } },
    { name: 'Green', style: { fill: '#2ECC71', stroke: '#27AE60', strokeWidth: 1, radius: 6 } },
    { name: 'Large', style: { fill: '#9B59B6', stroke: '#8E44AD', strokeWidth: 2, radius: 10 } },
  ]
}
