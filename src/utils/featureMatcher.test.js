import { describe, it, expect } from 'vitest'
import { matchFeatures } from './featureMatcher'

const adminFeatures = [
  { featureId: 'ID-JK', featureName: 'DKI Jakarta' },
  { featureId: 'ID-JB', featureName: 'Jawa Barat' },
  { featureId: 'ID-YO', featureName: 'DI Yogyakarta' },
]

const layerConfig = {
  featureIdField: 'ADM1_PCODE',
  featureNameField: 'province_name',
  aliases: {
    'jakarta': 'ID-JK',
    'yogyakarta': 'ID-YO',
    'diy': 'ID-YO',
  },
}

describe('matchFeatures – by name', () => {
  it('matches by exact name (case-insensitive)', () => {
    const result = matchFeatures(
      [{ area: 'DKI Jakarta', value: '100' }],
      'area', 'name', 'value', adminFeatures, layerConfig,
    )
    expect(result.matched).toBe(1)
    expect(result.valueMap['ID-JK']).toBe('100')
  })

  it('matches by name alias', () => {
    const result = matchFeatures(
      [{ area: 'Jakarta', value: '200' }],
      'area', 'name', 'value', adminFeatures, layerConfig,
    )
    expect(result.matched).toBe(1)
    expect(result.valueMap['ID-JK']).toBe('200')
  })

  it('matches by multi-word alias', () => {
    const result = matchFeatures(
      [{ area: 'DIY', value: '300' }],
      'area', 'name', 'value', adminFeatures, layerConfig,
    )
    expect(result.matched).toBe(1)
    expect(result.valueMap['ID-YO']).toBe('300')
  })

  it('reports unmatched name keys', () => {
    const result = matchFeatures(
      [{ area: 'Nonexistent Province', value: '400' }],
      'area', 'name', 'value', adminFeatures, layerConfig,
    )
    expect(result.matched).toBe(0)
    expect(result.unmatched).toBe(1)
    expect(result.unmatchedKeys).toContain('Nonexistent Province')
  })
})

describe('matchFeatures – by ID', () => {
  it('matches by exact ID (case-insensitive)', () => {
    const result = matchFeatures(
      [{ code: 'id-jb', value: '500' }],
      'code', 'id', 'value', adminFeatures, layerConfig,
    )
    expect(result.matched).toBe(1)
    expect(result.valueMap['ID-JB']).toBe('500')
  })

  it('reports unmatched ID keys', () => {
    const result = matchFeatures(
      [{ code: 'ID-XX', value: '600' }],
      'code', 'id', 'value', adminFeatures, layerConfig,
    )
    expect(result.matched).toBe(0)
    expect(result.unmatched).toBe(1)
  })
})

describe('matchFeatures – edge cases', () => {
  it('skips rows with empty key', () => {
    const result = matchFeatures(
      [{ area: '', value: '700' }],
      'area', 'name', 'value', adminFeatures, layerConfig,
    )
    expect(result.matched).toBe(0)
    expect(result.unmatched).toBe(0)
  })

  it('skips rows with empty value', () => {
    const result = matchFeatures(
      [{ area: 'DKI Jakarta', value: '' }],
      'area', 'name', 'value', adminFeatures, layerConfig,
    )
    expect(result.matched).toBe(0)
    expect(result.unmatched).toBe(0)
  })

  it('handles multiple rows in one call', () => {
    const csvData = [
      { area: 'DKI Jakarta', value: '100' },
      { area: 'Jawa Barat', value: '200' },
      { area: 'diy', value: '300' },
    ]
    const result = matchFeatures(csvData, 'area', 'name', 'value', adminFeatures, layerConfig)
    expect(result.matched).toBe(3)
    expect(result.valueMap['ID-JK']).toBe('100')
    expect(result.valueMap['ID-JB']).toBe('200')
    expect(result.valueMap['ID-YO']).toBe('300')
  })

  it('last row wins when key appears twice', () => {
    const csvData = [
      { area: 'DKI Jakarta', value: 'first' },
      { area: 'DKI Jakarta', value: 'second' },
    ]
    const result = matchFeatures(csvData, 'area', 'name', 'value', adminFeatures, layerConfig)
    expect(result.matched).toBe(1)
    expect(result.valueMap['ID-JK']).toBe('second')
  })
})
