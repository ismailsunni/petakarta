import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { DEFAULT_LAYER_ID } from '../utils/adminLayers'
import { migrateShowBasemap, migrateProvinceLabels } from '../utils/stateMigrations'

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
  dataInputMode: 'csv', // 'csv' | 'manual'
  manualValues: {}, // { [featureId]: string }
  manualValueLabel: 'value',

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

  // Project state (set when loading/saving projects)
  activeProjectId: null,
  activeProjectName: '',
  activeProjectPublic: false,

  // UI state
  activeTab: 'data',
  viewMode: 'edit', // 'edit' | 'view'

  // Actions
  update: (partial) => set(partial),
  setCsvData: (data, columns) => set({ csvData: data, csvColumns: columns }),
  setAdminLayerId: (adminLayerId) => set({ adminLayerId, adminFeatures: [], joinResult: null, manualValues: {} }),

  resetData: () => set({
    csvData: null,
    csvColumns: [],
    keyColumn: '',
    keyType: 'name',
    valueColumn: '',
    joinResult: null,
    adminLayerId: DEFAULT_LAYER_ID,
    adminFeatures: [],
    dataInputMode: 'csv',
    manualValues: {},
    manualValueLabel: 'value',
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
    if (version < 2) persisted = migrateShowBasemap(persisted)
    if (version < 3) persisted = migrateProvinceLabels({ ...persisted, adminLayerId: persisted.adminLayerId ?? DEFAULT_LAYER_ID })
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
    dataInputMode: state.dataInputMode,
    manualValues: state.manualValues,
    manualValueLabel: state.manualValueLabel,
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
