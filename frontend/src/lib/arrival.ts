/**
 * Arriving and leaving (check-in / check-out). The server enforces these; the client uses the
 * photo limits as hints and reads the deadlines from the booking.
 */

/** Photos of the car and the spot, on arrival and on departure (damage disputes, docs/decisiones.md). */
export const CHECK_PHOTOS_MIN = 2
export const CHECK_PHOTOS_MAX = 4

/** The driver can check in this long before the booked start. */
export const CHECK_IN_EARLY_MS = 30 * 60_000

/** Leaving up to this long after the end is not charged. */
export const OVERTIME_GRACE_MS = 10 * 60_000

const HOUR_MS = 3_600_000

/** Extra hours to charge when leaving at `leftAt`: every started hour after the grace period. */
export function overtimeHours(endsAt: number, leftAt: number): number {
  if (leftAt <= endsAt + OVERTIME_GRACE_MS) return 0
  return Math.ceil((leftAt - endsAt) / HOUR_MS)
}
