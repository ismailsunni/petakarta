import { describe, it, expect, beforeEach, vi } from 'vitest'

// Mock persist to avoid localStorage dependency in node environment
vi.mock('zustand/middleware', () => ({
  persist: (fn) => fn,
}))

vi.mock('../lib/datasetsService', () => ({
  getDefaultStyle: vi.fn(() => ({ color: '#3498db' })),
}))

vi.mock('../utils/adminLayers', () => ({
  getLayer: vi.fn((id) => ({ name: `Layer ${id}`, bbox: [0, 0, 1, 1] })),
}))

const { default: useLayerTreeStore } = await import('./layerTreeStore')

const SAMPLE_ENTRY = {
  id: 'esri-world-imagery',
  name: 'Esri World Imagery',
  type: 'xyz',
  url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
  format: 'image/jpeg',
  attribution: 'Esri, Maxar',
  bbox: [-180, -90, 180, 90],
}

beforeEach(() => {
  useLayerTreeStore.setState({
    layers: [],
    selectedLayerId: null,
    addLayerModalOpen: false,
  })
})

describe('addCatalogLayer', () => {
  it('creates a catalog layer with correct structure', () => {
    const result = useLayerTreeStore.getState().addCatalogLayer(SAMPLE_ENTRY)
    expect(result.error).toBeUndefined()
    const layer = result.data
    expect(layer.type).toBe('catalog')
    expect(layer.name).toBe('Esri World Imagery')
    expect(layer.visible).toBe(true)
    expect(layer.opacity).toBe(1)
    expect(layer.order).toBe(0)
    expect(layer.catalogConfig.catalogId).toBe('esri-world-imagery')
    expect(layer.catalogConfig.type).toBe('xyz')
    expect(layer.catalogConfig.url).toContain('World_Imagery')
    expect(layer.catalogConfig.attribution).toBe('Esri, Maxar')
    expect(layer.catalogConfig.bbox).toEqual([-180, -90, 180, 90])
  })

  it('sets opacity to 0.7 for non-xyz types', () => {
    const wmsEntry = { ...SAMPLE_ENTRY, id: 'wms-test', type: 'wms' }
    const result = useLayerTreeStore.getState().addCatalogLayer(wmsEntry)
    expect(result.data.opacity).toBe(0.7)
  })

  it('sets selectedLayerId and closes addLayerModal on success', () => {
    useLayerTreeStore.setState({ addLayerModalOpen: true })
    const result = useLayerTreeStore.getState().addCatalogLayer(SAMPLE_ENTRY)
    const state = useLayerTreeStore.getState()
    expect(state.selectedLayerId).toBe(result.data.id)
    expect(state.addLayerModalOpen).toBe(false)
  })

  it('rejects duplicate catalogId', () => {
    useLayerTreeStore.getState().addCatalogLayer(SAMPLE_ENTRY)
    const result = useLayerTreeStore.getState().addCatalogLayer(SAMPLE_ENTRY)
    expect(result.error).toBeDefined()
    expect(result.error.message).toContain('already added')
    expect(useLayerTreeStore.getState().layers).toHaveLength(1)
  })

  it('increments order for each new layer', () => {
    const r1 = useLayerTreeStore.getState().addCatalogLayer(SAMPLE_ENTRY)
    const r2 = useLayerTreeStore.getState().addCatalogLayer({ ...SAMPLE_ENTRY, id: 'other' })
    expect(r1.data.order).toBe(0)
    expect(r2.data.order).toBe(1)
  })

  it('uses empty string defaults for missing optional fields', () => {
    const minimal = { id: 'min', name: 'Min', type: 'xyz', url: 'https://example.com/{z}/{x}/{y}.png' }
    const result = useLayerTreeStore.getState().addCatalogLayer(minimal)
    expect(result.data.catalogConfig.layers).toBe('')
    expect(result.data.catalogConfig.format).toBe('image/png')
    expect(result.data.catalogConfig.attribution).toBe('')
    expect(result.data.catalogConfig.bbox).toBeNull()
  })
})

describe('removeLayer for catalog layers', () => {
  it('removes a catalog layer by id', () => {
    const { data } = useLayerTreeStore.getState().addCatalogLayer(SAMPLE_ENTRY)
    useLayerTreeStore.getState().removeLayer(data.id)
    expect(useLayerTreeStore.getState().layers).toHaveLength(0)
  })

  it('clears selectedLayerId when removed layer was selected', () => {
    const { data } = useLayerTreeStore.getState().addCatalogLayer(SAMPLE_ENTRY)
    useLayerTreeStore.getState().removeLayer(data.id)
    expect(useLayerTreeStore.getState().selectedLayerId).toBeNull()
  })
})

describe('toggleVisibility for catalog layers', () => {
  it('toggles visible from true to false', () => {
    const { data } = useLayerTreeStore.getState().addCatalogLayer(SAMPLE_ENTRY)
    expect(data.visible).toBe(true)
    useLayerTreeStore.getState().toggleVisibility(data.id)
    const updated = useLayerTreeStore.getState().layers.find(l => l.id === data.id)
    expect(updated.visible).toBe(false)
  })

  it('toggles visible from false to true', () => {
    const { data } = useLayerTreeStore.getState().addCatalogLayer(SAMPLE_ENTRY)
    useLayerTreeStore.getState().toggleVisibility(data.id)
    useLayerTreeStore.getState().toggleVisibility(data.id)
    const updated = useLayerTreeStore.getState().layers.find(l => l.id === data.id)
    expect(updated.visible).toBe(true)
  })
})

describe('getProjectState includes catalog layers', () => {
  it('includes catalog layers in saved state', () => {
    useLayerTreeStore.getState().addCatalogLayer(SAMPLE_ENTRY)
    const state = useLayerTreeStore.getState().getProjectState()
    expect(state.layers.some(l => l.type === 'catalog')).toBe(true)
  })

  it('preserves catalogConfig in saved state', () => {
    useLayerTreeStore.getState().addCatalogLayer(SAMPLE_ENTRY)
    const state = useLayerTreeStore.getState().getProjectState()
    const catalogLayer = state.layers.find(l => l.type === 'catalog')
    expect(catalogLayer.catalogConfig.catalogId).toBe('esri-world-imagery')
  })
})
