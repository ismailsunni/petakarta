import { useEffect, useRef, useCallback, useMemo } from "react";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";
import { transformExtent } from "ol/proj";
import useLayerTreeStore from "../store/layerTreeStore";
import { FIT_PADDING } from "../utils/mapConstants";
import {
  getColorFromValue,
  getCategoryColor,
  interpolateRamp,
} from "../utils/colorUtils";
import { computeBreaks } from "../utils/classificationUtils";

const BASE_Z_INDEX = 5;

/**
 * Create an OpenLayers style from a layer style config
 */
function createOLStyle(styleConfig, layerOpacity = 1) {
  const { type, fill, fillOpacity, stroke, strokeWidth, radius } = styleConfig;

  // Apply layer opacity to fill opacity
  const effectiveFillOpacity = (fillOpacity ?? 0.6) * layerOpacity;
  const fillColor = fill ? hexToRgba(fill, effectiveFillOpacity) : undefined;
  const strokeColor = stroke ? hexToRgba(stroke, layerOpacity) : undefined;

  const strokeStyle = stroke
    ? new Stroke({
        color: strokeColor,
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
          color: hexToRgba(stroke || "#3498DB", layerOpacity),
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
 * Create a graduated/categorized style function for user layers
 */
function createValueBasedStyleFunction(userConfig, layerOpacity = 1) {
  const {
    featureValues = {},
    styleMode = "single",
    colorRamp = "YlOrRd",
    numClasses = 5,
    classMethod = "quantile",
    manualBreaks,
    categoryColors = {},
    strokeColor = "#333333",
    strokeWidth = 1,
    noDataColor = "#e0e0e0",
  } = userConfig;

  // No values - return null to use default style
  if (Object.keys(featureValues).length === 0 || styleMode === "single") {
    return null;
  }

  // Compute breaks for graduated mode
  let breaks = null;
  if (styleMode === "graduated") {
    const values = Object.values(featureValues).map(Number).filter((v) => !isNaN(v));
    if (values.length > 0) {
      breaks = manualBreaks || computeBreaks(values, numClasses, classMethod);
    }
  }

  // Create style function
  return (feature, resolution) => {
    // Use feature's index position as the key
    const featureIndex = feature.get("__featureIndex");
    const value = featureValues[featureIndex];

    let fillColor = noDataColor;

    if (value !== undefined && value !== null) {
      if (styleMode === "graduated" && breaks) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          fillColor = getColorFromValue(numValue, breaks, colorRamp);
        }
      } else if (styleMode === "categorized") {
        const strValue = String(value);
        // Use category color if defined, otherwise generate one
        fillColor = categoryColors[strValue] || getCategoryColor(
          Object.keys(featureValues).indexOf(String(featureIndex)) % 20
        );
      }
    }

    return new Style({
      fill: new Fill({
        color: hexToRgba(fillColor, 0.8 * layerOpacity),
      }),
      stroke: new Stroke({
        color: hexToRgba(strokeColor, layerOpacity),
        width: strokeWidth,
      }),
    });
  };
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
  // Get user layers from layer tree
  const layers = useLayerTreeStore((s) => s.layers);
  const userLayers = layers.filter((l) => l.type === "user");

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
      const userConfig = layer.userConfig;

      if (existing) {
        // Update visibility
        existing.olLayer.setVisible(layer.visible);

        // Update z-index
        existing.olLayer.setZIndex(BASE_Z_INDEX + layer.order);

        // Update style (including opacity) - use value-based style if available
        const valueBasedStyle = createValueBasedStyleFunction(userConfig, layer.opacity);
        if (valueBasedStyle) {
          existing.olLayer.setStyle(valueBasedStyle);
        } else {
          const style = createOLStyle(userConfig.style, layer.opacity);
          existing.olLayer.setStyle(style);
        }
      } else if (userConfig?.geojson) {
        // Create new layer
        const format = new GeoJSON();
        const features = format.readFeatures(userConfig.geojson, {
          featureProjection: "EPSG:3857",
        });

        // Add index property to each feature for value lookup
        features.forEach((feature, index) => {
          feature.set("__featureIndex", index);
        });

        const source = new VectorSource({ features });

        // Use value-based style if available, otherwise basic style
        const valueBasedStyle = createValueBasedStyleFunction(userConfig, layer.opacity);
        const style = valueBasedStyle || createOLStyle(userConfig.style, layer.opacity);

        const olLayer = new VectorLayer({
          source,
          style,
          visible: layer.visible,
          properties: {
            layerTreeId: layer.id,
            datasetId: userConfig.datasetId,
            name: layer.name,
          },
        });

        olLayer.setZIndex(BASE_Z_INDEX + layer.order);
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
      if (layer?.userConfig?.bbox) {
        const extent = transformExtent(
          layer.userConfig.bbox,
          "EPSG:4326",
          "EPSG:3857"
        );
        map.getView().fit(extent, { padding: FIT_PADDING, duration: 500 });
      }
    },
    [map, userLayers]
  );

  return { fitToLayer };
}
