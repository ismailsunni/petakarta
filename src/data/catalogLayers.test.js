import { describe, it, expect } from 'vitest'
import { CATALOG_LAYERS, CATALOG_CATEGORIES, getCatalogLayer } from './catalogLayers'

const REQUIRED_FIELDS = ['id', 'name', 'provider', 'category', 'type', 'url', 'attribution', 'cors']

describe('CATALOG_LAYERS entries', () => {
  it('all entries have required fields', () => {
    for (const layer of CATALOG_LAYERS) {
      for (const field of REQUIRED_FIELDS) {
        expect(layer, `${layer.id} missing field: ${field}`).toHaveProperty(field)
        expect(layer[field], `${layer.id}.${field} must not be undefined`).toBeDefined()
      }
    }
  })

  it('has no duplicate IDs', () => {
    const ids = CATALOG_LAYERS.map(l => l.id)
    const unique = new Set(ids)
    expect(unique.size).toBe(ids.length)
  })

  it('all cors fields are boolean', () => {
    for (const layer of CATALOG_LAYERS) {
      expect(typeof layer.cors).toBe('boolean')
    }
  })

  it('all type fields are xyz or wms', () => {
    for (const layer of CATALOG_LAYERS) {
      expect(['xyz', 'wms']).toContain(layer.type)
    }
  })

  it('all urls are non-empty strings', () => {
    for (const layer of CATALOG_LAYERS) {
      expect(typeof layer.url).toBe('string')
      expect(layer.url.length).toBeGreaterThan(0)
    }
  })
})

describe('getCatalogLayer', () => {
  it('returns the correct entry by id', () => {
    const layer = getCatalogLayer('esri-world-imagery')
    expect(layer).toBeDefined()
    expect(layer.name).toBe('Esri World Imagery')
    expect(layer.provider).toBe('Esri')
  })

  it('returns undefined for unknown id', () => {
    expect(getCatalogLayer('does-not-exist')).toBeUndefined()
  })

  it('returns correct entry for each id in CATALOG_LAYERS', () => {
    for (const expected of CATALOG_LAYERS) {
      const found = getCatalogLayer(expected.id)
      expect(found).toBe(expected)
    }
  })
})

describe('CATALOG_CATEGORIES', () => {
  it('contains all categories from CATALOG_LAYERS and SAMPLE_DATASETS', () => {
    const expected = [...new Set([...CATALOG_LAYERS.map(l => l.category)])]
    expect(CATALOG_CATEGORIES).toEqual(expect.arrayContaining(expected))
    expect(CATALOG_CATEGORIES).toContain('Sample Data')
  })

  it('has no duplicate categories', () => {
    const unique = new Set(CATALOG_CATEGORIES)
    expect(unique.size).toBe(CATALOG_CATEGORIES.length)
  })

  it('includes Imagery, Topography, and Basemap categories', () => {
    expect(CATALOG_CATEGORIES).toContain('Imagery')
    expect(CATALOG_CATEGORIES).toContain('Topography')
    expect(CATALOG_CATEGORIES).toContain('Basemap')
  })
})
