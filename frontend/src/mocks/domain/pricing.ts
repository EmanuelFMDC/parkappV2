import type { Quote } from '../../api/types'
import { ApiError } from './errors'

export const MIN_MINUTES = 60
export const MAX_MINUTES = 24 * 60
/** Service fee in basis points of the subtotal (10%). Integer math only. */
export const SERVICE_FEE_BPS = 1000

/** Validates a window and prices it. Money is integer cents; never floats. */
export function quoteWindow(priceCentsPerHour: number, startsAt: string, endsAt: string): Quote {
  const start = Date.parse(startsAt)
  const end = Date.parse(endsAt)
  if (Number.isNaN(start) || Number.isNaN(end)) {
    throw new ApiError(422, 'invalid_window', 'startsAt and endsAt must be ISO dates')
  }
  const minutes = Math.round((end - start) / 60_000)
  if (minutes < MIN_MINUTES) {
    throw new ApiError(422, 'too_short', 'The minimum booking is 1 hour')
  }
  if (minutes > MAX_MINUTES) {
    throw new ApiError(422, 'too_long', 'The maximum booking is 24 hours')
  }
  const subtotalCents = Math.round((priceCentsPerHour * minutes) / 60)
  const serviceFeeCents = Math.round((subtotalCents * SERVICE_FEE_BPS) / 10_000)
  return { minutes, subtotalCents, serviceFeeCents, totalCents: subtotalCents + serviceFeeCents }
}
