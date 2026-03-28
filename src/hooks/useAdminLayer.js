import { useEffect, useRef } from "react";
import VectorLayer from "ol/layer/Vector";
import VectorSource from "ol/source/Vector";
import GeoJSON from "ol/format/GeoJSON";
import { Style, Fill, Stroke } from "ol/style";
import { transformExtent } from "ol/proj";
import useLayerTreeStore from "../store/layerTreeStore";
import { getLayer } from "../utils/adminLayers";
import {
  makeLabelStyle,
  buildGraduatedStyleFn,
  buildCategorizedStyleFn,
} from "../utils/styleUtils";
import { FIT_PADDING } from "../utils/mapConstants";

const DEFAULT_STYLE = new Style({
  fill: new Fill({ color: "#d4d0c8" }),
  stroke: new Stroke({ color: "#ffffff", width: 0.8 }),
});

const BASE_Z_INDEX = 5;

export default function useAdminLayer(map) {
  // Map of layerId -> { olLayer, source }
  const layersRef = useRef(new Map());

  // Get admin layers from layer tree
  const layers = useLayerTreeStore((s) => s.layers);
  const adminLayers = layers.filter((l) => l.type === "admin");

  // Handle "fit to admin layer" events
  useEffect(() => {
    if (!map) return;

    const handleFitToLayer = (e) => {
      const { adminLayerId } = e.detail;
      const layerConfig = getLayer(adminLayerId);
      if (layerConfig?.bbox) {
        const extent = transformExtent(
          layerConfig.bbox,
          "EPSG:4326",
          "EPSG:3857"
        );
        map.getView().fit(extent, { padding: FIT_PADDING, duration: 500 });
      }
    };

    window.addEventListener("fitToAdminLayer", handleFitToLayer);
    return () =>
      window.removeEventListener("fitToAdminLayer", handleFitToLayer);
  }, [map]);

  // Sync OL layers with layer tree
  useEffect(() => {
    if (!map) return;

    const currentLayerIds = new Set(adminLayers.map((l) => l.id));
    const existingLayerIds = new Set(layersRef.current.keys());

    // Remove layers no longer in tree
    for (const layerId of existingLayerIds) {
      if (!currentLayerIds.has(layerId)) {
        const { olLayer } = layersRef.current.get(layerId);
        map.removeLayer(olLayer);
        layersRef.current.delete(layerId);
      }
    }

    // Add or update layers
    for (const layer of adminLayers) {
      const existing = layersRef.current.get(layer.id);
      const layerConfig = getLayer(layer.adminConfig.adminLayerId);

      if (existing) {
        // Update existing layer
        existing.olLayer.setVisible(layer.visible);
        existing.olLayer.setOpacity(layer.opacity);
        existing.olLayer.setZIndex(BASE_Z_INDEX + layer.order);

        // Update style
        updateLayerStyle(existing.olLayer, layer, layerConfig);
      } else {
        // Create new layer
        const source = new VectorSource({
          url: import.meta.env.BASE_URL + layerConfig.geojsonPath,
          format: new GeoJSON(),
        });

        const olLayer = new VectorLayer({
          source,
          style: DEFAULT_STYLE,
          declutter: true,
          visible: layer.visible,
          opacity: layer.opacity,
          properties: {
            layerTreeId: layer.id,
            adminLayerId: layer.adminConfig.adminLayerId,
          },
        });

        olLayer.setZIndex(BASE_Z_INDEX + layer.order);

        // On load, fit to extent for the first layer added
        source.once("change", () => {
          if (source.getState() === "ready") {
            // If this is the only layer, fit to it
            if (adminLayers.length === 1 && adminLayers[0].id === layer.id) {
              const extent = transformExtent(
                layerConfig.bbox,
                "EPSG:4326",
                "EPSG:3857"
              );
              map
                .getView()
                .fit(extent, { padding: FIT_PADDING, duration: 400 });
            }
            // Apply style after features are loaded
            updateLayerStyle(olLayer, layer, layerConfig);
          }
        });

        map.addLayer(olLayer);
        layersRef.current.set(layer.id, { olLayer, source });
      }
    }
  }, [map, adminLayers]);

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

  return { layersRef };
}

/**
 * Update the style of an admin layer based on its config
 */
function updateLayerStyle(olLayer, layer, layerConfig) {
  const config = layer.adminConfig;
  const featureValues = config.featureValues || {};
  // Determine label field: use labelColumn if set, otherwise default to featureNameField
  const labelField = config.labelColumn || layerConfig.featureNameField;

  const labelFontSize = config.labelFontSize ?? 11;
  const labelColor = config.labelColor ?? "#1a1a2e";

  // Single style mode - use fill color
  if (config.styleMode === "single") {
    if (config.showFeatureLabels) {
      olLayer.setStyle((feature) => {
        const styles = [
          new Style({
            fill: new Fill({ color: config.fillColor || "#3498DB" }),
            stroke: new Stroke({
              color: config.strokeColor || "#ffffff",
              width: config.strokeWidth || 0.8,
            }),
          }),
        ];
        const labelStyle = makeLabelStyle(feature, labelField, labelFontSize, labelColor);
        if (labelStyle) styles.push(labelStyle);
        return styles;
      });
    } else {
      olLayer.setStyle(
        new Style({
          fill: new Fill({ color: config.fillColor || "#3498DB" }),
          stroke: new Stroke({
            color: config.strokeColor || "#ffffff",
            width: config.strokeWidth || 0.8,
          }),
        })
      );
    }
    return;
  }

  // No feature values - use no-data style
  if (!featureValues || Object.keys(featureValues).length === 0) {
    if (config.showFeatureLabels) {
      olLayer.setStyle((feature) => {
        const styles = [
          new Style({
            fill: new Fill({ color: config.noDataColor || "#d4d0c8" }),
            stroke: new Stroke({
              color: config.strokeColor || "#ffffff",
              width: config.strokeWidth || 0.8,
            }),
          }),
        ];
        const labelStyle = makeLabelStyle(feature, labelField, labelFontSize, labelColor);
        if (labelStyle) styles.push(labelStyle);
        return styles;
      });
    } else {
      olLayer.setStyle(
        new Style({
          fill: new Fill({ color: config.noDataColor || "#d4d0c8" }),
          stroke: new Stroke({
            color: config.strokeColor || "#ffffff",
            width: config.strokeWidth || 0.8,
          }),
        })
      );
    }
    return;
  }

  const styleFunction =
    config.styleMode === "categorized"
      ? buildCategorizedStyleFn({
          valueMap: featureValues,
          layerConfig,
          categoryColors: config.categoryColors,
          strokeColor: config.strokeColor,
          strokeWidth: config.strokeWidth,
          noDataColor: config.noDataColor,
          showFeatureLabels: config.showFeatureLabels,
          labelColumn: config.labelColumn,
          labelFontSize,
          labelColor,
        })
      : buildGraduatedStyleFn({
          valueMap: featureValues,
          layerConfig,
          numClasses: config.numClasses,
          classMethod: config.classMethod,
          manualBreaks: config.manualBreaks,
          colorPreset: config.colorPreset,
          colorReversed: config.colorReversed,
          strokeColor: config.strokeColor,
          strokeWidth: config.strokeWidth,
          noDataColor: config.noDataColor,
          showFeatureLabels: config.showFeatureLabels,
          labelColumn: config.labelColumn,
          labelFontSize,
          labelColor,
        });

  olLayer.setStyle(styleFunction || DEFAULT_STYLE);
}
