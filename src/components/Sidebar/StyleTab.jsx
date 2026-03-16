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
  const updateUserConfig = useLayerTreeStore((s) => s.updateUserConfig)

  const selectedLayer = layers.find((l) => l.id === selectedLayerId)

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
      />
    )
  }

  return (
    <UserLayerStylePanel
      layer={selectedLayer}
      layers={layers}
      selectedLayerId={selectedLayerId}
      selectLayer={selectLayer}
      updateUserConfig={updateUserConfig}
    />
  )
}

function AdminLayerStylePanel({
  layer,
  layers,
  selectedLayerId,
  selectLayer,
  updateAdminConfig,
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
            onClick={() => handleModeChange('single')}
            className={`flex-1 px-3 py-1.5 text-xs font-medium transition-colors ${
              config.styleMode === 'single'
                ? 'bg-accent text-white'
                : 'bg-paper text-muted hover:text-ink'
            }`}
          >
            Single
          </button>
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

      {/* Single style mode - fill color */}
      {config.styleMode === 'single' && (
        <div>
          <h3 className="text-sm font-medium mb-2">Fill Color</h3>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={config.fillColor || '#3498DB'}
              onChange={(e) => handleUpdate({ fillColor: e.target.value })}
              className="w-8 h-8 rounded border border-border cursor-pointer"
            />
            <input
              type="text"
              value={config.fillColor || '#3498DB'}
              onChange={(e) => handleUpdate({ fillColor: e.target.value })}
              className="flex-1 rounded border border-border bg-paper px-2 py-1 text-sm font-mono"
            />
          </div>
        </div>
      )}

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
            Show feature labels
          </label>

          {config.showFeatureLabels && (
            <AdminLabelColumnSelector layer={layer} handleUpdate={handleUpdate} />
          )}
        </div>
      </div>
    </div>
  )
}

function UserLayerStylePanel({
  layer,
  layers,
  selectedLayerId,
  selectLayer,
  updateUserConfig,
}) {
  const config = layer.userConfig
  const layerId = layer.id

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

      {/* Style Mode - always show for polygons */}
      {isPolygon && (
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

      {/* Data Configuration for User Layer - only for graduated/categorized */}
      {isPolygon && styleMode !== 'single' && (
        <UserDataPanel layer={layer} onValueColumnChange={handleValueColumnChange} />
      )}

      {/* Single style mode - fill color */}
      {isPolygon && styleMode === 'single' && (
        <div>
          <h3 className="text-sm font-medium mb-2">Fill Color</h3>
          <div className="flex gap-2 items-center">
            <input
              type="color"
              value={config.fillColor || '#3498DB'}
              onChange={(e) => handleConfigUpdate({ fillColor: e.target.value })}
              className="w-8 h-8 rounded border border-border cursor-pointer"
            />
            <input
              type="text"
              value={config.fillColor || '#3498DB'}
              onChange={(e) => handleConfigUpdate({ fillColor: e.target.value })}
              className="flex-1 rounded border border-border bg-paper px-2 py-1 text-sm font-mono"
            />
          </div>
        </div>
      )}

      {/* Graduated styling options */}
      {isPolygon && styleMode === 'graduated' && (
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
      {isPolygon && styleMode === 'categorized' && (
        <div>
          <h3 className="text-sm font-medium mb-2">Category Colors</h3>
          {uniqueValues.length === 0 ? (
            <p className="text-xs text-muted">No data values yet. Select a value column to see categories.</p>
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

      {/* Appearance - for polygons */}
      {isPolygon && (
        <div>
          <h3 className="text-sm font-medium mb-2">Appearance</h3>
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <label className="flex items-center gap-2 text-sm flex-1">
                <span className="text-xs text-muted">Stroke</span>
                <input
                  type="color"
                  value={config.strokeColor || '#ffffff'}
                  onChange={(e) => handleConfigUpdate({ strokeColor: e.target.value })}
                  className="w-6 h-6 rounded border border-border cursor-pointer"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <span className="text-xs text-muted">Width</span>
                <input
                  type="number"
                  value={config.strokeWidth || 0.8}
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

            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={config.showFeatureLabels || false}
                onChange={(e) => handleConfigUpdate({ showFeatureLabels: e.target.checked })}
              />
              Show feature labels
            </label>

            {config.showFeatureLabels && (
              <UserLabelColumnSelector layer={layer} handleConfigUpdate={handleConfigUpdate} />
            )}
          </div>
        </div>
      )}

      {/* Line styling */}
      {isLine && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1">Stroke Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={config.strokeColor || '#3498DB'}
                onChange={(e) => handleConfigUpdate({ strokeColor: e.target.value })}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={config.strokeColor || '#3498DB'}
                onChange={(e) => handleConfigUpdate({ strokeColor: e.target.value })}
                className="flex-1 rounded border border-border bg-paper px-2 py-1 text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              Stroke Width: {config.strokeWidth ?? 3}px
            </label>
            <input
              type="range"
              min="1"
              max="10"
              step="0.5"
              value={config.strokeWidth ?? 3}
              onChange={(e) => handleConfigUpdate({ strokeWidth: parseFloat(e.target.value) })}
              className="w-full"
            />
          </div>
        </div>
      )}

      {/* Point styling */}
      {isPoint && (
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-muted mb-1">Fill Color</label>
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={config.fillColor || '#3498DB'}
                onChange={(e) => handleConfigUpdate({ fillColor: e.target.value })}
                className="w-8 h-8 rounded border border-border cursor-pointer"
              />
              <input
                type="text"
                value={config.fillColor || '#3498DB'}
                onChange={(e) => handleConfigUpdate({ fillColor: e.target.value })}
                className="flex-1 rounded border border-border bg-paper px-2 py-1 text-sm font-mono"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-muted mb-1">
              Point Size: {config.pointRadius ?? 6}px
            </label>
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={config.pointRadius ?? 6}
              onChange={(e) => handleConfigUpdate({ pointRadius: parseInt(e.target.value) })}
              className="w-full"
            />
          </div>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm flex-1">
              <span className="text-xs text-muted">Stroke</span>
              <input
                type="color"
                value={config.strokeColor || '#2980B9'}
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
                step={0.5}
                className="w-16 rounded border border-border bg-paper px-2 py-1 text-sm font-mono"
              />
            </label>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * UserLabelColumnSelector - Select which column to use for labels in user layers
 */
function UserLabelColumnSelector({ layer, handleConfigUpdate }) {
  const config = layer.userConfig
  const [availableColumns, setAvailableColumns] = useState([])

  // Extract columns from the geojson stored in userConfig
  useEffect(() => {
    const geojson = config?.geojson
    if (!geojson?.features || geojson.features.length === 0) {
      setAvailableColumns([])
      return
    }

    // Get properties from first feature
    const props = geojson.features[0].properties || {}
    const cols = Object.keys(props).filter(key => {
      // Exclude internal properties and check for string/number values
      if (key.startsWith('__')) return false
      const val = props[key]
      return typeof val === 'string' || typeof val === 'number'
    })
    setAvailableColumns(cols)
  }, [config?.geojson])

  const currentLabel = config.labelColumn || ''

  return (
    <div className="ml-6">
      <label className="block text-xs text-muted mb-1">Label column</label>
      <select
        value={currentLabel}
        onChange={(e) => handleConfigUpdate({ labelColumn: e.target.value })}
        className="w-full rounded border border-border bg-paper px-2 py-1 text-sm"
      >
        <option value="">Select column...</option>
        {availableColumns.map((col) => (
          <option key={col} value={col}>
            {col}
          </option>
        ))}
      </select>
    </div>
  )
}

/**
 * AdminLabelColumnSelector - Select which column to use for labels
 */
function AdminLabelColumnSelector({ layer, handleUpdate }) {
  const config = layer.adminConfig
  const layerConfig = getLayer(config.adminLayerId)
  const [availableColumns, setAvailableColumns] = useState([])

  // Load available columns from GeoJSON
  useEffect(() => {
    if (!layerConfig?.geojsonPath) return

    const loadColumns = async () => {
      try {
        const url = import.meta.env.BASE_URL + layerConfig.geojsonPath
        const response = await fetch(url)
        if (!response.ok) return
        const geojson = await response.json()

        // Get properties from first feature
        if (geojson.features && geojson.features.length > 0) {
          const props = geojson.features[0].properties || {}
          const cols = Object.keys(props).filter(key => 
            typeof props[key] === 'string' || typeof props[key] === 'number'
          )
          setAvailableColumns(cols)
        }
      } catch (err) {
        console.error('Failed to load admin feature columns:', err)
      }
    }

    loadColumns()
  }, [layerConfig])

  // Default to featureNameField if no labelColumn is set
  const currentLabel = config.labelColumn || layerConfig?.featureNameField || ''

  return (
    <div className="ml-6 mt-1">
      <label className="block text-xs text-muted mb-1">Label column</label>
      <select
        value={currentLabel}
        onChange={(e) => handleUpdate({ labelColumn: e.target.value })}
        className="w-full rounded border border-border bg-paper px-2 py-1 text-sm"
      >
        {availableColumns.length === 0 ? (
          <option value="">Loading...</option>
        ) : (
          availableColumns.map((col) => (
            <option key={col} value={col}>
              {col} {col === layerConfig?.featureNameField ? '(default)' : ''}
            </option>
          ))
        )}
      </select>
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
  const [adminFeatures, setAdminFeatures] = useState([])

  const hasData = Object.keys(config.featureValues || {}).length > 0

  // Load admin features from GeoJSON on mount
  useEffect(() => {
    if (!layerConfig?.geojsonPath) return

    const loadFeatures = async () => {
      try {
        const url = import.meta.env.BASE_URL + layerConfig.geojsonPath
        const response = await fetch(url)
        if (!response.ok) return
        const geojson = await response.json()

        const features = geojson.features.map((f) => ({
          featureId: f.properties[layerConfig.featureIdField],
          featureName: f.properties[layerConfig.featureNameField],
        }))
        setAdminFeatures(features)
      } catch (err) {
        console.error('Failed to load admin features:', err)
      }
    }

    loadFeatures()
  }, [layerConfig])

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
    if (adminFeatures.length === 0) {
      console.warn('Admin features not loaded yet')
      return
    }

    const result = matchFeatures(csvData, keyColumn, keyType, valueColumn, adminFeatures, layerConfig)
    setJoinResult(result)
    handleUpdate({ featureValues: result.valueMap })
  }, [csvData, keyColumn, keyType, valueColumn, adminFeatures, layerConfig, handleUpdate])

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
