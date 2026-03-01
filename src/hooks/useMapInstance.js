import { useRef, useEffect, useState } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import OSM from 'ol/source/OSM'
import { INDONESIA_EXTENT_3857, INDONESIA_PAN_EXTENT, FIT_PADDING } from '../utils/mapConstants'
import 'ol/ol.css'

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
        minZoom: 4,
        maxZoom: 12,
        extent: INDONESIA_PAN_EXTENT,
        constrainOnlyCenter: true,
      }),
    })

    // Fit to Indonesia on initial load — same extent as Fit button and Export
    map.getView().fit(INDONESIA_EXTENT_3857, { padding: FIT_PADDING })

    mapRef.current = map
    setReady(true)

    return () => {
      map.setTarget(undefined)
      mapRef.current = null
    }
  }, [targetRef])

  return { map: mapRef.current, ready }
}
