import useMapStore from '../../store/mapStore'
import ColorRampPicker from '../UI/ColorRampPicker'
import ClassBreakEditor from '../UI/ClassBreakEditor'

const CLASS_METHODS = [
  { value: 'quantile', label: 'Quantile' },
  { value: 'equalInterval', label: 'Equal Interval' },
  { value: 'jenks', label: 'Natural Breaks (Jenks)' },
  { value: 'manual', label: 'Manual' },
]

export default function StyleTab() {
  const classMethod = useMapStore((s) => s.classMethod)
  const numClasses = useMapStore((s) => s.numClasses)
  const strokeColor = useMapStore((s) => s.strokeColor)
  const strokeWidth = useMapStore((s) => s.strokeWidth)
  const noDataColor = useMapStore((s) => s.noDataColor)
  const mapTitle = useMapStore((s) => s.mapTitle)
  const legendTitle = useMapStore((s) => s.legendTitle)
  const showProvinceLabels = useMapStore((s) => s.showProvinceLabels)
  const setClassMethod = useMapStore((s) => s.setClassMethod)
  const setNumClasses = useMapStore((s) => s.setNumClasses)
  const setStrokeColor = useMapStore((s) => s.setStrokeColor)
  const setStrokeWidth = useMapStore((s) => s.setStrokeWidth)
  const setNoDataColor = useMapStore((s) => s.setNoDataColor)
  const setMapTitle = useMapStore((s) => s.setMapTitle)
  const setLegendTitle = useMapStore((s) => s.setLegendTitle)
  const setShowProvinceLabels = useMapStore((s) => s.setShowProvinceLabels)

  return (
    <div className="space-y-5">
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
              onChange={(e) => setClassMethod(e.target.value)}
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
              onChange={(e) => setNumClasses(Number(e.target.value))}
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

      <div>
        <h3 className="text-sm font-medium mb-2">Appearance</h3>
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-sm flex-1">
              <span className="text-xs text-muted">Stroke</span>
              <input
                type="color"
                value={strokeColor}
                onChange={(e) => setStrokeColor(e.target.value)}
                className="w-6 h-6 rounded border border-border cursor-pointer"
              />
            </label>
            <label className="flex items-center gap-2 text-sm">
              <span className="text-xs text-muted">Width</span>
              <input
                type="number"
                value={strokeWidth}
                onChange={(e) => setStrokeWidth(Number(e.target.value))}
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
              onChange={(e) => setNoDataColor(e.target.value)}
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
              value={mapTitle}
              onChange={(e) => setMapTitle(e.target.value)}
              placeholder="e.g. GDP per Capita 2023"
              className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-sm"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted">Legend title</span>
            <input
              type="text"
              value={legendTitle}
              onChange={(e) => setLegendTitle(e.target.value)}
              placeholder="e.g. Million IDR"
              className="mt-1 block w-full rounded border border-border bg-paper px-2 py-1 text-sm"
            />
          </label>
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showProvinceLabels}
              onChange={(e) => setShowProvinceLabels(e.target.checked)}
            />
            Show province names
          </label>
        </div>
      </div>
    </div>
  )
}
