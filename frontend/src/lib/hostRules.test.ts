import { describe, expect, it } from 'vitest'
import { dimensionsInRange, suggestVehicleTypes } from './hostRules'

const dims = (lengthCm: number, widthCm: number, heightCm: number) => ({
  lengthCm,
  widthCm,
  heightCm,
})

describe('suggestVehicleTypes', () => {
  it.each([
    ['a tight spot only fits a compact', dims(420, 230, 200), ['compact']],
    ['a standard garage fits compact and sedan', dims(480, 250, 220), ['compact', 'sedan']],
    ['a roomy covered one also fits an SUV', dims(520, 300, 230), ['compact', 'sedan', 'suv']],
    ['a big one fits everything', dims(600, 320, 250), ['compact', 'sedan', 'suv', 'pickup']],
    ['too small fits nothing', dims(300, 200, 200), []],
  ])('%s', (_name, d, expected) => {
    expect(suggestVehicleTypes(d)).toEqual(expected)
  })

  it('does not suggest an SUV or pickup under a low roof', () => {
    expect(suggestVehicleTypes(dims(600, 320, 180))).toEqual(['compact', 'sedan'])
  })
})

describe('dimensionsInRange', () => {
  it('accepts realistic sizes', () => {
    expect(dimensionsInRange(dims(520, 300, 230))).toBe(true)
  })

  it.each([
    ['too short', dims(100, 300, 230)],
    ['too wide', dims(520, 900, 230)],
    ['too low', dims(520, 300, 50)],
    ['fractional', dims(520.5, 300, 230)],
  ])('rejects %s', (_name, d) => {
    expect(dimensionsInRange(d)).toBe(false)
  })
})
