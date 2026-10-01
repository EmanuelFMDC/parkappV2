import { describe, expect, it } from 'vitest'
import { offsetPoint } from '../mocks/domain/geo'
import { toMapPercent } from './mapProjection'

const venue = { lat: 20.6817, lng: -103.4626 }
const at = (meters: number, bearing: number) =>
  toMapPercent(venue, offsetPoint(venue, meters, bearing), 3000)

describe('toMapPercent', () => {
  it('puts the venue at the center', () => {
    expect(toMapPercent(venue, venue, 3000)).toEqual({ x: 50, y: 50 })
  })

  it('puts north above and east to the right of the venue', () => {
    expect(at(1000, 0).y).toBeLessThan(50)
    expect(Math.abs(at(1000, 0).x - 50)).toBeLessThan(1)
    expect(at(1000, 90).x).toBeGreaterThan(50)
    expect(Math.abs(at(1000, 90).y - 50)).toBeLessThan(1)
  })

  it('places farther garages farther from the center', () => {
    const distances = [300, 800, 1500, 2400].map((m) => at(m, 90).x - 50)
    expect(distances).toEqual([...distances].sort((a, b) => a - b))
  })

  it('keeps close garages clear of the venue marker', () => {
    // 320 m must land at least 10% of the map away, or its pin would cover the marker.
    expect(at(320, 90).x - 50).toBeGreaterThan(10)
  })

  it('stays inside the map even for far points', () => {
    expect(at(20_000, 90).x).toBeLessThanOrEqual(94)
    expect(at(20_000, 270).x).toBeGreaterThanOrEqual(6)
  })
})
