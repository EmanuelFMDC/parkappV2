import type { LatLng } from '../api/types'

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
