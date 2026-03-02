import { useRef, useEffect, useState } from 'react'
import Map from 'ol/Map'
import View from 'ol/View'
import TileLayer from 'ol/layer/Tile'
import { INDONESIA_EXTENT_3857, INDONESIA_PAN_EXTENT, FIT_PADDING } from '../utils/mapConstants'
import { createBasemapSource } from '../utils/basemapSources'
import useMapStore from '../store/mapStore'
import 'ol/ol.css'

export default function useMapInstance(targetRef) {
  const mapRef = useRef(null)
  const tileLayerRef = useRef(null)
  const [ready, setReady] = useState(false)
  const basemap = useMapStore((s) => s.basemap)

  useEffect(() => {
    if (!targetRef.current || mapRef.current) return

    const tileLayer = new TileLayer({ source: createBasemapSource('osm') })
    tileLayerRef.current = tileLayer

    const map = new Map({
      target: targetRef.current,
      layers: [tileLayer],
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

    // Apply the current basemap from store (may differ from default 'osm')
    const currentBasemap = useMapStore.getState().basemap
    if (currentBasemap !== 'osm') {
      if (currentBasemap === 'none') {
        tileLayer.setVisible(false)
      } else {
        tileLayer.setSource(createBasemapSource(currentBasemap))
      }
    }

    return () => {
      map.setTarget(undefined)
      mapRef.current = null
      tileLayerRef.current = null
    }
  }, [targetRef])

  useEffect(() => {
    const layer = tileLayerRef.current
    if (!layer) return

    if (basemap === 'none') {
      layer.setVisible(false)
    } else {
      layer.setSource(createBasemapSource(basemap))
      layer.setVisible(true)
    }
  }, [basemap])

  return { map: mapRef.current, ready }
}
