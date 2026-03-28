import { describe, it, expect } from 'vitest'
import { validateRemoteGeoJson } from './layerTreeStore'

describe('validateRemoteGeoJson', () => {
  it('accepts a valid FeatureCollection', () => {
    const geojson = {
      type: 'FeatureCollection',
      features: [
        { type: 'Feature', geometry: { type: 'Point', coordinates: [0, 0] }, properties: {} },
      ],
    }
    const result = validateRemoteGeoJson(geojson)
    expect(result.valid).toBe(true)
    expect(result.error).toBeUndefined()
  })

  it('accepts a valid Feature', () => {
    const geojson = {
      type: 'Feature',
      geometry: { type: 'Polygon', coordinates: [[[0, 0], [1, 0], [1, 1], [0, 0]]] },
      properties: { name: 'Test' },
    }
    const result = validateRemoteGeoJson(geojson)
    expect(result.valid).toBe(true)
  })

  it('rejects null', () => {
    const result = validateRemoteGeoJson(null)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/Invalid JSON/)
  })

  it('rejects an array', () => {
    const result = validateRemoteGeoJson([])
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/Invalid JSON/)
  })

  it('rejects a plain string', () => {
    const result = validateRemoteGeoJson('{"type":"FeatureCollection"}')
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/Invalid JSON/)
  })

  it('rejects object with wrong type', () => {
    const result = validateRemoteGeoJson({ type: 'Point', coordinates: [0, 0] })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/Invalid GeoJSON/)
    expect(result.error).toMatch(/Point/)
  })

  it('rejects object with no type field', () => {
    const result = validateRemoteGeoJson({ features: [] })
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/Invalid GeoJSON/)
  })

  it('rejects a number', () => {
    const result = validateRemoteGeoJson(42)
    expect(result.valid).toBe(false)
    expect(result.error).toMatch(/Invalid JSON/)
  })
})
