import { describe, it, expect } from 'vitest'
import { dpiToPixelRatio, DPI_PRESETS } from './exportUtils'

describe('dpiToPixelRatio', () => {
  it('returns 0.75 for 72 DPI (screen)', () => {
    expect(dpiToPixelRatio(72)).toBeCloseTo(0.75)
  })

  it('returns 1.5 for 144 DPI (web default)', () => {
    expect(dpiToPixelRatio(144)).toBeCloseTo(1.5)
  })

  it('returns ~3.125 for 300 DPI (print)', () => {
    expect(dpiToPixelRatio(300)).toBeCloseTo(3.125)
  })

  it('returns 1 for 96 DPI (1:1 screen pixels)', () => {
    expect(dpiToPixelRatio(96)).toBe(1)
  })
})

describe('DPI_PRESETS', () => {
  it('has three entries', () => {
    expect(DPI_PRESETS).toHaveLength(3)
  })

  it('contains 72, 144, and 300 DPI values', () => {
    const values = DPI_PRESETS.map((p) => p.value)
    expect(values).toContain(72)
    expect(values).toContain(144)
    expect(values).toContain(300)
  })

  it('each preset has value, label, and hint', () => {
    DPI_PRESETS.forEach((p) => {
      expect(typeof p.value).toBe('number')
      expect(typeof p.label).toBe('string')
      expect(typeof p.hint).toBe('string')
    })
  })

  it('144 DPI is the default (middle) preset', () => {
    expect(DPI_PRESETS[1].value).toBe(144)
  })
})
