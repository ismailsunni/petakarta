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
};

const useLayerTreeStore = create(
  persist(
    (set, get) => ({
      // Layer tree
      layers: [],

      // Selected layer for styling
      selectedLayerId: null,

      // Map annotations (shared across project)
      mapTitle: "",
      legendTitle: "",
      legendPosition: "bottom-right",
      attribution: "",
      basemap: "osm",
      exportExtent: "", // "" (current view) or layer id
      currentViewExtentVersion: 0, // increment to trigger current view update

      // Project state
      activeProjectId: null,
      activeProjectName: "",
      activeProjectPublic: false,

      // UI state
      activeTab: "layers",
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
          legendPosition: "bottom-right",
          attribution: "",
          basemap: "osm",
          activeProjectId: null,
          activeProjectName: "",
          activeProjectPublic: false,
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
          legendTitle: state.legendTitle,
          legendPosition: state.legendPosition,
          attribution: state.attribution,
          basemap: state.basemap,
          exportExtent: state.exportExtent,
        };
      },
    }),
    {
      name: "petakarta-layer-tree",
      version: 1,
      partialize: (state) => ({
        layers: state.layers.map((l) =>
          l.type === "user"
            ? { ...l, userConfig: { ...l.userConfig, geojson: null } }
            : l
        ),
        selectedLayerId: state.selectedLayerId,
        mapTitle: state.mapTitle,
        legendTitle: state.legendTitle,
        legendPosition: state.legendPosition,
        attribution: state.attribution,
        basemap: state.basemap,
        exportExtent: state.exportExtent,
      }),
    }
  )
);

export default useLayerTreeStore;
