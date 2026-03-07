import { useEffect, useState } from 'react'
import useMapStore from '../../store/mapStore'
import { buildColorScale } from '../../utils/colorUtils'
import { getBreaks } from '../../utils/classificationUtils'

const POSITION_CLASSES = {
  'top-left': 'top-12 left-3',
  'top-right': 'top-12 right-3',
  'bottom-left': 'bottom-3 left-3',
  'bottom-right': 'bottom-3 right-3',
}

const NEXT_POSITION = {
  'bottom-right': 'bottom-left',
  'bottom-left': 'top-left',
  'top-left': 'top-right',
  'top-right': 'bottom-right',
}

const SMALL_THRESHOLD = 400

export default function Legend() {
  const [tooSmall, setTooSmall] = useState(
    () => window.innerHeight < SMALL_THRESHOLD || window.innerWidth < SMALL_THRESHOLD
  )

  useEffect(() => {
    const check = () =>
      setTooSmall(window.innerHeight < SMALL_THRESHOLD || window.innerWidth < SMALL_THRESHOLD)
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const joinResult = useMapStore((s) => s.joinResult)
  const styleMode = useMapStore((s) => s.styleMode)
  const colorPreset = useMapStore((s) => s.colorPreset)
  const colorReversed = useMapStore((s) => s.colorReversed)
  const classMethod = useMapStore((s) => s.classMethod)
  const numClasses = useMapStore((s) => s.numClasses)
  const manualBreaks = useMapStore((s) => s.manualBreaks)
  const categoryColors = useMapStore((s) => s.categoryColors)
  const noDataColor = useMapStore((s) => s.noDataColor)
  const legendTitle = useMapStore((s) => s.legendTitle)
  const legendPosition = useMapStore((s) => s.legendPosition)
  const setLegendPosition = useMapStore((s) => s.setLegendPosition)

  if (!joinResult || !joinResult.valueMap) return null
  if (tooSmall) return null

  const hasUnmatched = joinResult.unmatched > 0

  if (styleMode === 'categorized') {
    const entries = Object.entries(categoryColors).sort(([a], [b]) => a.localeCompare(b))
    if (entries.length === 0) return null

    return (
      <div
        id="map-legend"
        className={`absolute ${POSITION_CLASSES[legendPosition]} bg-white/90 backdrop-blur-sm border border-border rounded-lg p-3 min-w-[160px] shadow-md z-10 transition-all duration-300 pointer-events-auto`}
      >
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-medium text-ink">
            {legendTitle || 'Legend'}
          </span>
          <button
            onClick={() => setLegendPosition(NEXT_POSITION[legendPosition])}
            className="text-[10px] text-muted hover:text-ink transition-colors ml-2"
            title="Move legend"
          >
            Move
          </button>
        </div>

        <div className="space-y-0.5">
          {entries.map(([value, color]) => (
            <div key={value} className="flex items-center gap-2">
              <div
                className="w-4 h-3 rounded-sm border border-black/10 shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="text-[10px] text-ink">{value}</span>
            </div>
          ))}

          {hasUnmatched && (
            <div className="flex items-center gap-2 mt-1">
              <div
                className="w-4 h-3 rounded-sm border border-black/10 shrink-0"
                style={{ backgroundColor: noDataColor }}
              />
              <span className="text-[10px] text-muted">No data</span>
            </div>
          )}
        </div>
      </div>
    )
  }

  // Graduated mode
  const values = Object.values(joinResult.valueMap)
    .map(Number)
    .filter((v) => !isNaN(v))
  if (values.length === 0) return null

  const effectiveClasses = Math.min(numClasses, values.length)

  let breaks
  if (classMethod === 'manual' && manualBreaks.length === effectiveClasses + 1) {
    breaks = manualBreaks
  } else {
    breaks = getBreaks(values, classMethod, effectiveClasses)
  }

  const scale = buildColorScale(colorPreset, effectiveClasses, colorReversed)
  if (!scale || breaks.length < 2) return null

  const classColors = []
  for (let i = 0; i < effectiveClasses; i++) {
    const t = effectiveClasses === 1 ? 0.5 : i / (effectiveClasses - 1)
    classColors.push(scale(t).hex())
  }

  const formatNum = (n) => {
    if (Number.isInteger(n)) return n.toString()
    return n.toFixed(1)
  }

  return (
    <div
      id="map-legend"
      className={`absolute ${POSITION_CLASSES[legendPosition]} bg-white/90 backdrop-blur-sm border border-border rounded-lg p-3 min-w-[160px] shadow-md z-10 transition-all duration-300 pointer-events-auto`}
    >
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-medium text-ink">
          {legendTitle || 'Legend'}
        </span>
        <button
          onClick={() => setLegendPosition(NEXT_POSITION[legendPosition])}
          className="text-[10px] text-muted hover:text-ink transition-colors ml-2"
          title="Move legend"
        >
          Move
        </button>
      </div>

      <div className="space-y-0.5">
        {classColors.map((color, i) => (
          <div key={i} className="flex items-center gap-2">
            <div
              className="w-4 h-3 rounded-sm border border-black/10 shrink-0"
              style={{ backgroundColor: color }}
            />
            <span className="text-[10px] font-mono text-ink">
              {formatNum(breaks[i])} &ndash; {formatNum(breaks[i + 1])}
            </span>
          </div>
        ))}

        {hasUnmatched && (
          <div className="flex items-center gap-2 mt-1">
            <div
              className="w-4 h-3 rounded-sm border border-black/10 shrink-0"
              style={{ backgroundColor: noDataColor }}
            />
            <span className="text-[10px] text-muted">No data</span>
          </div>
        )}
      </div>
    </div>
  )
}
