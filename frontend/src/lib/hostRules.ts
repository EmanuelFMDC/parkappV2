import type { Dimensions, Municipality, VehicleType } from '../api/types'

/** Limits for publishing a space. The form uses them as hints; the server enforces them. */
export const PRICE_MIN_CENTS = 2000
export const PRICE_MAX_CENTS = 50000
export const PHOTOS_MIN = 3
export const PHOTOS_MAX = 8
export const PHOTO_MAX_BYTES = 10 * 1024 * 1024
export const PHOTO_TYPES = ['image/jpeg', 'image/png', 'image/webp']
export const TITLE_MIN = 5
export const TITLE_MAX = 60
export const DESCRIPTION_MAX = 500
export const STREET_MIN = 5

export const DIMENSION_LIMITS = {
  lengthCm: { min: 200, max: 1000 },
  widthCm: { min: 150, max: 500 },
  heightCm: { min: 150, max: 600 },
} as const

export const MUNICIPALITIES: Municipality[] = [
  'Zapopan',
  'Guadalajara',
  'San Pedro Tlaquepaque',
  'Tonalá',
  'Tlajomulco de Zúñiga',
]

export const VEHICLE_TYPES: VehicleType[] = ['compact', 'sedan', 'suv', 'pickup']

/**
 * Which kinds of car a space of this size can reasonably hold. A starting point the host can edit,
 * not a promise: it assumes about 40 cm of room on each side and in front of the car.
 */
export function suggestVehicleTypes(d: Dimensions): VehicleType[] {
  const fits = (length: number, width: number, height: number) =>
    d.lengthCm >= length && d.widthCm >= width && d.heightCm >= height
  const out: VehicleType[] = []
  if (fits(400, 220, 150)) out.push('compact')
  if (fits(470, 240, 150)) out.push('sedan')
  if (fits(500, 250, 200)) out.push('suv')
  if (fits(560, 260, 210)) out.push('pickup')
  return out
}

export function dimensionsInRange(d: Dimensions): boolean {
  return (Object.keys(DIMENSION_LIMITS) as Array<keyof typeof DIMENSION_LIMITS>).every((key) => {
    const { min, max } = DIMENSION_LIMITS[key]
    return Number.isInteger(d[key]) && d[key] >= min && d[key] <= max
  })
}
