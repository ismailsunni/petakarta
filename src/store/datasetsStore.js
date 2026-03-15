import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
  uploadDataset,
  fetchUserDatasets,
  downloadDataset,
  renameDataset as renameDatasetApi,
  deleteDataset as deleteDatasetApi,
  getDefaultStyle,
} from '../lib/datasetsService'

/**
 * User layer structure:
 * {
 *   id: string,           // UUID
 *   datasetId: string,    // Reference to dataset
 *   name: string,         // Display name
 *   visible: boolean,     // Layer visibility
 *   style: object,        // Layer style configuration
 *   geojson: object,      // Cached GeoJSON data
 *   geometryType: string, // Point, Line, Polygon, etc.
 * }
 */

const useDatasetsStore = create(persist((set, get) => ({
  // Datasets from Supabase
  datasets: [],
  datasetsLoading: false,
  datasetsError: null,

  // User layers on map (with GeoJSON and styles)
  userLayers: [],

  // Selected layer for styling
  selectedLayerId: null,

  // Upload state
  uploading: false,
  uploadError: null,
  uploadProgress: null,

  /**
   * Load user's datasets from Supabase
   */
  loadDatasets: async (userId) => {
    set({ datasetsLoading: true, datasetsError: null })
    const { data, error } = await fetchUserDatasets(userId)
    if (error) {
      set({ datasetsLoading: false, datasetsError: error.message })
      return
    }
    set({ datasets: data || [], datasetsLoading: false })
  },

  /**
   * Upload a new dataset
   */
  uploadDataset: async (file, userId, name) => {
    set({ uploading: true, uploadError: null })
    const { data, error } = await uploadDataset(file, userId, name)
    if (error) {
      set({ uploading: false, uploadError: error.message })
      return { error }
    }

    // Add to datasets list
    set((state) => ({
      datasets: [data, ...state.datasets],
      uploading: false,
    }))

    return { data }
  },

  /**
   * Add a dataset as a layer on the map
   */
  addLayerFromDataset: async (dataset) => {
    const { userLayers } = get()

    // Check if already added
    if (userLayers.some((l) => l.datasetId === dataset.id)) {
      return { error: { message: 'Dataset is already on the map' } }
    }

    // If geojson is already available (just uploaded), use it
    let geojson = dataset.geojson
    if (!geojson) {
      const { data, error } = await downloadDataset(dataset.storage_path)
      if (error) {
        return { error }
      }
      geojson = data
    }

    const layer = {
      id: crypto.randomUUID(),
      datasetId: dataset.id,
      name: dataset.name,
      visible: true,
      style: getDefaultStyle(dataset.geometry_type),
      geojson,
      geometryType: dataset.geometry_type,
      bbox: dataset.bbox,
    }

    set((state) => ({
      userLayers: [...state.userLayers, layer],
      selectedLayerId: layer.id,
    }))

    return { data: layer }
  },

  /**
   * Remove a layer from the map
   */
  removeLayer: (layerId) => {
    set((state) => ({
      userLayers: state.userLayers.filter((l) => l.id !== layerId),
      selectedLayerId: state.selectedLayerId === layerId ? null : state.selectedLayerId,
    }))
  },

  /**
   * Toggle layer visibility
   */
  toggleLayerVisibility: (layerId) => {
    set((state) => ({
      userLayers: state.userLayers.map((l) =>
        l.id === layerId ? { ...l, visible: !l.visible } : l
      ),
    }))
  },

  /**
   * Update layer style
   */
  updateLayerStyle: (layerId, styleUpdates) => {
    set((state) => ({
      userLayers: state.userLayers.map((l) =>
        l.id === layerId ? { ...l, style: { ...l.style, ...styleUpdates } } : l
      ),
    }))
  },

  /**
   * Rename a layer (local only)
   */
  renameLayer: (layerId, newName) => {
    set((state) => ({
      userLayers: state.userLayers.map((l) =>
        l.id === layerId ? { ...l, name: newName } : l
      ),
    }))
  },

  /**
   * Rename a dataset (updates in Supabase)
   */
  renameDataset: async (datasetId, newName) => {
    const { error } = await renameDatasetApi(datasetId, newName)
    if (error) {
      return { error }
    }

    set((state) => ({
      datasets: state.datasets.map((d) =>
        d.id === datasetId ? { ...d, name: newName } : d
      ),
      // Also update any layers using this dataset
      userLayers: state.userLayers.map((l) =>
        l.datasetId === datasetId ? { ...l, name: newName } : l
      ),
    }))

    return { error: null }
  },

  /**
   * Delete a dataset
   */
  deleteDataset: async (datasetId, storagePath) => {
    const { error } = await deleteDatasetApi(datasetId, storagePath)
    if (error) {
      return { error }
    }

    set((state) => ({
      datasets: state.datasets.filter((d) => d.id !== datasetId),
      // Also remove any layers using this dataset
      userLayers: state.userLayers.filter((l) => l.datasetId !== datasetId),
    }))

    return { error: null }
  },

  /**
   * Select a layer for styling
   */
  selectLayer: (layerId) => {
    set({ selectedLayerId: layerId })
  },

  /**
   * Reorder layers (for z-index control)
   */
  reorderLayers: (fromIndex, toIndex) => {
    set((state) => {
      const layers = [...state.userLayers]
      const [removed] = layers.splice(fromIndex, 1)
      layers.splice(toIndex, 0, removed)
      return { userLayers: layers }
    })
  },

  /**
   * Clear all user layers
   */
  clearLayers: () => {
    set({ userLayers: [], selectedLayerId: null })
  },

  /**
   * Get the selected layer
   */
  getSelectedLayer: () => {
    const { userLayers, selectedLayerId } = get()
    return userLayers.find((l) => l.id === selectedLayerId) || null
  },

  /**
   * Reset datasets state (on logout)
   */
  reset: () => {
    set({
      datasets: [],
      datasetsLoading: false,
      datasetsError: null,
      userLayers: [],
      selectedLayerId: null,
      uploading: false,
      uploadError: null,
    })
  },
}), {
  name: 'petakarta-datasets-store',
  version: 1,
  partialize: (state) => ({
    // Only persist layers (not datasets - those come from server)
    userLayers: state.userLayers.map(l => ({
      ...l,
      // Don't persist the full geojson, re-fetch on load
      geojson: null,
    })),
    selectedLayerId: state.selectedLayerId,
  }),
}))

export default useDatasetsStore
