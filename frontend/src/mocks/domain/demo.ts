import type { MockDb } from './db'

/**
 * Makes some spaces unavailable for each venue's first event, the way a real marketplace looks
 * a few days before a show. Skipped if the window is already taken (bookings persist in localStorage).
 */
export function seedDemoBookings(db: MockDb) {
  for (const venue of db.listVenues()) {
    const first = db.listEvents(venue.id)[0]
    if (!first) continue
    const startsAt = new Date(Date.parse(first.startsAt) - 3 * 3_600_000).toISOString()
    const endsAt = new Date(Date.parse(first.endsAt) + 3_600_000).toISOString()
    for (const n of [1, 4]) {
      const id = `${venue.id}-${n}`
      const taken = db
        .searchSpaces(venue.id, startsAt, endsAt)
        .find((s) => s.id === id && !s.available)
      if (!taken) db.seedForeignBooking(id, startsAt, endsAt)
    }
  }
}
