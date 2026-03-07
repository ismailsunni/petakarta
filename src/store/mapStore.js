import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_LAYER_ID } from '../utils/adminLayers'

const useMapStore = create(persist((set) => ({
  // Data state
  csvData: null,
  csvColumns: [],
  keyColumn: '',
  keyType: 'name',
  valueColumn: '',
  joinResult: null,
  adminLayerId: DEFAULT_LAYER_ID,
  adminFeatures: [], // [{ featureId, featureName }] — derived from GeoJSON, not persisted

  // Style state
  styleMode: 'graduated', // 'graduated' | 'categorized'
  colorPreset: 'Viridis',
  colorReversed: false,
  classMethod: 'quantile',
  numClasses: 5,
  manualBreaks: [],
  categoryColors: {}, // { value: hexColor } for categorized mode
  strokeColor: '#ffffff',
  strokeWidth: 0.8,
  noDataColor: '#e0e0e0',
  basemap: 'osm',
  showFeatureLabels: false,

  // Annotation state
  mapTitle: '',
  legendTitle: '',
  legendPosition: 'bottom-right',
  attribution: '',

  // Map instance refs (set by MapView, used by ExportTab)
  exportMapFn: null,

  // Project state (set when loading/saving projects)
  activeProjectId: null,
  activeProjectName: '',
  activeProjectPublic: false,

  // UI state
  activeTab: 'data',
  viewMode: 'edit', // 'edit' | 'view'

  // Actions
  setCsvData: (data, columns) => set({ csvData: data, csvColumns: columns }),
  setKeyColumn: (keyColumn) => set({ keyColumn }),
  setKeyType: (keyType) => set({ keyType }),
  setValueColumn: (valueColumn) => set({ valueColumn }),
  setJoinResult: (joinResult) => set({ joinResult }),
  setAdminLayerId: (adminLayerId) => set({ adminLayerId, adminFeatures: [], joinResult: null }),
  setAdminFeatures: (adminFeatures) => set({ adminFeatures }),
  setStyleMode: (styleMode) => set({ styleMode }),
  setColorPreset: (colorPreset) => set({ colorPreset }),
  setColorReversed: (colorReversed) => set({ colorReversed }),
  setClassMethod: (classMethod) => set({ classMethod }),
  setNumClasses: (numClasses) => set({ numClasses }),
  setManualBreaks: (manualBreaks) => set({ manualBreaks }),
  setCategoryColors: (categoryColors) => set({ categoryColors }),
  setStrokeColor: (strokeColor) => set({ strokeColor }),
  setStrokeWidth: (strokeWidth) => set({ strokeWidth }),
  setNoDataColor: (noDataColor) => set({ noDataColor }),
  setBasemap: (basemap) => set({ basemap }),
  setShowFeatureLabels: (showFeatureLabels) => set({ showFeatureLabels }),
  setMapTitle: (mapTitle) => set({ mapTitle }),
  setLegendTitle: (legendTitle) => set({ legendTitle }),
  setLegendPosition: (legendPosition) => set({ legendPosition }),
  setAttribution: (attribution) => set({ attribution }),
  setActiveProjectId: (activeProjectId) => set({ activeProjectId }),
  setActiveProjectName: (activeProjectName) => set({ activeProjectName }),
  setActiveProjectPublic: (activeProjectPublic) => set({ activeProjectPublic }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setExportMapFn: (exportMapFn) => set({ exportMapFn }),
  setViewMode: (viewMode) => set({ viewMode }),

  resetData: () => set({
    csvData: null,
    csvColumns: [],
    keyColumn: '',
    keyType: 'name',
    valueColumn: '',
    joinResult: null,
    adminLayerId: DEFAULT_LAYER_ID,
    adminFeatures: [],
    activeProjectId: null,
    activeProjectName: '',
    activeProjectPublic: false,
    mapTitle: '',
    legendTitle: '',
  }),
}), {
  name: 'petakarta-store',
  version: 3,
  migrate: (persisted, version) => {
    if (version < 2) {
      const { showBasemap, ...rest } = persisted
      persisted = { ...rest, basemap: showBasemap === false ? 'none' : 'osm' }
    }
    if (version < 3) {
      const { showProvinceLabels, provinceFeatures, ...rest } = persisted
      persisted = {
        ...rest,
        showFeatureLabels: showProvinceLabels ?? false,
        adminLayerId: DEFAULT_LAYER_ID,
      }
    }
    return persisted
  },
  partialize: (state) => ({
    csvData: state.csvData,
    csvColumns: state.csvColumns,
    keyColumn: state.keyColumn,
    keyType: state.keyType,
    valueColumn: state.valueColumn,
    joinResult: state.joinResult,
    adminLayerId: state.adminLayerId,
    styleMode: state.styleMode,
    colorPreset: state.colorPreset,
    colorReversed: state.colorReversed,
    classMethod: state.classMethod,
    numClasses: state.numClasses,
    manualBreaks: state.manualBreaks,
    categoryColors: state.categoryColors,
    strokeColor: state.strokeColor,
    strokeWidth: state.strokeWidth,
    noDataColor: state.noDataColor,
    basemap: state.basemap,
    showFeatureLabels: state.showFeatureLabels,
    mapTitle: state.mapTitle,
    legendTitle: state.legendTitle,
    legendPosition: state.legendPosition,
    attribution: state.attribution,
  }),
}))

export default useMapStore
