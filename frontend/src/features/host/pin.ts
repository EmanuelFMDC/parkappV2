import type { LatLng, Venue } from '../../api/types'
import { offsetPoint } from '../../lib/geo'

/** Where a new pin starts: close to the venue, so the host only has to nudge it. */
export const defaultPin = (venue: Venue): LatLng => offsetPoint(venue.location, 400, 45)
