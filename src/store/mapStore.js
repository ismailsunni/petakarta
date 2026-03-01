import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useMapStore = create(persist((set) => ({
  // Data state
  csvData: null,
  csvColumns: [],
  keyColumn: '',
  keyType: 'name',
  valueColumn: '',
  joinResult: null,
  provinceFeatures: [],

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
  showBasemap: true,
  showProvinceLabels: false,

  // Annotation state
  mapTitle: '',
  legendTitle: '',
  legendPosition: 'bottom-right',

  // Map instance refs (set by MapView, used by ExportTab)
  exportMapFn: null,

  // UI state
  activeTab: 'data',
  viewMode: 'edit', // 'edit' | 'view'

  // Actions
  setCsvData: (data, columns) => set({ csvData: data, csvColumns: columns }),
  setKeyColumn: (keyColumn) => set({ keyColumn }),
  setKeyType: (keyType) => set({ keyType }),
  setValueColumn: (valueColumn) => set({ valueColumn }),
  setJoinResult: (joinResult) => set({ joinResult }),
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
  setShowBasemap: (showBasemap) => set({ showBasemap }),
  setShowProvinceLabels: (showProvinceLabels) => set({ showProvinceLabels }),
  setMapTitle: (mapTitle) => set({ mapTitle }),
  setLegendTitle: (legendTitle) => set({ legendTitle }),
  setLegendPosition: (legendPosition) => set({ legendPosition }),
  setActiveTab: (activeTab) => set({ activeTab }),
  setProvinceFeatures: (provinceFeatures) => set({ provinceFeatures }),
  setExportMapFn: (exportMapFn) => set({ exportMapFn }),
  setViewMode: (viewMode) => set({ viewMode }),

  resetData: () => set({
    csvData: null,
    csvColumns: [],
    keyColumn: '',
    keyType: 'name',
    valueColumn: '',
    joinResult: null,
    provinceFeatures: [],
  }),
}), {
  name: 'petakarta-store',
  version: 1,
  partialize: (state) => ({
    csvData: state.csvData,
    csvColumns: state.csvColumns,
    keyColumn: state.keyColumn,
    keyType: state.keyType,
    valueColumn: state.valueColumn,
    joinResult: state.joinResult,
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
    showBasemap: state.showBasemap,
    showProvinceLabels: state.showProvinceLabels,
    mapTitle: state.mapTitle,
    legendTitle: state.legendTitle,
    legendPosition: state.legendPosition,
  }),
}))

export default useMapStore
