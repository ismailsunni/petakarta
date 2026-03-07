import { describe, it, expect } from 'vitest'
import {
  migrateShowBasemap,
  migrateAdminLayerId,
  migrateProvinceLabels,
  applyAllMigrations,
} from './stateMigrations'

describe('migrateShowBasemap', () => {
  it('converts showBasemap: false → basemap: none', () => {
    const result = migrateShowBasemap({ showBasemap: false })
    expect(result.basemap).toBe('none')
    expect('showBasemap' in result).toBe(false)
  })

  it('converts showBasemap: true → basemap: osm', () => {
    const result = migrateShowBasemap({ showBasemap: true })
    expect(result.basemap).toBe('osm')
    expect('showBasemap' in result).toBe(false)
  })

  it('preserves other fields during conversion', () => {
    const result = migrateShowBasemap({ showBasemap: false, other: 42 })
    expect(result.other).toBe(42)
  })

  it('returns same reference when basemap already present', () => {
    const state = { basemap: 'satellite' }
    expect(migrateShowBasemap(state)).toBe(state)
  })

  it('returns same reference when showBasemap is absent', () => {
    const state = { colorPreset: 'Blues' }
    expect(migrateShowBasemap(state)).toBe(state)
  })
})

describe('migrateAdminLayerId', () => {
  it('adds default adminLayerId when missing', () => {
    const result = migrateAdminLayerId({ foo: 'bar' })
    expect(result.adminLayerId).toBe('idn-province')
  })

  it('returns same reference when adminLayerId already present', () => {
    const state = { adminLayerId: 'idn-yogyakarta-city' }
    expect(migrateAdminLayerId(state)).toBe(state)
  })

  it('preserves existing adminLayerId value', () => {
    expect(migrateAdminLayerId({ adminLayerId: 'idn-yogyakarta-city' }).adminLayerId)
      .toBe('idn-yogyakarta-city')
  })
})

describe('migrateProvinceLabels', () => {
  it('renames showProvinceLabels: true → showFeatureLabels: true', () => {
    const result = migrateProvinceLabels({ showProvinceLabels: true })
    expect(result.showFeatureLabels).toBe(true)
    expect('showProvinceLabels' in result).toBe(false)
  })

  it('renames showProvinceLabels: false → showFeatureLabels: false', () => {
    const result = migrateProvinceLabels({ showProvinceLabels: false })
    expect(result.showFeatureLabels).toBe(false)
  })

  it('removes provinceFeatures field', () => {
    const result = migrateProvinceLabels({ provinceFeatures: [1, 2], other: 'x' })
    expect('provinceFeatures' in result).toBe(false)
    expect(result.other).toBe('x')
  })

  it('handles both provinceFeatures and showProvinceLabels together', () => {
    const result = migrateProvinceLabels({ provinceFeatures: [], showProvinceLabels: true })
    expect('provinceFeatures' in result).toBe(false)
    expect(result.showFeatureLabels).toBe(true)
  })

  it('does not add showFeatureLabels when showProvinceLabels is absent', () => {
    const result = migrateProvinceLabels({ other: 'x' })
    expect('showFeatureLabels' in result).toBe(false)
  })

  it('leaves state unchanged when already migrated', () => {
    const state = { showFeatureLabels: false }
    const result = migrateProvinceLabels(state)
    expect(result.showFeatureLabels).toBe(false)
  })
})

describe('applyAllMigrations', () => {
  it('applies all three migrations in sequence on a fully old state', () => {
    const old = {
      showBasemap: false,
      showProvinceLabels: true,
      provinceFeatures: [],
    }
    const result = applyAllMigrations(old)
    expect(result.basemap).toBe('none')
    expect(result.adminLayerId).toBe('idn-province')
    expect(result.showFeatureLabels).toBe(true)
    expect('showBasemap' in result).toBe(false)
    expect('provinceFeatures' in result).toBe(false)
  })

  it('is a no-op on already-current state', () => {
    const current = {
      basemap: 'osm',
      adminLayerId: 'idn-province',
      showFeatureLabels: false,
    }
    const result = applyAllMigrations(current)
    expect(result.basemap).toBe('osm')
    expect(result.adminLayerId).toBe('idn-province')
    expect(result.showFeatureLabels).toBe(false)
  })
})
