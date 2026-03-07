import { describe, it, expect } from 'vitest'
import {
  buildColorScale,
  getCategoryColor,
  getSwatchColors,
  QUALITATIVE_COLORS,
} from './colorUtils'

describe('buildColorScale', () => {
  it('returns a chroma scale for a known sequential preset', () => {
    const scale = buildColorScale('Blues', 5, false)
    expect(scale).not.toBeNull()
    expect(typeof scale(0.5).hex()).toBe('string')
  })

  it('returns a chroma scale for a known diverging preset', () => {
    const scale = buildColorScale('RdBu', 7, false)
    expect(scale).not.toBeNull()
  })

  it('returns null for an unknown preset', () => {
    expect(buildColorScale('NotAPreset', 5, false)).toBeNull()
  })

  it('produces different colors at the extremes', () => {
    const scale = buildColorScale('Viridis', 5, false)
    expect(scale(0).hex()).not.toBe(scale(1).hex())
  })

  it('reversed scale swaps the color endpoints', () => {
    const normal = buildColorScale('Blues', 5, false)
    const reversed = buildColorScale('Blues', 5, true)
    expect(normal(0).hex()).toBe(reversed(1).hex())
    expect(normal(1).hex()).toBe(reversed(0).hex())
  })
})

describe('getCategoryColor', () => {
  it('returns a hex color string', () => {
    expect(getCategoryColor(0)).toMatch(/^#[0-9a-fA-F]{6}$/)
  })

  it('wraps around the qualitative palette', () => {
    const len = QUALITATIVE_COLORS.length
    expect(getCategoryColor(0)).toBe(getCategoryColor(len))
    expect(getCategoryColor(1)).toBe(getCategoryColor(len + 1))
  })

  it('returns consistent colors for the same index', () => {
    expect(getCategoryColor(3)).toBe(getCategoryColor(3))
  })
})

describe('getSwatchColors', () => {
  it('returns the requested number of colors', () => {
    const colors = getSwatchColors('Viridis', 7)
    expect(colors).toHaveLength(7)
  })

  it('returns hex color strings', () => {
    const colors = getSwatchColors('Blues', 5)
    colors.forEach((c) => expect(c).toMatch(/^#[0-9a-fA-F]{6}$/))
  })

  it('returns an empty array for an unknown preset', () => {
    expect(getSwatchColors('NotAPreset', 5)).toHaveLength(0)
  })

  it('defaults to 7 colors', () => {
    expect(getSwatchColors('Greens')).toHaveLength(7)
  })
})
