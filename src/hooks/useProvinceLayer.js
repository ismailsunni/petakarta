import { useEffect, useRef } from 'react'
import VectorLayer from 'ol/layer/Vector'
import VectorSource from 'ol/source/Vector'
import GeoJSON from 'ol/format/GeoJSON'
import { Style, Fill, Stroke } from 'ol/style'

const DEFAULT_STYLE = new Style({
  fill: new Fill({ color: '#d4d0c8' }),
  stroke: new Stroke({ color: '#ffffff', width: 0.8 }),
})

export default function useProvinceLayer(map) {
  const layerRef = useRef(null)
  const sourceRef = useRef(null)

  useEffect(() => {
    if (!map) return

    const source = new VectorSource({
      url: import.meta.env.BASE_URL + 'data/indonesia_provinces.geojson',
      format: new GeoJSON(),
    })

    const layer = new VectorLayer({
      source,
      style: DEFAULT_STYLE,
    })

    map.addLayer(layer)
    layerRef.current = layer
    sourceRef.current = source

    return () => {
      map.removeLayer(layer)
    }
  }, [map])

  return { layer: layerRef.current, source: sourceRef.current }
}
