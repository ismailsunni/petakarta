import { useEffect, useMemo, useState } from 'react'
import useMapStore from '../../store/mapStore'
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
  const styleMode = useMapStore((s) => s.styleMode)
  const classMethod = useMapStore((s) => s.classMethod)
  const numClasses = useMapStore((s) => s.numClasses)
  const strokeColor = useMapStore((s) => s.strokeColor)
  const strokeWidth = useMapStore((s) => s.strokeWidth)
  const noDataColor = useMapStore((s) => s.noDataColor)
  const mapTitle = useMapStore((s) => s.mapTitle)
  const legendTitle = useMapStore((s) => s.legendTitle)
  const attribution = useMapStore((s) => s.attribution)
  const showFeatureLabels = useMapStore((s) => s.showFeatureLabels)
  const featureValues = useMapStore((s) => s.featureValues)
  const categoryColors = useMapStore((s) => s.categoryColors)
  const update = useMapStore((s) => s.update)

  // Local state for text inputs — avoids serializing large csvData on every keystroke
  const [localMapTitle, setLocalMapTitle] = useState(mapTitle)
  const [localLegendTitle, setLocalLegendTitle] = useState(legendTitle)
  const [localAttribution, setLocalAttribution] = useState(attribution)

  // Sync store → local when a project is loaded externally
  useEffect(() => { setLocalMapTitle(mapTitle) }, [mapTitle])
  useEffect(() => { setLocalLegendTitle(legendTitle) }, [legendTitle])
  useEffect(() => { setLocalAttribution(attribution) }, [attribution])

  const setMapTitle = (v) => update({ mapTitle: v })
  const setLegendTitle = (v) => update({ legendTitle: v })
  const setAttribution = (v) => update({ attribution: v })

  // Extract unique values from featureValues for categorized mode
  const uniqueValues = useMemo(() => {
    if (!featureValues || Object.keys(featureValues).length === 0) return []
    const vals = [...new Set(Object.values(featureValues).map(String))]
    vals.sort()
    return vals
  }, [featureValues])

  // Auto-assign colors when switching to categorized or when values change
  const effectiveCategoryColors = useMemo(() => {
    const colors = { ...categoryColors }
    uniqueValues.forEach((val, i) => {
      if (!colors[val]) {
        colors[val] = getCategoryColor(i)
      }
    })
    return colors
  }, [uniqueValues, categoryColors])

  // Sync auto-assigned colors to store when they differ
  const handleModeChange = (mode) => {
    if (mode === 'categorized') {
      const colors = {}
      uniqueValues.forEach((val, i) => {
        colors[val] = categoryColors[val] || getCategoryColor(i)
      })
      update({ styleMode: mode, categoryColors: colors })
    } else {
      update({ styleMode: mode })
    }
  }

  const handleCategoryColorChange = (val, color) => {
    update({ categoryColors: { ...effectiveCategoryColors, [val]: color } })
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-medium mb-2">Style Mode</h3>
        <div className="flex rounded border border-border overflow-hidden">
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

      {styleMode === 'graduated' && (
        <>
          <div>
            <h3 className="text-sm font-medium mb-2">Color Ramp</h3>
            <ColorRampPicker />
          </div>

          <div>
            <h3 className="text-sm font-medium mb-2">Classification</h3>
            <div className="space-y-2">
              <label className="block">
                <span className="text-xs text-muted">Method</span>
                <select
                  value={classMethod}
                  onChange={(e) => update({ classMethod: e.target.value })}
                  className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-sm"
                >
                  {CLASS_METHODS.map((m) => (
                    <option key={m.value} value={m.value}>{m.label}</option>
                  ))}
                </select>
              </label>

              <div>
                <span className="text-xs text-muted">Classes: {numClasses}</span>
                <input
                  type="range"
                  min={3}
                  max={9}
                  value={numClasses}
                  onChange={(e) => update({ numClasses: Number(e.target.value) })}
                  className="w-full mt-1 accent-accent"
                />
                <div className="flex justify-between text-[10px] text-muted">
                  <span>3</span>
                  <span>9</span>
                </div>
              </div>

              {classMethod === 'manual' && <ClassBreakEditor />}
            </div>
          </div>
        </>
      )}

      {styleMode === 'categorized' && (
        <div>
          <h3 className="text-sm font-medium mb-2">Category Colors</h3>
          {uniqueValues.length === 0 ? (
            <p className="text-xs text-muted">Upload data and join columns to see categories.</p>
          ) : (
            <div className="space-y-1.5 max-h-64 overflow-y-auto">
              {uniqueValues.map((val) => (
                <div key={val} className="flex items-center gap-2">
                  <input
                    type="color"
                    value={effectiveCategoryColors[val] || '#e0e0e0'}
                    onChange={(e) => handleCategoryColorChange(val, e.target.value)}
                    className="w-6 h-6 rounded border border-border cursor-pointer shrink-0"
                  />
                  <span className="text-xs text-ink truncate">{val}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div>
        <h3 className="text-sm font-medium mb-2">Appearance</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm flex-1">
              <span className="text-xs text-muted">Stroke</span>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => update({ strokeColor: e.target.value })}
                className="w-6 h-6 rounded border border-border cursor-pointer"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-xs text-muted">Width</span>
              <input
                type="number"
                value={strokeWidth}
                onChange={(e) => update({ strokeWidth: Number(e.target.value) })}
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
              value={noDataColor}
              onChange={(e) => update({ noDataColor: e.target.value })}
              className="w-6 h-6 rounded border border-border cursor-pointer"
            />
          </label>
        </div>
      </div>

      <div>
        <h3 className="text-sm font-medium mb-2">Labels</h3>
        <div className="space-y-2">
          <label className="block">
            <span className="text-xs text-muted">Map title</span>
            <input
              type="text"
              value={localMapTitle}
              onChange={(e) => setLocalMapTitle(e.target.value)}
              onBlur={() => setMapTitle(localMapTitle)}
              onKeyDown={(e) => e.key === 'Enter' && setMapTitle(localMapTitle)}
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
              onBlur={() => setLegendTitle(localLegendTitle)}
              onKeyDown={(e) => e.key === 'Enter' && setLegendTitle(localLegendTitle)}
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
              onBlur={() => setAttribution(localAttribution)}
              onKeyDown={(e) => e.key === 'Enter' && setAttribution(localAttribution)}
              placeholder="e.g. Source: BPS 2023"
              className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showFeatureLabels}
              onChange={(e) => update({ showFeatureLabels: e.target.checked })}
            />
            Show area names
          </label>
        </div>
      </div>
    </div>
  )
}
