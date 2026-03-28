import { useEffect, useRef, useCallback, useMemo } from "react";
import { Vector as VectorLayer } from "ol/layer";
import { Vector as VectorSource } from "ol/source";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Fill, Stroke, Circle as CircleStyle } from "ol/style";
import { transformExtent } from "ol/proj";
import useLayerTreeStore from "../store/layerTreeStore";
import { FIT_PADDING } from "../utils/mapConstants";
import { buildColorScale, getCategoryColor } from "../utils/colorUtils";
import { getBreaks } from "../utils/classificationUtils";
import { downloadDataset } from "../lib/datasetsService";
import { makeLabelStyle } from "../utils/styleUtils";

const BASE_Z_INDEX = 5;

/**
 * Convert lineDash string to OL lineDash array
 */
function getLineDashArray(lineDash) {
  if (lineDash === 'dashed') return [8, 4]
  if (lineDash === 'dotted') return [2, 4]
  return undefined // solid
}

/**
 * Create an OpenLayers style from userConfig (unified style properties)
 */
function createStyleFromConfig(userConfig, layerOpacity = 1) {
  const geometryType = userConfig.geometryType?.toLowerCase() || "";
  const {
    fillColor = "#3498DB",
    strokeColor = "#ffffff",
    strokeWidth = 0.8,
    pointRadius = 6,
    noDataColor = "#e0e0e0",
    showFeatureLabels = false,
    labelColumn = "",
    lineDash = 'solid',
    labelFontSize = 11,
    labelColor = '#1a1a2e',
  } = userConfig;

  const fillColorWithAlpha = hexToRgba(fillColor, 0.8 * layerOpacity);
  const strokeColorWithAlpha = hexToRgba(strokeColor, layerOpacity);
  const lineDashArray = getLineDashArray(lineDash);

  if (geometryType.includes("point")) {
    return new Style({
      image: new CircleStyle({
        radius: pointRadius,
        fill: new Fill({ color: fillColorWithAlpha }),
        stroke: new Stroke({
          color: strokeColorWithAlpha,
          width: strokeWidth,
        }),
      }),
    });
  }

  if (geometryType.includes("line")) {
    return new Style({
      stroke: new Stroke({
        color: strokeColorWithAlpha,
        width: strokeWidth,
        lineDash: lineDashArray,
      }),
    });
  }

  // Polygon or default - support labels
  if (showFeatureLabels && labelColumn) {
    return (feature) => {
      const styles = [
        new Style({
          fill: new Fill({ color: fillColorWithAlpha }),
          stroke: new Stroke({
            color: strokeColorWithAlpha,
            width: strokeWidth,
          }),
        }),
      ];
      const labelStyle = makeLabelStyle(feature, labelColumn, labelFontSize, labelColor);
      if (labelStyle) {
        styles.push(labelStyle);
      }
      return styles;
    };
  }

  return new Style({
    fill: new Fill({ color: fillColorWithAlpha }),
    stroke: new Stroke({
      color: strokeColorWithAlpha,
      width: strokeWidth,
    }),
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
    showFeatureLabels = false,
    labelColumn = "",
    labelFontSize = 11,
    labelColor = '#1a1a2e',
  } = userConfig;

  // No values - return null to use default style
  if (Object.keys(featureValues).length === 0 || styleMode === "single") {
    return null;
  }

  // Compute breaks and color scale for graduated mode
  let breaks = null;
  let colorScale = null;
  if (styleMode === "graduated") {
    const values = Object.values(featureValues)
      .map(Number)
      .filter((v) => !isNaN(v));
    if (values.length > 0) {
      breaks = manualBreaks || getBreaks(values, classMethod, numClasses);
      colorScale = buildColorScale(colorRamp, numClasses, false);
    }
  }

  // Create style function
  return (feature, resolution) => {
    // Use feature's index position as the key
    const featureIndex = feature.get("__featureIndex");
    const value = featureValues[featureIndex];

    let fillColor = noDataColor;

    if (value !== undefined && value !== null) {
      if (styleMode === "graduated" && breaks && colorScale) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          // Find which class the value falls into and get corresponding color
          fillColor = colorScale(numValue).hex();
        }
      } else if (styleMode === "categorized") {
        const strValue = String(value);
        // Use category color if defined, otherwise generate one
        fillColor =
          categoryColors[strValue] ||
          getCategoryColor(
            Object.keys(featureValues).indexOf(String(featureIndex)) % 20
          );
      }
    }

    const styles = [
      new Style({
        fill: new Fill({
          color: hexToRgba(fillColor, 0.8 * layerOpacity),
        }),
        stroke: new Stroke({
          color: hexToRgba(strokeColor, layerOpacity),
          width: strokeWidth,
        }),
      }),
    ];

    // Add label if enabled and column is set
    if (showFeatureLabels && labelColumn) {
      const labelStyle = makeLabelStyle(feature, labelColumn, labelFontSize, labelColor);
      if (labelStyle) {
        styles.push(labelStyle);
      }
    }

    return styles;
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
  const setUserLayerGeojson = useLayerTreeStore((s) => s.setUserLayerGeojson);
  const userLayers = layers.filter((l) => l.type === "user");

  const layersRef = useRef(new Map()); // layerId -> { olLayer, source }
  const fetchingRef = useRef(new Set()); // Track layers currently being fetched

  // Re-fetch geojson for persisted layers that lost their data
  useEffect(() => {
    for (const layer of userLayers) {
      const { id, userConfig } = layer;
      if (!userConfig?.geojson && !fetchingRef.current.has(id)) {
        if (userConfig?.remoteUrl) {
          // Remote GeoJSON layer — fetch from URL
          fetchingRef.current.add(id);
          fetch(userConfig.remoteUrl)
            .then(async (res) => {
              if (!res.ok) throw new Error(`HTTP ${res.status}`);
              const data = await res.json();
              setUserLayerGeojson(id, data);
            })
            .catch((err) => {
              console.error(
                `Failed to re-fetch remote GeoJSON for layer ${layer.name}:`,
                err
              );
            })
            .finally(() => {
              fetchingRef.current.delete(id);
            });
        } else if (userConfig?.storagePath) {
          // Supabase storage layer — fetch via downloadDataset
          fetchingRef.current.add(id);
          downloadDataset(userConfig.storagePath)
            .then(({ data, error }) => {
              if (data && !error) {
                setUserLayerGeojson(id, data);
              } else {
                console.error(
                  `Failed to re-fetch geojson for layer ${layer.name}:`,
                  error
                );
              }
            })
            .finally(() => {
              fetchingRef.current.delete(id);
            });
        }
      }
    }
  }, [userLayers, setUserLayerGeojson]);

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
        const valueBasedStyle = createValueBasedStyleFunction(
          userConfig,
          layer.opacity
        );
        if (valueBasedStyle) {
          existing.olLayer.setStyle(valueBasedStyle);
        } else {
          const style = createStyleFromConfig(userConfig, layer.opacity);
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
        const valueBasedStyle = createValueBasedStyleFunction(
          userConfig,
          layer.opacity
        );
        const style =
          valueBasedStyle || createStyleFromConfig(userConfig, layer.opacity);

        const olLayer = new VectorLayer({
          source,
          style,
          declutter: true,
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
