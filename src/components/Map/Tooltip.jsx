import { useEffect, useRef, useCallback, useState } from 'react'
import { createPortal } from 'react-dom'
import Overlay from 'ol/Overlay'
import useLayerTreeStore from '../../store/layerTreeStore'
import { getLayer } from '../../utils/adminLayers'

const formatValue = (v) => {
  if (v == null || v === '') return 'No data'
  const num = Number(v)
  if (isNaN(num)) return String(v)
  return Number.isInteger(num) ? num.toLocaleString() : num.toFixed(2)
}

/**
 * Find all admin layer features at a pixel
 */
const getAllAdminFeatures = (map, pixel) => {
  const { layers } = useLayerTreeStore.getState()
  const results = []
  const seenLayerIds = new Set()

  map.forEachFeatureAtPixel(pixel, (feature) => {
    for (const layer of layers) {
      if (layer.type !== 'admin') continue
      if (seenLayerIds.has(layer.id)) continue

      const layerConfig = getLayer(layer.adminConfig?.adminLayerId)
      if (!layerConfig) continue

      const featureId = feature.get(layerConfig.featureIdField)
      if (featureId !== undefined) {
        const featureName = feature.get(layerConfig.featureNameField)
        const featureValues = layer.adminConfig?.featureValues || {}
        const value = featureValues[featureId]

        results.push({
          layerName: layer.name,
          layerTitle: layer.title || layer.name,
          featureId,
          featureName,
          value,
        })
        seenLayerIds.add(layer.id)
        break // This feature matched this layer, move to next feature
      }
    }
  })

  return results
}

export default function Tooltip({ map }) {
  const hoverRef = useRef(null)
  const clickRef = useRef(null)
  const hoverOverlayRef = useRef(null)
  const clickOverlayRef = useRef(null)

  // State for dynamic content
  const [hoverData, setHoverData] = useState([])
  const [clickData, setClickData] = useState([])

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

    const handlePointerMove = (evt) => {
      const hoverOverlay = hoverOverlayRef.current
      if (!hoverOverlay) return

      if (evt.dragging) {
        hoverOverlay.setPosition(undefined)
        setHoverData([])
        return
      }

      const features = getAllAdminFeatures(map, evt.pixel)
      if (features.length > 0) {
        setHoverData(features)
        hoverOverlay.setPosition(evt.coordinate)
        map.getTargetElement().style.cursor = 'pointer'
      } else {
        hoverOverlay.setPosition(undefined)
        setHoverData([])
        map.getTargetElement().style.cursor = ''
      }
    }

    const handleClick = (evt) => {
      const clickOverlay = clickOverlayRef.current
      if (!clickOverlay) return

      const features = getAllAdminFeatures(map, evt.pixel)
      if (features.length > 0) {
        setClickData(features)
        clickOverlay.setPosition(evt.coordinate)
      } else {
        clickOverlay.setPosition(undefined)
        setClickData([])
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
    setClickData([])
  }, [])

  return createPortal(
    <>
      {/* Hover tooltip — OL Overlay element */}
      <div ref={hoverRef} className="pointer-events-none">
        {hoverData.length > 0 && (
          <div className="bg-ink/95 text-paper rounded-md px-3 py-2 shadow-lg whitespace-nowrap backdrop-blur-sm">
            {hoverData.map((item, i) => (
              <div key={i} className={i > 0 ? 'mt-2 pt-2 border-t border-paper/20' : ''}>
                {hoverData.length > 1 && (
                  <div className="text-[10px] text-paper/60 leading-tight mb-0.5">{item.layerTitle}</div>
                )}
                <div className="text-xs font-medium leading-tight">{item.featureName}</div>
                <div className={`text-sm font-mono leading-tight mt-0.5 ${item.value == null ? 'text-paper/50' : ''}`}>
                  {formatValue(item.value)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Click info panel — OL Overlay element */}
      <div ref={clickRef}>
        {clickData.length > 0 && (
          <div className="bg-paper/95 backdrop-blur-sm border border-border rounded-lg px-4 py-3 shadow-lg max-w-xs">
            <div className="flex items-start justify-between gap-3">
              <div className="space-y-2">
                {clickData.map((item, i) => (
                  <div key={i} className={i > 0 ? 'pt-2 border-t border-border' : ''}>
                    {clickData.length > 1 && (
                      <div className="text-[10px] text-muted leading-tight mb-0.5">{item.layerTitle}</div>
                    )}
                    <div className="text-sm font-medium">{item.featureName}</div>
                    <div className="text-xs text-muted mt-0.5">{item.featureId}</div>
                    <div className="text-lg font-mono mt-1">{formatValue(item.value)}</div>
                  </div>
                ))}
              </div>
              <button
                onClick={dismissClick}
                className="text-muted hover:text-ink text-sm leading-none shrink-0"
              >
                &times;
              </button>
            </div>
          </div>
        )}
      </div>
    </>,
    document.body
  )
}
