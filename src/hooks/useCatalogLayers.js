import { useEffect, useRef } from 'react'
import TileLayer from 'ol/layer/Tile'
import XYZ from 'ol/source/XYZ'
import TileWMS from 'ol/source/TileWMS'
import useLayerTreeStore from '../store/layerTreeStore'

const BASE_Z_INDEX = 5

function createCatalogSource(catalogConfig) {
  if (catalogConfig.type === 'wms') {
    return new TileWMS({
      url: catalogConfig.url,
      params: {
        LAYERS: catalogConfig.layers,
        FORMAT: catalogConfig.format || 'image/png',
      },
      attributions: catalogConfig.attribution || '',
    })
  }
  // Default: xyz
  return new XYZ({
    url: catalogConfig.url,
    attributions: catalogConfig.attribution || '',
    maxZoom: 20,
  })
}

export default function useCatalogLayers(map) {
  const layersRef = useRef(new Map())

  const layers = useLayerTreeStore((s) => s.layers)
  const catalogLayers = layers.filter((l) => l.type === 'catalog')

  // Sync OL layers with layer tree
  useEffect(() => {
    if (!map) return

    const currentLayerIds = new Set(catalogLayers.map((l) => l.id))
    const existingLayerIds = new Set(layersRef.current.keys())

    // Remove layers no longer in tree
    for (const layerId of existingLayerIds) {
      if (!currentLayerIds.has(layerId)) {
        const { olLayer } = layersRef.current.get(layerId)
        map.removeLayer(olLayer)
        layersRef.current.delete(layerId)
      }
    }

    // Add or update layers
    for (const layer of catalogLayers) {
      const existing = layersRef.current.get(layer.id)

      if (existing) {
        existing.olLayer.setVisible(layer.visible)
        existing.olLayer.setOpacity(layer.opacity)
        existing.olLayer.setZIndex(BASE_Z_INDEX + layer.order)
      } else {
        const source = createCatalogSource(layer.catalogConfig)
        const olLayer = new TileLayer({
          source,
          visible: layer.visible,
          opacity: layer.opacity,
          properties: {
            layerTreeId: layer.id,
            catalogId: layer.catalogConfig.catalogId,
          },
        })
        olLayer.setZIndex(BASE_Z_INDEX + layer.order)
        map.addLayer(olLayer)
        layersRef.current.set(layer.id, { olLayer, source })
      }
    }
  }, [map, catalogLayers])

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map) {
        for (const { olLayer } of layersRef.current.values()) {
          map.removeLayer(olLayer)
        }
        layersRef.current.clear()
      }
    }
  }, [map])

  return { layersRef }
}
