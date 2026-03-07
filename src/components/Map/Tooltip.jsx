import { useEffect, useRef, useCallback } from 'react'
import { createPortal } from 'react-dom'
import Overlay from 'ol/Overlay'
import useMapStore from '../../store/mapStore'

const formatValue = (v) => {
  if (v == null || v === '') return 'No data'
  const num = Number(v)
  if (isNaN(num)) return String(v)
  return Number.isInteger(num) ? num.toLocaleString() : num.toFixed(2)
}

export default function Tooltip({ map }) {
  const hoverRef = useRef(null)
  const clickRef = useRef(null)
  const hoverOverlayRef = useRef(null)
  const clickOverlayRef = useRef(null)

  // Set up OL Overlays once the map is ready
  useEffect(() => {
    if (!map) return

    const hoverOverlay = new Overlay({
      element: hoverRef.current,
      positioning: 'bottom-left',
      offset: [12, -10],
      stopEvent: false,
    })

    const clickOverlay = new Overlay({
      element: clickRef.current,
      positioning: 'top-left',
      offset: [0, 10],
      stopEvent: true,
    })

    map.addOverlay(hoverOverlay)
    map.addOverlay(clickOverlay)
    hoverOverlayRef.current = hoverOverlay
    clickOverlayRef.current = clickOverlay

    return () => {
      map.removeOverlay(hoverOverlay)
      map.removeOverlay(clickOverlay)
      hoverOverlayRef.current = null
      clickOverlayRef.current = null
    }
  }, [map])

  // Event handlers
  useEffect(() => {
    if (!map) return

    const getProvinceFeature = (pixel) => {
      let found = null
      map.forEachFeatureAtPixel(pixel, (f) => {
        if (f.get('ADM1_PCODE')) {
          found = f
          return true
        }
      })
      return found
    }

    const updateTooltipContent = (el, name, value, pcode) => {
      const nameEl = el.querySelector('[data-name]')
      const valueEl = el.querySelector('[data-value]')
      if (nameEl) nameEl.textContent = name
      if (valueEl) {
        valueEl.textContent = formatValue(value)
        valueEl.className = `text-sm font-mono leading-tight mt-0.5 ${value == null ? 'text-paper/50' : ''}`
      }
    }

    const updateClickContent = (el, name, value, pcode) => {
      const nameEl = el.querySelector('[data-click-name]')
      const pcodeEl = el.querySelector('[data-click-pcode]')
      const valueEl = el.querySelector('[data-click-value]')
      if (nameEl) nameEl.textContent = name
      if (pcodeEl) pcodeEl.textContent = pcode
      if (valueEl) valueEl.textContent = formatValue(value)
    }

    const handlePointerMove = (evt) => {
      const hoverOverlay = hoverOverlayRef.current
      if (!hoverOverlay) return

      if (evt.dragging) {
        hoverOverlay.setPosition(undefined)
        return
      }

      const feature = getProvinceFeature(evt.pixel)
      if (feature) {
        const name = feature.get('province_name')
        const pcode = feature.get('ADM1_PCODE')
        const joinResult = useMapStore.getState().joinResult
        const value = joinResult?.valueMap?.[pcode]
        updateTooltipContent(hoverRef.current, name, value, pcode)
        hoverOverlay.setPosition(evt.coordinate)
        map.getTargetElement().style.cursor = 'pointer'
      } else {
        hoverOverlay.setPosition(undefined)
        map.getTargetElement().style.cursor = ''
      }
    }

    const handleClick = (evt) => {
      const clickOverlay = clickOverlayRef.current
      if (!clickOverlay) return

      const feature = getProvinceFeature(evt.pixel)
      if (feature) {
        const name = feature.get('province_name')
        const pcode = feature.get('ADM1_PCODE')
        const joinResult = useMapStore.getState().joinResult
        const value = joinResult?.valueMap?.[pcode]
        updateClickContent(clickRef.current, name, value, pcode)
        clickOverlay.setPosition(evt.coordinate)
      } else {
        clickOverlay.setPosition(undefined)
      }
    }

    map.on('pointermove', handlePointerMove)
    map.on('singleclick', handleClick)
    return () => {
      map.un('pointermove', handlePointerMove)
      map.un('singleclick', handleClick)
    }
  }, [map])

  const dismissClick = useCallback(() => {
    clickOverlayRef.current?.setPosition(undefined)
  }, [])

  return createPortal(
    <>
      {/* Hover tooltip — OL Overlay element, portaled to body so OL can move it without breaking React's DOM tree */}
      <div ref={hoverRef} className="pointer-events-none">
        <div className="bg-ink/95 text-paper rounded-md px-3 py-2 shadow-lg whitespace-nowrap backdrop-blur-sm">
          <div data-name className="text-xs font-medium leading-tight" />
          <div data-value className="text-sm font-mono leading-tight mt-0.5" />
        </div>
      </div>

      {/* Click info panel — OL Overlay element */}
      <div ref={clickRef}>
        <div className="bg-paper/95 backdrop-blur-sm border border-border rounded-lg px-4 py-3 shadow-lg max-w-xs">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div data-click-name className="text-sm font-medium" />
              <div data-click-pcode className="text-xs text-muted mt-0.5" />
              <div data-click-value className="text-lg font-mono mt-1" />
            </div>
            <button
              onClick={dismissClick}
              className="text-muted hover:text-ink text-sm leading-none"
            >
              &times;
            </button>
          </div>
        </div>
      </div>
    </>,
    document.body
  )
}
