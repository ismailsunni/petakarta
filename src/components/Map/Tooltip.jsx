import { useState, useEffect, useRef } from 'react'
import useMapStore from '../../store/mapStore'

export default function Tooltip({ map }) {
  const [hover, setHover] = useState({ visible: false, x: 0, y: 0, name: '', value: null })
  const [clicked, setClicked] = useState(null) // { name, value, pcode }
  const joinResultRef = useRef(null)

  // Keep a ref to joinResult so event handlers always see the latest
  const joinResult = useMapStore((s) => s.joinResult)
  useEffect(() => {
    joinResultRef.current = joinResult
  }, [joinResult])

  useEffect(() => {
    if (!map) return

    const getProvinceFeature = (pixel) => {
      let found = null
      map.forEachFeatureAtPixel(pixel, (f) => {
        if (f.get('ADM1_PCODE')) {
          found = f
          return true // stop iteration
        }
      })
      return found
    }

    const handlePointerMove = (evt) => {
      if (evt.dragging) {
        setHover((prev) => prev.visible ? { ...prev, visible: false } : prev)
        return
      }

      const feature = getProvinceFeature(evt.pixel)
      if (feature) {
        const name = feature.get('province_name')
        const pcode = feature.get('ADM1_PCODE')
        const value = joinResultRef.current?.valueMap?.[pcode]
        setHover({ visible: true, x: evt.pixel[0], y: evt.pixel[1], name, value })
        map.getTargetElement().style.cursor = 'pointer'
      } else {
        setHover({ visible: false, x: 0, y: 0, name: '', value: null })
        map.getTargetElement().style.cursor = ''
      }
    }

    const handleClick = (evt) => {
      const feature = getProvinceFeature(evt.pixel)
      if (feature) {
        const name = feature.get('province_name')
        const pcode = feature.get('ADM1_PCODE')
        const value = joinResultRef.current?.valueMap?.[pcode]
        setClicked({ name, value, pcode })
      } else {
        setClicked(null)
      }
    }

    map.on('pointermove', handlePointerMove)
    map.on('singleclick', handleClick)
    return () => {
      map.un('pointermove', handlePointerMove)
      map.un('singleclick', handleClick)
    }
  }, [map])

  const formatValue = (v) => {
    if (v == null || v === '') return 'No data'
    const num = Number(v)
    if (isNaN(num)) return String(v)
    return Number.isInteger(num) ? num.toLocaleString() : num.toFixed(2)
  }

  return (
    <>
      {/* Hover tooltip */}
      {hover.visible && (
        <div
          className="absolute pointer-events-none z-20"
          style={{
            left: hover.x + 12,
            top: hover.y - 10,
            transform: 'translateY(-100%)',
          }}
        >
          <div className="bg-ink/95 text-paper rounded-md px-3 py-2 shadow-lg whitespace-nowrap backdrop-blur-sm">
            <div className="text-xs font-medium leading-tight">{hover.name}</div>
            <div className={`text-sm font-mono leading-tight mt-0.5 ${hover.value == null ? 'text-paper/50' : ''}`}>
              {formatValue(hover.value)}
            </div>
          </div>
        </div>
      )}

      {/* Click info panel */}
      {clicked && (
        <div className="absolute bottom-3 left-3 z-20 bg-paper/95 backdrop-blur-sm border border-border rounded-lg px-4 py-3 shadow-lg max-w-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{clicked.name}</div>
              <div className="text-xs text-muted mt-0.5">{clicked.pcode}</div>
              <div className="text-lg font-mono mt-1">{formatValue(clicked.value)}</div>
            </div>
            <button
              onClick={() => setClicked(null)}
              className="text-muted hover:text-ink text-sm leading-none"
            >
              &times;
            </button>
          </div>
        </div>
      )}
    </>
  )
}
