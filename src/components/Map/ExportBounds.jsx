import { useState, useEffect, useCallback } from 'react'
import { INDONESIA_EXTENT_3857 } from '../../utils/mapConstants'

export default function ExportBounds({ map, children }) {
  const [rect, setRect] = useState(null)

  const updateRect = useCallback(() => {
    if (!map) return
    const tl = map.getPixelFromCoordinate([INDONESIA_EXTENT_3857[0], INDONESIA_EXTENT_3857[3]])
    const br = map.getPixelFromCoordinate([INDONESIA_EXTENT_3857[2], INDONESIA_EXTENT_3857[1]])
    if (!tl || !br) return
    setRect({
      left: Math.round(tl[0]),
      top: Math.round(tl[1]),
      width: Math.round(br[0] - tl[0]),
      height: Math.round(br[1] - tl[1]),
    })
  }, [map])

  useEffect(() => {
    if (!map) return
    updateRect()
    map.on('moveend', updateRect)
    map.on('change:size', updateRect)
    map.getView().on('change:resolution', updateRect)
    return () => {
      map.un('moveend', updateRect)
      map.un('change:size', updateRect)
      map.getView().un('change:resolution', updateRect)
    }
  }, [map, updateRect])

  if (!rect || rect.width <= 0 || rect.height <= 0) return null

  return (
    <div
      id="export-bounds"
      className="absolute pointer-events-none z-[5]"
      style={{
        left: rect.left,
        top: rect.top,
        width: rect.width,
        height: rect.height,
      }}
    >
      {/* Border rectangle */}
      <div className="absolute inset-0 border-2 border-ink/30 border-dashed rounded" />
      {/* Legend and other children go inside the bounds */}
      <div className="absolute inset-0 pointer-events-auto">
        {children}
      </div>
    </div>
  )
}
