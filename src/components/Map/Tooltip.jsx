import { useState, useEffect } from 'react'
import useMapStore from '../../store/mapStore'

export default function Tooltip({ map }) {
  const [tooltip, setTooltip] = useState({ visible: false, x: 0, y: 0, name: '', value: null })
  const joinResult = useMapStore((s) => s.joinResult)

  useEffect(() => {
    if (!map) return

    const handlePointerMove = (evt) => {
      if (evt.dragging) {
        setTooltip((prev) => prev.visible ? { ...prev, visible: false } : prev)
        return
      }

      const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f)
      if (feature) {
        const name = feature.get('province_name')
        const pcode = feature.get('ADM1_PCODE')
        const value = joinResult?.valueMap?.[pcode]
        setTooltip({ visible: true, x: evt.pixel[0], y: evt.pixel[1], name, value })
        map.getTargetElement().style.cursor = 'pointer'
      } else {
        setTooltip({ visible: false, x: 0, y: 0, name: '', value: null })
        map.getTargetElement().style.cursor = ''
      }
    }

    map.on('pointermove', handlePointerMove)
    return () => {
      map.un('pointermove', handlePointerMove)
    }
  }, [map, joinResult])

  if (!tooltip.visible) return null

  const formatValue = (v) => {
    if (v == null || isNaN(v)) return 'No data'
    return Number.isInteger(v) ? v.toLocaleString() : v.toFixed(2)
  }

  return (
    <div
      className="absolute pointer-events-none z-20"
      style={{
        left: tooltip.x + 12,
        top: tooltip.y - 10,
        transform: 'translateY(-100%)',
      }}
    >
      <div className="bg-ink/95 text-paper rounded-md px-3 py-2 shadow-lg whitespace-nowrap backdrop-blur-sm">
        <div className="text-xs font-medium leading-tight">{tooltip.name}</div>
        <div className={`text-sm font-mono leading-tight mt-0.5 ${tooltip.value == null ? 'text-paper/50' : ''}`}>
          {formatValue(tooltip.value)}
        </div>
      </div>
    </div>
  )
}
