import { describe, it, expect } from 'vitest'
import { calcThumbnailHeight } from './thumbnailUtils'

describe('calcThumbnailHeight', () => {
  it('scales height proportionally for a 16:9 map', () => {
    // 1600x900 → 400x225
    expect(calcThumbnailHeight(1600, 900)).toBe(225)
  })

  it('scales height proportionally for a 4:3 map', () => {
    // 800x600 → 400x300
    expect(calcThumbnailHeight(800, 600)).toBe(300)
  })

  it('returns 0 for zero width', () => {
    expect(calcThumbnailHeight(0, 600)).toBe(0)
  })

  it('returns 0 for zero height', () => {
    expect(calcThumbnailHeight(800, 0)).toBe(0)
  })

  it('rounds fractional heights', () => {
    // 1000x333 → 400x133.2 → 133
    expect(calcThumbnailHeight(1000, 333)).toBe(133)
  })
})
