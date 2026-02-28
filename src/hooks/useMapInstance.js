import { useRef, useEffect, useState } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { fromLonLat } from 'ol/proj'
import 'ol/ol.css'

const INDONESIA_CENTER = fromLonLat([118, -2.5])

export default function useMapInstance(targetRef) {
  const mapRef = useRef(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!targetRef.current || mapRef.current) return

    const map = new Map({
      target: targetRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
      ],
      view: new View({
        center: INDONESIA_CENTER,
        zoom: 5,
        minZoom: 4,
        maxZoom: 12,
      }),
    })

    mapRef.current = map
    setReady(true)

    return () => {
      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [targetRef])

  return { map: mapRef.current, ready }
}
