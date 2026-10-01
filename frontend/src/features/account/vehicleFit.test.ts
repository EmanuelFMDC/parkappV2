import { describe, expect, it } from 'vitest'
import type { Vehicle } from '../../api/types'
import { describeVehicle, fits, formatPlate, pickVehicle } from './vehicleFit'

const car = (id: string, type: Vehicle['type']): Vehicle => ({
  id,
  plate: 'JAL482A',
  make: 'Nissan',
  model: 'Versa',
  color: 'Gris',
  type,
})

describe('vehicle fit', () => {
  it('checks the vehicle type against what the space accepts', () => {
    expect(fits(car('a', 'sedan'), ['compact', 'sedan'])).toBe(true)
    expect(fits(car('a', 'pickup'), ['compact', 'sedan'])).toBe(false)
  })

  it('prefers the requested vehicle when it fits', () => {
    const vehicles = [car('a', 'sedan'), car('b', 'compact')]
    expect(pickVehicle(vehicles, ['compact', 'sedan'], 'b')?.id).toBe('b')
  })

  it('falls back to the first vehicle that fits, and to nothing when none does', () => {
    const vehicles = [car('a', 'pickup'), car('b', 'sedan')]
    expect(pickVehicle(vehicles, ['compact', 'sedan'], 'a')?.id).toBe('b')
    expect(pickVehicle([car('a', 'pickup')], ['compact'])).toBeUndefined()
  })

  it('formats plates and descriptions', () => {
    expect(formatPlate('JAL482A')).toBe('JAL-482-A')
    expect(formatPlate('1234567')).toBe('1234567')
    expect(describeVehicle(car('a', 'sedan'))).toBe('Nissan Versa · Gris · JAL-482-A')
  })
})
