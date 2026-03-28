import { describe, it, expect, vi } from 'vitest'

// Mock OpenLayers sources (not available in node environment)
vi.mock('ol/source/OSM', () => ({ default: class OSM { constructor() { this.type = 'OSM' } } }))
vi.mock('ol/source/XYZ', () => ({ default: class XYZ { constructor(opts) { Object.assign(this, { type: 'XYZ', ...opts }) } } }))

import { BASEMAP_OPTIONS, createBasemapSource } from './basemapSources'

describe('BASEMAP_OPTIONS', () => {
  it('contains all expected keys', () => {
    const keys = BASEMAP_OPTIONS.map((o) => o.key)
    expect(keys).toContain('osm')
    expect(keys).toContain('cartodb-positron')
    expect(keys).toContain('cartodb-dark')
    expect(keys).toContain('cartodb-voyager')
    expect(keys).toContain('esri-imagery')
    expect(keys).toContain('esri-topo')
    expect(keys).toContain('opentopomap')
    expect(keys).toContain('none')
  })

  it('every entry has label and key properties', () => {
    for (const option of BASEMAP_OPTIONS) {
      expect(option).toHaveProperty('key')
      expect(option).toHaveProperty('label')
      expect(typeof option.key).toBe('string')
      expect(typeof option.label).toBe('string')
    }
  })
})

describe('createBasemapSource', () => {
  it('returns a source for osm', () => {
    expect(createBasemapSource('osm')).not.toBeNull()
  })

  it('returns a source for cartodb-positron', () => {
    expect(createBasemapSource('cartodb-positron')).not.toBeNull()
  })

  it('returns a source for cartodb-dark', () => {
    expect(createBasemapSource('cartodb-dark')).not.toBeNull()
  })

  it('returns a source for cartodb-voyager', () => {
    expect(createBasemapSource('cartodb-voyager')).not.toBeNull()
  })

  it('returns a source for esri-imagery', () => {
    expect(createBasemapSource('esri-imagery')).not.toBeNull()
  })

  it('returns a source for esri-topo', () => {
    expect(createBasemapSource('esri-topo')).not.toBeNull()
  })

  it('returns a source for opentopomap', () => {
    expect(createBasemapSource('opentopomap')).not.toBeNull()
  })

  it('returns null for none', () => {
    expect(createBasemapSource('none')).toBeNull()
  })

  it('returns null for unknown key', () => {
    expect(createBasemapSource('unknown')).toBeNull()
  })

  it('returns a source for every non-none BASEMAP_OPTIONS entry', () => {
    for (const option of BASEMAP_OPTIONS) {
      if (option.key === 'none') continue
      expect(createBasemapSource(option.key)).not.toBeNull()
    }
  })
})
