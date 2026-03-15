import { useEffect, useRef, useCallback } from "react";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";
import { transformExtent } from "ol/proj";
import useDatasetsStore from "../store/datasetsStore";
import { FIT_PADDING } from "../utils/mapConstants";

/**
 * Create an OpenLayers style from a layer style config
 */
function createOLStyle(styleConfig) {
  const { type, fill, fillOpacity, stroke, strokeWidth, radius } = styleConfig;

  const fillColor = fill ? hexToRgba(fill, fillOpacity ?? 0.6) : undefined;
  const strokeStyle = stroke
    ? new Stroke({
        color: stroke,
        width: strokeWidth ?? 2,
      })
    : undefined;

  if (type === "point") {
    return new Style({
      image: new CircleStyle({
        radius: radius ?? 6,
        fill: fill ? new Fill({ color: fillColor }) : undefined,
        stroke: strokeStyle,
      }),
    });
  }

  if (type === "line") {
    return new Style({
      stroke:
        strokeStyle ||
        new Stroke({
          color: stroke || "#3498DB",
          width: strokeWidth ?? 3,
        }),
    });
  }

  // Polygon or default
  return new Style({
    fill: fill ? new Fill({ color: fillColor }) : undefined,
    stroke: strokeStyle,
  });
}

/**
 * Convert hex color to rgba
 */
function hexToRgba(hex, alpha = 1) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Hook to manage user-uploaded layers on the map
 */
export default function useUserLayers(map) {
  const userLayers = useDatasetsStore((s) => s.userLayers);
  const layersRef = useRef(new Map()); // layerId -> { olLayer, source }

  // Handle "fit to layer" events
  useEffect(() => {
    if (!map) return;

    const handleFitToLayer = (e) => {
      const { bbox } = e.detail;
      if (bbox && bbox.length === 4) {
        const extent = transformExtent(bbox, "EPSG:4326", "EPSG:3857");
        map.getView().fit(extent, { padding: FIT_PADDING, duration: 500 });
      }
    };

    window.addEventListener("fitToUserLayer", handleFitToLayer);
    return () => window.removeEventListener("fitToUserLayer", handleFitToLayer);
  }, [map]);

  // Sync layers with map
  useEffect(() => {
    if (!map) return;

    const currentLayerIds = new Set(userLayers.map((l) => l.id));
    const existingLayerIds = new Set(layersRef.current.keys());

    // Remove layers no longer in store
    for (const layerId of existingLayerIds) {
      if (!currentLayerIds.has(layerId)) {
        const { olLayer } = layersRef.current.get(layerId);
        map.removeLayer(olLayer);
        layersRef.current.delete(layerId);
      }
    }

    // Add or update layers
    for (const layer of userLayers) {
      const existing = layersRef.current.get(layer.id);

      if (existing) {
        // Update visibility
        existing.olLayer.setVisible(layer.visible);

        // Update style
        const style = createOLStyle(layer.style);
        existing.olLayer.setStyle(style);
      } else if (layer.geojson) {
        // Create new layer
        const format = new GeoJSON();
        const features = format.readFeatures(layer.geojson, {
          featureProjection: "EPSG:3857",
        });

        const source = new VectorSource({ features });
        const style = createOLStyle(layer.style);

        const olLayer = new VectorLayer({
          source,
          style,
          visible: layer.visible,
          properties: {
            userLayerId: layer.id,
            name: layer.name,
          },
        });

        // Add layer at a z-index above basemap but below UI overlays
        olLayer.setZIndex(10);
        map.addLayer(olLayer);

        layersRef.current.set(layer.id, { olLayer, source });
      }
    }
  }, [map, userLayers]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (map) {
        for (const { olLayer } of layersRef.current.values()) {
          map.removeLayer(olLayer);
        }
        layersRef.current.clear();
      }
    };
  }, [map]);

  // Expose fit function
  const fitToLayer = useCallback(
    (layerId) => {
      if (!map) return;
      const layer = userLayers.find((l) => l.id === layerId);
      if (layer?.bbox) {
        const extent = transformExtent(layer.bbox, "EPSG:4326", "EPSG:3857");
        map.getView().fit(extent, { padding: FIT_PADDING, duration: 500 });
      }
    },
    [map, userLayers]
  );

  return { fitToLayer };
}
