/** The geographic helpers live in lib/ because the host form needs them too. */
import type { LatLng } from '../../api/types'
import { offsetPoint } from '../../lib/geo'

export { distanceM, offsetPoint } from '../../lib/geo'

/**
 * Where drivers see a space before booking: 100 to 200 m from the real spot, in a direction and
 * distance fixed by the space id, so the same space always shows the same pin (repeated requests
 * cannot be averaged back to the real address). The exact pin comes with a confirmed booking.
 */
export function approximateLocation(spaceId: string, exact: LatLng): LatLng {
  let h = 2166136261
  for (const ch of spaceId) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0
  return offsetPoint(exact, 100 + (h % 101), (h >>> 8) % 360)
}

/** Distance to the venue shown to drivers, rounded to 50 m so it does not pinpoint the spot. */
export const roundedDistanceM = (meters: number) => Math.round(meters / 50) * 50
