import type { LatLng } from '../api/types'
import { offsetPoint } from './geo'

const M_PER_DEG_LAT = 110_540
const M_PER_DEG_LNG_AT_EQUATOR = 111_320
/** Share of the map half-width reached at the operating radius. */
const RADIUS_FILL = 0.42

/**
 * Projects a point onto the stylised map (percent coordinates) with the venue at the center (50, 50).
 * Distance uses a square-root scale: garages are mostly within a kilometer, and a linear scale
 * would pile them on top of the venue marker. Direction is preserved. Replaced by the real map later.
 */
export function toMapPercent(
  venue: LatLng,
  point: LatLng,
  radiusM: number,
): { x: number; y: number } {
  const dx =
    (point.lng - venue.lng) * M_PER_DEG_LNG_AT_EQUATOR * Math.cos((venue.lat * Math.PI) / 180)
  const dy = (point.lat - venue.lat) * M_PER_DEG_LAT
  const distance = Math.hypot(dx, dy)
  if (distance === 0) return { x: 50, y: 50 }
  const reach = RADIUS_FILL * 100 * Math.sqrt(Math.min(distance, radiusM * 1.2) / radiusM)
  const clamp = (v: number) => Math.min(94, Math.max(6, v))
  return { x: clamp(50 + (dx / distance) * reach), y: clamp(50 - (dy / distance) * reach) }
}

/**
 * The inverse of `toMapPercent`: a tap on the stylised map becomes coordinates. A tap farther out
 * than the operating radius is allowed; the caller decides whether that distance is acceptable.
 */
export function fromMapPercent(
  venue: LatLng,
  point: { x: number; y: number },
  radiusM: number,
): LatLng {
  const dx = point.x - 50
  const dy = 50 - point.y
  const reach = Math.hypot(dx, dy)
  if (reach === 0) return venue
  const fraction = Math.min(reach / (RADIUS_FILL * 100), Math.sqrt(1.2))
  const meters = fraction ** 2 * radiusM
  const bearing = (Math.atan2(dx, dy) * 180) / Math.PI // 0 = north, 90 = east
  return offsetPoint(venue, meters, (bearing + 360) % 360)
}
