import type { Quote } from '../../api/types'
import { priceBooking, type Tariff } from '../../lib/tariffs'
import { ApiError } from './errors'

export const MIN_MINUTES = 60
export const MAX_MINUTES = 24 * 60
/** Bookings are sold in whole hours (60-minute blocks). */
export const BLOCK_MINUTES = 60

/** Checks a window and returns its length in minutes. */
export function validateWindow(startsAt: string, endsAt: string): number {
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
  if (minutes % BLOCK_MINUTES !== 0) {
    throw new ApiError(422, 'invalid_block', 'Bookings are made in whole hours')
  }
  return minutes
}

/** Validates a window and prices it with the space's tariff. Money is integer cents; never floats. */
export function quoteWindow(
  tariff: Pick<Tariff, 'hourlyCents' | 'zoneSurchargeCents'>,
  startsAt: string,
  endsAt: string,
): Quote {
  const minutes = validateWindow(startsAt, endsAt)
  return {
    minutes,
    hourlyCents: tariff.hourlyCents,
    ...priceBooking(tariff, minutes / BLOCK_MINUTES),
  }
}
