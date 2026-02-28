import { create } from 'zustand'

const useMapStore = create((set) => ({
  // Data state
  csvData: null,
  csvColumns: [],
  keyColumn: '',
  keyType: 'name',
  valueColumn: '',
  joinResult: null,
  provinceFeatures: [],

  // Style state
  colorPreset: 'Viridis',
  colorReversed: false,
  classMethod: 'quantile',
  numClasses: 5,
  manualBreaks: [],
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

  // Actions
  setCsvData: (data, columns) => set({ csvData: data, csvColumns: columns }),
  setKeyColumn: (keyColumn) => set({ keyColumn }),
  setKeyType: (keyType) => set({ keyType }),
  setValueColumn: (valueColumn) => set({ valueColumn }),
  setJoinResult: (joinResult) => set({ joinResult }),
  setColorPreset: (colorPreset) => set({ colorPreset }),
  setColorReversed: (colorReversed) => set({ colorReversed }),
  setClassMethod: (classMethod) => set({ classMethod }),
  setNumClasses: (numClasses) => set({ numClasses }),
  setManualBreaks: (manualBreaks) => set({ manualBreaks }),
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

  resetData: () => set({
    csvData: null,
    csvColumns: [],
    keyColumn: '',
    keyType: 'name',
    valueColumn: '',
    joinResult: null,
    provinceFeatures: [],
  }),
}))

export default useMapStore
