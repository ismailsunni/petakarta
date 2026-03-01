import { useEffect, useRef } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import Feature from 'ol/Feature'
import { fromExtent } from 'ol/geom/Polygon'
import { Style, Stroke, Fill } from 'ol/style'
import { INDONESIA_EXTENT_3857 } from '../../utils/mapConstants'

const boundsStyle = new Style({
  stroke: new Stroke({ color: 'rgba(26, 26, 46, 0.3)', width: 2, lineDash: [8, 6] }),
  fill: new Fill({ color: 'transparent' }),
})

export default function ExportBounds({ map }) {
  const layerRef = useRef(null)

  useEffect(() => {
    if (!map) return

    const feature = new Feature(fromExtent(INDONESIA_EXTENT_3857))
    const source = new VectorSource({ features: [feature] })
    const layer = new VectorLayer({
      source,
      style: boundsStyle,
      zIndex: 100,
    })

    map.addLayer(layer)
    layerRef.current = layer

    return () => {
      map.removeLayer(layer)
      layerRef.current = null
    }
  }, [map])

  return null
}
