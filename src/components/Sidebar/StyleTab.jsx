import { useEffect, useMemo, useState, useCallback, useRef } from 'react'
import useLayerTreeStore from '../../store/layerTreeStore'
import ColorRampPicker from '../UI/ColorRampPicker'
import ClassBreakEditor from '../UI/ClassBreakEditor'
import { getCategoryColor } from '../../utils/colorUtils'
import { parseCSV, parseCSVString } from '../../utils/csvParser'
import { matchFeatures } from '../../utils/featureMatcher'
import { getLayer } from '../../utils/adminLayers'

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
  const updateUserConfig = useLayerTreeStore((s) => s.updateUserConfig)
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
      updateUserConfig={updateUserConfig}
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

      {/* Data Configuration for Admin Layer */}
      <AdminDataPanel layer={layer} handleUpdate={handleUpdate} />

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
  updateUserConfig,
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

  const handleConfigUpdate = useCallback(
    (updates) => {
      updateUserConfig(layerId, updates)
    },
    [layerId, updateUserConfig]
  )

  const handleValueColumnChange = useCallback(
    (valueColumn, featureValues) => {
      handleConfigUpdate({ valueColumn, featureValues })
    },
    [handleConfigUpdate]
  )

  const geometryType = config.geometryType?.toLowerCase() || ''
  const isPolygon = geometryType.includes('polygon')
  const isLine = geometryType.includes('line')
  const isPoint = geometryType.includes('point')

  // Determine if value-based styling is available
  const hasValues = config.valueColumn && Object.keys(config.featureValues || {}).length > 0
  const styleMode = config.styleMode || 'single'

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
      handleConfigUpdate({ styleMode: mode, categoryColors: colors })
    } else {
      handleConfigUpdate({ styleMode: mode })
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

      {/* Data Configuration for User Layer */}
      {isPolygon && (
        <UserDataPanel layer={layer} onValueColumnChange={handleValueColumnChange} />
      )}

      {/* Style Mode - only show when values are available and polygon */}
      {hasValues && isPolygon && (
        <div>
          <h3 className="text-sm font-medium mb-2">Style Mode</h3>
          <div className="flex rounded border border-border overflow-hidden">
            <button
              onClick={() => handleModeChange('single')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                styleMode === 'single'
                  ? 'bg-accent text-white'
                  : 'bg-paper text-muted hover:text-ink'
              }`}
            >
              Single
            </button>
            <button
              onClick={() => handleModeChange('graduated')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                styleMode === 'graduated'
                  ? 'bg-accent text-white'
                  : 'bg-paper text-muted hover:text-ink'
              }`}
            >
              Graduated
            </button>
            <button
              onClick={() => handleModeChange('categorized')}
              className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
                styleMode === 'categorized'
                  ? 'bg-accent text-white'
                  : 'bg-paper text-muted hover:text-ink'
              }`}
            >
              Categorized
            </button>
          </div>
        </div>
      )}

      {/* Graduated styling options */}
      {hasValues && isPolygon && styleMode === 'graduated' && (
        <>
          {/* Color Ramp */}
          <div>
            <h3 className="text-sm font-medium mb-2">Color Ramp</h3>
            <ColorRampPicker
              value={config.colorRamp || 'YlOrRd'}
              onChange={(ramp) => handleConfigUpdate({ colorRamp: ramp })}
            />
          </div>

          {/* Classification */}
          <div>
            <h3 className="text-sm font-medium mb-2">Classification</h3>
            <div className="flex gap-2 mb-2">
              <select
                value={config.classMethod || 'quantile'}
                onChange={(e) => handleConfigUpdate({ classMethod: e.target.value })}
                className="flex-1 rounded border border-border bg-paper px-2 py-1.5 text-sm"
              >
                {CLASS_METHODS.map((m) => (
                  <option key={m.value} value={m.value}>
                    {m.label}
                  </option>
                ))}
              </select>
              <input
                type="number"
                value={config.numClasses || 5}
                onChange={(e) => handleConfigUpdate({ numClasses: Number(e.target.value) })}
                min={2}
                max={10}
                className="w-16 rounded border border-border bg-paper px-2 py-1.5 text-sm text-center"
              />
            </div>
            <ClassBreakEditor
              featureValues={config.featureValues || {}}
              numClasses={config.numClasses || 5}
              classMethod={config.classMethod || 'quantile'}
              manualBreaks={config.manualBreaks}
              onChange={(breaks) => handleConfigUpdate({ manualBreaks: breaks, classMethod: 'manual' })}
            />
          </div>
        </>
      )}

      {/* Categorized styling options */}
      {hasValues && isPolygon && styleMode === 'categorized' && (
        <div>
          <h3 className="text-sm font-medium mb-2">Category Colors</h3>
          {uniqueValues.length === 0 ? (
            <p className="text-xs text-muted">No values available</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {uniqueValues.map((val) => (
                <div key={val} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={effectiveCategoryColors[val] || '#e0e0e0'}
                    onChange={(e) => handleConfigUpdate({ categoryColors: { ...effectiveCategoryColors, [val]: e.target.value } })}
                    className="w-6 h-6 rounded border border-border cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-ink truncate">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Single/basic styling options - show when single mode or no values */}
      {(!hasValues || styleMode === 'single' || !isPolygon) && (
        <>
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
        </>
      )}

      {/* Appearance - always show for stroke settings in graduated/categorized mode */}
      {hasValues && isPolygon && styleMode !== 'single' && (
        <div>
          <h3 className="text-sm font-medium mb-2">Appearance</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm flex-1">
                <span className="text-xs text-muted">Stroke</span>
                <input
                  type="color"
                  value={config.strokeColor || '#333333'}
                  onChange={(e) => handleConfigUpdate({ strokeColor: e.target.value })}
                  className="w-6 h-6 rounded border border-border cursor-pointer"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted">Width</span>
                <input
                  type="number"
                  value={config.strokeWidth || 1}
                  onChange={(e) => handleConfigUpdate({ strokeWidth: Number(e.target.value) })}
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
                value={config.noDataColor || '#e0e0e0'}
                onChange={(e) => handleConfigUpdate({ noDataColor: e.target.value })}
                className="w-6 h-6 rounded border border-border cursor-pointer"
              />
            </label>
          </div>
        </div>
      )}

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

/**
 * AdminDataPanel - CSV upload and column mapping for admin layers
 */
function AdminDataPanel({ layer, handleUpdate }) {
  const fileInputRef = useRef(null)
  const config = layer.adminConfig
  const layerConfig = getLayer(config.adminLayerId)
  const samples = layerConfig?.samples || []

  const [csvData, setCsvData] = useState(null)
  const [csvColumns, setCsvColumns] = useState([])
  const [keyColumn, setKeyColumn] = useState('')
  const [keyType, setKeyType] = useState('name')
  const [valueColumn, setValueColumn] = useState('')
  const [selectedSample, setSelectedSample] = useState('')
  const [sampleError, setSampleError] = useState('')
  const [joinResult, setJoinResult] = useState(null)
  const [expanded, setExpanded] = useState(false)

  const hasData = Object.keys(config.featureValues || {}).length > 0

  const handleFile = useCallback(async (file) => {
    if (!file || !file.name.endsWith('.csv')) return
    const { data, columns } = await parseCSV(file)
    setCsvData(data)
    setCsvColumns(columns)
    setJoinResult(null)
  }, [])

  const handleDrop = useCallback(
    (e) => {
      e.preventDefault()
      const file = e.dataTransfer.files[0]
      handleFile(file)
    },
    [handleFile]
  )

  const handleLoadSample = useCallback(async () => {
    const sample = samples.find((s) => s.key === selectedSample)
    if (!sample) return
    setSampleError('')
    try {
      const url = import.meta.env.BASE_URL + 'samples/' + sample.file
      const response = await fetch(url)
      if (!response.ok) throw new Error(`Failed to load sample (${response.status})`)
      const text = await response.text()
      const { data, columns } = parseCSVString(text)
      setCsvData(data)
      setCsvColumns(columns)
      setKeyColumn(sample.keyCol)
      setKeyType(sample.keyType)
      setValueColumn(sample.valueCol)
      setJoinResult(null)
    } catch (err) {
      setSampleError(err.message)
    }
  }, [selectedSample, samples])

  const handleApply = useCallback(() => {
    if (!csvData || !keyColumn || !valueColumn) return

    // Create adminFeatures from layer config
    // We need to fetch the features from the GeoJSON - for now we'll do a simple match
    const adminFeatures = csvData.map((row) => ({
      featureId: row[keyColumn],
      featureName: row[keyColumn],
    }))

    const result = matchFeatures(csvData, keyColumn, keyType, valueColumn, adminFeatures, layerConfig)
    setJoinResult(result)
    handleUpdate({ featureValues: result.valueMap })
  }, [csvData, keyColumn, keyType, valueColumn, layerConfig, handleUpdate])

  const handleClearData = useCallback(() => {
    setCsvData(null)
    setCsvColumns([])
    setKeyColumn('')
    setValueColumn('')
    setJoinResult(null)
    handleUpdate({ featureValues: {} })
  }, [handleUpdate])

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2 text-sm font-medium hover:bg-canvas transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          Data Values
        </span>
        {hasData && (
          <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">
            {Object.keys(config.featureValues).length} values
          </span>
        )}
      </button>

      {expanded && (
        <div className="p-3 pt-0 space-y-3 border-t border-border">
          {/* CSV Upload */}
          <div
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={() => fileInputRef.current?.click()}
            className="border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-accent transition-colors"
          >
            <p className="text-xs text-muted">
              {csvData ? `${csvData.length} rows loaded` : 'Drop CSV or click to upload'}
            </p>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => handleFile(e.target.files[0])}
            />
          </div>

          {/* Sample Data */}
          {samples.length > 0 && !csvData && (
            <div>
              <span className="text-xs text-muted">Or load sample:</span>
              <div className="flex gap-2 mt-1">
                <select
                  value={selectedSample}
                  onChange={(e) => setSelectedSample(e.target.value)}
                  className="flex-1 rounded border border-border bg-paper px-2 py-1 text-xs"
                >
                  <option value="">Select sample...</option>
                  {samples.map((s) => (
                    <option key={s.key} value={s.key}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <button
                  onClick={handleLoadSample}
                  disabled={!selectedSample}
                  className="bg-ink text-paper px-2 py-1 rounded text-xs hover:bg-muted transition-colors disabled:opacity-40"
                >
                  Load
                </button>
              </div>
              {sampleError && <p className="text-xs text-red-600 mt-1">{sampleError}</p>}
            </div>
          )}

          {/* Column Mapping */}
          {csvData && (
            <div className="space-y-2">
              <label className="block">
                <span className="text-xs text-muted">Key Column (area ID/name)</span>
                <select
                  value={keyColumn}
                  onChange={(e) => setKeyColumn(e.target.value)}
                  className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-xs"
                >
                  <option value="">Select column...</option>
                  {csvColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-3">
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="radio"
                    name={`keyType-${layer.id}`}
                    checked={keyType === 'id'}
                    onChange={() => setKeyType('id')}
                  />
                  ID
                </label>
                <label className="flex items-center gap-1 text-xs">
                  <input
                    type="radio"
                    name={`keyType-${layer.id}`}
                    checked={keyType === 'name'}
                    onChange={() => setKeyType('name')}
                  />
                  Name
                </label>
              </div>

              <label className="block">
                <span className="text-xs text-muted">Value Column</span>
                <select
                  value={valueColumn}
                  onChange={(e) => setValueColumn(e.target.value)}
                  className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-xs"
                >
                  <option value="">Select column...</option>
                  {csvColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </label>

              <div className="flex gap-2">
                <button
                  onClick={handleApply}
                  disabled={!keyColumn || !valueColumn}
                  className="flex-1 bg-accent text-paper py-1 rounded text-xs font-medium hover:bg-accentMuted transition-colors disabled:opacity-40"
                >
                  Apply
                </button>
                <button
                  onClick={handleClearData}
                  className="px-3 py-1 text-xs text-muted hover:text-ink border border-border rounded"
                >
                  Clear
                </button>
              </div>

              {joinResult && (
                <p className="text-xs text-muted">
                  Matched: {joinResult.matched} | Unmatched: {joinResult.unmatched}
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}

/**
 * UserDataPanel - Attribute value selection for user uploaded layers
 */
function UserDataPanel({ layer, onValueColumnChange }) {
  const config = layer.userConfig
  const geojson = config.geojson
  const [expanded, setExpanded] = useState(false)

  // Extract attribute columns from GeoJSON
  const attributeColumns = useMemo(() => {
    if (!geojson?.features?.length) return []
    const firstFeature = geojson.features[0]
    if (!firstFeature?.properties) return []
    return Object.keys(firstFeature.properties)
  }, [geojson])

  // Extract unique values and create featureValues mapping
  const handleValueColumnSelect = useCallback(
    (column) => {
      if (!column || !geojson?.features) {
        onValueColumnChange(null, {})
        return
      }

      // Create featureValues mapping: feature index -> value
      const featureValues = {}
      geojson.features.forEach((feature, index) => {
        const value = feature.properties?.[column]
        if (value !== undefined && value !== null) {
          featureValues[index] = value
        }
      })

      onValueColumnChange(column, featureValues)
    },
    [geojson, onValueColumnChange]
  )

  const hasValueColumn = !!config.valueColumn

  return (
    <div className="border border-border rounded-lg overflow-hidden">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between p-2 text-sm font-medium hover:bg-canvas transition-colors"
      >
        <span className="flex items-center gap-2">
          <svg
            className={`w-4 h-4 transition-transform ${expanded ? 'rotate-90' : ''}`}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path d="M9 18l6-6-6-6" />
          </svg>
          Value Column
        </span>
        {hasValueColumn && (
          <span className="text-xs text-accent bg-accent/10 px-2 py-0.5 rounded">
            {config.valueColumn}
          </span>
        )}
      </button>

      {expanded && (
        <div className="p-3 pt-0 space-y-3 border-t border-border">
          {attributeColumns.length === 0 ? (
            <p className="text-xs text-muted">No attributes available</p>
          ) : (
            <>
              <label className="block">
                <span className="text-xs text-muted">Select attribute for styling</span>
                <select
                  value={config.valueColumn || ''}
                  onChange={(e) => handleValueColumnSelect(e.target.value)}
                  className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-xs"
                >
                  <option value="">None (single style)</option>
                  {attributeColumns.map((col) => (
                    <option key={col} value={col}>
                      {col}
                    </option>
                  ))}
                </select>
              </label>

              {config.valueColumn && config.featureValues && (
                <p className="text-xs text-muted">
                  {Object.keys(config.featureValues).length} features with values
                </p>
              )}
            </>
          )}
        </div>
      )}
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
