import { create } from "zustand";
import { persist } from "zustand/middleware";
import { getDefaultStyle } from "../lib/datasetsService";
import { getLayer } from "../utils/adminLayers";

/**
 * Unified Layer Structure - see docs/layer-tree-plan.md
 */

const DEFAULT_ADMIN_STYLE = {
  styleMode: "graduated",
  colorPreset: "Viridis",
  colorReversed: false,
  classMethod: "quantile",
  numClasses: 5,
  manualBreaks: [],
  categoryColors: {},
  strokeColor: "#ffffff",
  strokeWidth: 0.8,
  noDataColor: "#e0e0e0",
  showFeatureLabels: false,
  labelColumn: "", // empty means use default featureNameField
  labelFontSize: 11,
  labelColor: "#1a1a2e",
};

/**
 * Validate that a parsed object is a GeoJSON FeatureCollection or Feature
 * @param {unknown} data
 * @returns {{ valid: boolean, error?: string }}
 */
export function validateRemoteGeoJson(data) {
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return { valid: false, error: "Invalid JSON: not an object" };
  }
  if (data.type !== "FeatureCollection" && data.type !== "Feature") {
    return {
      valid: false,
      error: `Invalid GeoJSON: expected type "FeatureCollection" or "Feature", got "${data.type}"`,
    };
  }
  return { valid: true };
}

const useLayerTreeStore = create(
  persist(
    (set, get) => ({
      // Layer tree
      layers: [],

      // Selected layer for styling
      selectedLayerId: null,

      // Map annotations (shared across project)
      mapTitle: "",
      mapDescription: "",
      legendTitle: "",
      legendLayerId: null, // null = none, layer id = show that layer's legend
      legendPosition: "bottom-right",
      attribution: "",
      basemap: "osm",
      showTitle: true,
      showLegend: true,
      showAttribution: true,
      exportExtent: "", // "" (current view) or layer id
      currentViewExtentVersion: 0, // increment to trigger current view update

      // Project state
      activeProjectId: null,
      activeProjectName: "",
      activeProjectVisibility: 'private',
      activeProjectSlug: null,

      // UI state
      activeTab: "layers",
      panelExpanded: true,
      viewMode: "edit",

      // Add Layer modal state
      addLayerModalOpen: false,

      /**
       * Add an admin layer to the tree
       */
      addAdminLayer: (adminLayerId) => {
        const { layers } = get();

        // Check if already exists
        if (
          layers.some(
            (l) =>
              l.type === "admin" && l.adminConfig?.adminLayerId === adminLayerId
          )
        ) {
          return { error: { message: "This layer is already added" } };
        }

        const layerConfig = getLayer(adminLayerId);
        const maxOrder =
          layers.length > 0 ? Math.max(...layers.map((l) => l.order)) : -1;

        const newLayer = {
          id: `admin-${adminLayerId}-${Date.now()}`,
          type: "admin",
          name: layerConfig.name,
          title: "", // User-editable title for tooltips/legend
          visible: true,
          opacity: 1,
          order: maxOrder + 1,
          adminConfig: {
            adminLayerId,
            featureValues: {},
            dataInputMode: "csv",
            manualValues: {},
            manualValueLabel: "value",
            ...DEFAULT_ADMIN_STYLE,
          },
        };

        set((state) => ({
          layers: [...state.layers, newLayer],
          selectedLayerId: newLayer.id,
          addLayerModalOpen: false,
        }));

        return { data: newLayer };
      },

      /**
       * Add a catalog layer (XYZ tile or WMS)
       */
      addCatalogLayer: (catalogEntry) => {
        const { layers } = get()
        if (layers.some(l => l.type === 'catalog' && l.catalogConfig?.catalogId === catalogEntry.id)) {
          return { error: { message: 'This catalog layer is already added' } }
        }
        const maxOrder = layers.length > 0 ? Math.max(...layers.map(l => l.order)) : -1
        const newLayer = {
          id: `catalog-${catalogEntry.id}-${Date.now()}`,
          type: 'catalog',
          name: catalogEntry.name,
          title: '',
          visible: true,
          opacity: catalogEntry.type === 'xyz' ? 1 : 0.7,
          order: maxOrder + 1,
          catalogConfig: {
            catalogId: catalogEntry.id,
            type: catalogEntry.type,
            url: catalogEntry.url,
            layers: catalogEntry.layers || '',
            format: catalogEntry.format || 'image/png',
            attribution: catalogEntry.attribution || '',
            bbox: catalogEntry.bbox || null,
          },
        }
        set(state => ({
          layers: [...state.layers, newLayer],
          selectedLayerId: newLayer.id,
          addLayerModalOpen: false,
        }))
        return { data: newLayer }
      },

      /**
       * Add a remote GeoJSON URL as a user layer (no Supabase storage)
       */
      addRemoteGeoJsonLayer: async (name, url) => {
        let geojson;
        try {
          const response = await fetch(url);
          if (!response.ok) {
            return { error: { message: `Failed to fetch URL: ${response.status} ${response.statusText}` } };
          }
          geojson = await response.json();
        } catch (err) {
          return { error: { message: `Failed to fetch GeoJSON: ${err.message}` } };
        }

        const validation = validateRemoteGeoJson(geojson);
        if (!validation.valid) {
          return { error: { message: validation.error } };
        }

        const { layers } = get();
        const maxOrder = layers.length > 0 ? Math.max(...layers.map((l) => l.order)) : -1;

        // Detect geometry type from first feature
        const firstFeature =
          geojson.type === "FeatureCollection"
            ? geojson.features?.[0]
            : geojson;
        const geometryType = firstFeature?.geometry?.type || "Polygon";

        const newLayer = {
          id: `user-remote-${Date.now()}`,
          type: "user",
          name: name || "Remote GeoJSON",
          title: "",
          visible: true,
          opacity: 1,
          order: maxOrder + 1,
          userConfig: {
            datasetId: null,
            storagePath: null,
            remoteUrl: url,
            geojson,
            geometryType,
            bbox: null,
            style: getDefaultStyle(geometryType),
          },
        };

        set((state) => ({
          layers: [...state.layers, newLayer],
          selectedLayerId: newLayer.id,
          addLayerModalOpen: false,
        }));

        return { data: newLayer };
      },

      /**
       * Add a local GeoJSON layer (no auth, stored in localStorage)
       */
      addLocalGeoJsonLayer: (name, geojson) => {
        const validation = validateRemoteGeoJson(geojson);
        if (!validation.valid) {
          return { error: { message: validation.error } };
        }

        const { layers } = get();
        const maxOrder = layers.length > 0 ? Math.max(...layers.map((l) => l.order)) : -1;

        const firstFeature =
          geojson.type === "FeatureCollection"
            ? geojson.features?.[0]
            : geojson;
        const geometryType = firstFeature?.geometry?.type || "Polygon";

        const newLayer = {
          id: `user-local-${Date.now()}`,
          type: "user",
          name: name || "Local GeoJSON",
          title: "",
          visible: true,
          opacity: 1,
          order: maxOrder + 1,
          userConfig: {
            datasetId: null,
            storagePath: null,
            remoteUrl: null,
            geojson,
            geometryType,
            bbox: null,
            style: getDefaultStyle(geometryType),
          },
        };

        set((state) => ({
          layers: [...state.layers, newLayer],
          selectedLayerId: newLayer.id,
          addLayerModalOpen: false,
        }));

        return { data: newLayer };
      },

      /**
       * Add a user layer from a dataset
       */
      addUserLayer: (dataset, geojson) => {
        const { layers } = get();

        // Check if already exists
        if (
          layers.some(
            (l) => l.type === "user" && l.userConfig?.datasetId === dataset.id
          )
        ) {
          return { error: { message: "This dataset is already added" } };
        }

        const maxOrder =
          layers.length > 0 ? Math.max(...layers.map((l) => l.order)) : -1;

        const newLayer = {
          id: `user-${dataset.id}-${Date.now()}`,
          type: "user",
          name: dataset.name,
          title: "", // User-editable title for tooltips/legend
          visible: true,
          opacity: 1,
          order: maxOrder + 1,
          userConfig: {
            datasetId: dataset.id,
            storagePath: dataset.storage_path,
            geojson,
            geometryType: dataset.geometry_type,
            bbox: dataset.bbox,
            style: getDefaultStyle(dataset.geometry_type),
          },
        };

        set((state) => ({
          layers: [...state.layers, newLayer],
          selectedLayerId: newLayer.id,
          addLayerModalOpen: false,
        }));

        return { data: newLayer };
      },

      /**
       * Remove a layer
       */
      removeLayer: (layerId) => {
        set((state) => ({
          layers: state.layers.filter((l) => l.id !== layerId),
          selectedLayerId:
            state.selectedLayerId === layerId ? null : state.selectedLayerId,
        }));
      },

      /**
       * Toggle layer visibility
       */
      toggleVisibility: (layerId) => {
        set((state) => ({
          layers: state.layers.map((l) =>
            l.id === layerId ? { ...l, visible: !l.visible } : l
          ),
        }));
      },

      /**
       * Set layer opacity
       */
      setOpacity: (layerId, opacity) => {
        set((state) => ({
          layers: state.layers.map((l) =>
            l.id === layerId ? { ...l, opacity } : l
          ),
        }));
      },

      /**
       * Set layer title
       */
      setLayerTitle: (layerId, title) => {
        set((state) => ({
          layers: state.layers.map((l) =>
            l.id === layerId ? { ...l, title } : l
          ),
        }));
      },

      /**
       * Reorder layers (move layer to new position)
       */
      reorderLayers: (fromIndex, toIndex) => {
        set((state) => {
          const sorted = [...state.layers].sort((a, b) => a.order - b.order);
          const [moved] = sorted.splice(fromIndex, 1);
          sorted.splice(toIndex, 0, moved);

          // Reassign order values
          const reordered = sorted.map((layer, index) => ({
            ...layer,
            order: index,
          }));

          return { layers: reordered };
        });
      },

      /**
       * Move layer up (increase z-index)
       */
      moveLayerUp: (layerId) => {
        const { layers } = get();
        const sorted = [...layers].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex((l) => l.id === layerId);
        if (index < sorted.length - 1) {
          get().reorderLayers(index, index + 1);
        }
      },

      /**
       * Move layer down (decrease z-index)
       */
      moveLayerDown: (layerId) => {
        const { layers } = get();
        const sorted = [...layers].sort((a, b) => a.order - b.order);
        const index = sorted.findIndex((l) => l.id === layerId);
        if (index > 0) {
          get().reorderLayers(index, index - 1);
        }
      },

      /**
       * Select a layer for styling
       */
      selectLayer: (layerId) => {
        set({ selectedLayerId: layerId });
      },

      /**
       * Update admin layer config
       */
      updateAdminConfig: (layerId, updates) => {
        set((state) => ({
          layers: state.layers.map((l) =>
            l.id === layerId && l.type === "admin"
              ? { ...l, adminConfig: { ...l.adminConfig, ...updates } }
              : l
          ),
        }));
      },

      /**
       * Update user layer style
       */
      updateUserStyle: (layerId, styleUpdates) => {
        set((state) => ({
          layers: state.layers.map((l) =>
            l.id === layerId && l.type === "user"
              ? {
                  ...l,
                  userConfig: {
                    ...l.userConfig,
                    style: { ...l.userConfig.style, ...styleUpdates },
                  },
                }
              : l
          ),
        }));
      },

      /**
       * Update user layer config (valueColumn, featureValues, styleMode, etc.)
       */
      updateUserConfig: (layerId, updates) => {
        set((state) => ({
          layers: state.layers.map((l) =>
            l.id === layerId && l.type === "user"
              ? {
                  ...l,
                  userConfig: { ...l.userConfig, ...updates },
                }
              : l
          ),
        }));
      },

      /**
       * Update user layer geojson (after re-fetch)
       */
      setUserLayerGeojson: (layerId, geojson) => {
        set((state) => ({
          layers: state.layers.map((l) =>
            l.id === layerId && l.type === "user"
              ? { ...l, userConfig: { ...l.userConfig, geojson } }
              : l
          ),
        }));
      },

      /**
       * Get selected layer
       */
      getSelectedLayer: () => {
        const { layers, selectedLayerId } = get();
        return layers.find((l) => l.id === selectedLayerId) || null;
      },

      /**
       * Get layers sorted by order (for rendering)
       */
      getSortedLayers: () => {
        const { layers } = get();
        return [...layers].sort((a, b) => a.order - b.order);
      },

      /**
       * Update general settings
       */
      update: (partial) => set(partial),

      /**
       * Open/close add layer modal
       */
      setAddLayerModalOpen: (open) => set({ addLayerModalOpen: open }),

      /**
       * Reset all state
       */
      reset: () => {
        set({
          layers: [],
          selectedLayerId: null,
          mapTitle: "",
          legendTitle: "",
          legendLayerId: null,
          legendPosition: "bottom-right",
          attribution: "",
          basemap: "osm",
          showTitle: true,
          showLegend: true,
          showAttribution: true,
          activeProjectId: null,
          activeProjectName: "",
          activeProjectVisibility: 'private',
          activeProjectSlug: null,
          addLayerModalOpen: false,
        });
      },

      /**
       * Load project state
       */
      loadProject: (projectState) => {
        set({
          ...projectState,
          // Ensure layers have geojson cleared (will be re-fetched)
          layers: (projectState.layers || []).map((l) =>
            l.type === "user"
              ? { ...l, userConfig: { ...l.userConfig, geojson: null } }
              : l
          ),
          activeProjectSlug: null, // slug is set separately from DB response
        });
      },

      /**
       * Get state for saving to project
       */
      getProjectState: () => {
        const state = get();
        return {
          layers: state.layers.map((l) =>
            l.type === "user"
              ? { ...l, userConfig: { ...l.userConfig, geojson: null } }
              : l
          ),
          selectedLayerId: state.selectedLayerId,
          mapTitle: state.mapTitle,
          mapDescription: state.mapDescription,
          legendTitle: state.legendTitle,
          legendLayerId: state.legendLayerId,
          legendPosition: state.legendPosition,
          attribution: state.attribution,
          basemap: state.basemap,
          showTitle: state.showTitle,
          showLegend: state.showLegend,
          showAttribution: state.showAttribution,
          exportExtent: state.exportExtent,
        };
      },
    }),
    {
      name: "petakarta-layer-tree",
      version: 1,
      partialize: (state) => ({
        layers: state.layers.map((l) => {
          if (l.type !== "user") return l;
          // Local-only layers (no storagePath, no remoteUrl): keep geojson in localStorage
          const isLocal = !l.userConfig?.storagePath && !l.userConfig?.remoteUrl;
          return {
            ...l,
            userConfig: { ...l.userConfig, geojson: isLocal ? l.userConfig?.geojson : null },
          };
        }),
        selectedLayerId: state.selectedLayerId,
        mapTitle: state.mapTitle,
        mapDescription: state.mapDescription,
        legendTitle: state.legendTitle,
        legendLayerId: state.legendLayerId,
        legendPosition: state.legendPosition,
        attribution: state.attribution,
        basemap: state.basemap,
        showTitle: state.showTitle,
        showLegend: state.showLegend,
        showAttribution: state.showAttribution,
        exportExtent: state.exportExtent,
      }),
    }
  )
);

export default useLayerTreeStore;
