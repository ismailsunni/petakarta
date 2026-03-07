import { describe, it, expect } from 'vitest'
import { getBreaks, classifyValue } from './classificationUtils'

const TEN_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]

describe('getBreaks – quantile', () => {
  it('returns numClasses + 1 break points', () => {
    expect(getBreaks(TEN_VALUES, 'quantile', 5)).toHaveLength(6)
  })

  it('first break equals minimum value', () => {
    const breaks = getBreaks(TEN_VALUES, 'quantile', 5)
    expect(breaks[0]).toBe(1)
  })

  it('last break equals maximum value', () => {
    const breaks = getBreaks(TEN_VALUES, 'quantile', 5)
    expect(breaks[breaks.length - 1]).toBe(10)
  })

  it('breaks are in ascending order', () => {
    const breaks = getBreaks(TEN_VALUES, 'quantile', 5)
    for (let i = 1; i < breaks.length; i++) {
      expect(breaks[i]).toBeGreaterThanOrEqual(breaks[i - 1])
    }
  })
})

describe('getBreaks – equalInterval', () => {
  it('divides a simple range into equal parts', () => {
    const breaks = getBreaks([0, 10], 'equalInterval', 2)
    expect(breaks).toEqual([0, 5, 10])
  })

  it('handles 4 classes on [0, 100]', () => {
    // min = 0, max = 100, step = 25
    const breaks = getBreaks([0, 25, 50, 75, 100], 'equalInterval', 4)
    expect(breaks[0]).toBe(0)
    expect(breaks[breaks.length - 1]).toBe(100)
    expect(breaks).toHaveLength(5)
  })
})

describe('getBreaks – jenks', () => {
  it('returns numClasses + 1 break points', () => {
    expect(getBreaks(TEN_VALUES, 'jenks', 3)).toHaveLength(4)
  })

  it('first break ≤ minimum, last break ≥ maximum', () => {
    const breaks = getBreaks(TEN_VALUES, 'jenks', 3)
    expect(breaks[0]).toBeLessThanOrEqual(1)
    expect(breaks[breaks.length - 1]).toBeGreaterThanOrEqual(10)
  })

  it('falls back to equalInterval when values.length ≤ numClasses', () => {
    // 2 values, 3 classes → falls back gracefully
    const breaks = getBreaks([5, 10], 'jenks', 3)
    expect(breaks.length).toBeGreaterThan(0)
  })
})

describe('classifyValue', () => {
  const breaks = [0, 25, 50, 75, 100]

  it('classifies a value in the first class', () => {
    expect(classifyValue(10, breaks)).toBe(0)
  })

  it('classifies a value at a break boundary in the lower class', () => {
    expect(classifyValue(25, breaks)).toBe(0)
  })

  it('classifies a value just above a break in the next class', () => {
    expect(classifyValue(26, breaks)).toBe(1)
  })

  it('classifies a value in the middle class', () => {
    expect(classifyValue(60, breaks)).toBe(2)
  })

  it('classifies the maximum value in the last class', () => {
    expect(classifyValue(100, breaks)).toBe(3)
  })

  it('clamps values above the maximum to the last class', () => {
    // values above max fall into last class (breaks.length - 2)
    expect(classifyValue(999, breaks)).toBe(3)
  })
})
