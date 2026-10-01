import { beforeEach, describe, expect, it } from 'vitest'
import { ApiError } from './errors'
import { createDb, type MockDb } from './db'
import { quoteWindow } from './pricing'

const T0 = Date.parse('2026-10-10T12:00:00.000Z')
const iso = (ms: number) => new Date(ms).toISOString()
const hours = (n: number) => n * 3_600_000

let clock = T0
let db: MockDb
const USER = 'mock-user-3312345678'

beforeEach(() => {
  clock = T0
  db = createDb({ now: () => clock })
})

const book = (spaceId: string, fromH: number, toH: number, userId: string | null = USER) =>
  db.createBooking(userId, {
    spaceId,
    startsAt: iso(T0 + hours(fromH)),
    endsAt: iso(T0 + hours(toH)),
    plate: 'JAL482A',
  })

function expectApiError(fn: () => unknown, status: number, code: string) {
  try {
    fn()
  } catch (error) {
    expect(error).toBeInstanceOf(ApiError)
    expect((error as ApiError).status).toBe(status)
    expect((error as ApiError).code).toBe(code)
    return
  }
  throw new Error(`expected ApiError ${status} ${code}`)
}

describe('pricing', () => {
  it('uses integer cents and a 10% service fee', () => {
    const q = quoteWindow(7500, iso(T0), iso(T0 + hours(2)))
    expect(q).toEqual({
      minutes: 120,
      subtotalCents: 15000,
      serviceFeeCents: 1500,
      totalCents: 16500,
    })
  })

  it('never produces fractional cents', () => {
    const q = quoteWindow(4533, iso(T0), iso(T0 + hours(1) + 7 * 60_000))
    for (const v of [q.subtotalCents, q.serviceFeeCents, q.totalCents]) {
      expect(Number.isInteger(v)).toBe(true)
    }
  })

  it.each([
    [30, 'too_short'],
    [25 * 60, 'too_long'],
  ])('rejects a %i minute window (%s)', (minutes, code) => {
    expectApiError(() => quoteWindow(5000, iso(T0), iso(T0 + minutes * 60_000)), 422, code)
  })
})

describe('double booking', () => {
  it('rejects an overlapping booking on the same space with 409', () => {
    book('akron-1', 2, 6)
    expectApiError(() => book('akron-1', 5, 8, 'mock-user-other'), 409, 'space_unavailable')
  })

  it('rejects a booking fully inside an existing one', () => {
    book('akron-1', 2, 8)
    expectApiError(() => book('akron-1', 3, 4, 'mock-user-other'), 409, 'space_unavailable')
  })

  it('allows back-to-back bookings (end equals next start)', () => {
    book('akron-1', 2, 4)
    expect(() => book('akron-1', 4, 6, 'mock-user-other')).not.toThrow()
  })

  it('allows the same hours on a different space', () => {
    book('akron-1', 2, 6)
    expect(() => book('akron-2', 2, 6, 'mock-user-other')).not.toThrow()
  })

  it('frees the space again when a pre-booking expires unpaid', () => {
    book('akron-1', 2, 6)
    clock += 11 * 60_000
    expect(() => book('akron-1', 2, 6, 'mock-user-other')).not.toThrow()
  })

  it('frees the space when the booking is cancelled', () => {
    const b = book('akron-1', 6, 9)
    db.cancelBooking(USER, b.id)
    expect(() => book('akron-1', 6, 9, 'mock-user-other')).not.toThrow()
  })
})

describe('search', () => {
  it('lists spaces within the venue radius, nearest first, with availability', () => {
    book('akron-1', 2, 6)
    const items = db.searchSpaces('akron', iso(T0 + hours(3)), iso(T0 + hours(5)))
    const distances = items.map((s) => s.distanceM)
    expect(distances).toEqual([...distances].sort((a, b) => a - b))
    expect(Math.max(...distances)).toBeLessThanOrEqual(3000)
    expect(items.find((s) => s.id === 'akron-1')?.available).toBe(false)
    expect(items.filter((s) => s.available).length).toBe(items.length - 1)
  })

  it('returns 404 for an unknown venue', () => {
    expectApiError(() => db.searchSpaces('nope', iso(T0), iso(T0 + hours(2))), 404, 'not_found')
  })

  it('only lists upcoming events', () => {
    const events = db.listEvents('akron')
    expect(events.length).toBeGreaterThan(0)
    expect(events.every((e) => Date.parse(e.endsAt) > T0)).toBe(true)
  })
})

describe('booking lifecycle', () => {
  it('requires a signed-in user', () => {
    expectApiError(() => book('akron-1', 2, 4, null), 401, 'unauthorized')
    expectApiError(() => db.listBookings(null), 401, 'unauthorized')
  })

  it('hides the address and code until the booking is confirmed', () => {
    const pending = book('akron-1', 2, 4)
    expect(pending.status).toBe('pending_payment')
    expect(pending.space.address).toBeNull()
    expect(pending.accessCode).toBeNull()
    expect(pending.expiresAt).not.toBeNull()

    const confirmed = db.confirmBooking(USER, pending.id, 'pi_1')
    expect(confirmed.status).toBe('confirmed')
    expect(confirmed.space.address).toContain('Calle de ejemplo')
    expect(confirmed.accessCode).toMatch(/^[A-Z0-9]{6}$/)
    expect(confirmed.expiresAt).toBeNull()
  })

  it('does not confirm an expired hold', () => {
    const pending = book('akron-1', 2, 4)
    clock += 11 * 60_000
    expectApiError(() => db.confirmBooking(USER, pending.id, 'pi_1'), 409, 'booking_expired')
  })

  it("never shows one driver another driver's booking", () => {
    const mine = book('akron-1', 2, 4)
    expectApiError(() => db.getBooking('mock-user-other', mine.id), 404, 'not_found')
    expect(db.listBookings('mock-user-other')).toEqual([])
  })

  it('cancels for free until 10 minutes before the start, not after', () => {
    const early = book('akron-1', 2, 4)
    expect(db.cancelBooking(USER, early.id).status).toBe('cancelled')

    const soon = db.createBooking(USER, {
      spaceId: 'akron-2',
      startsAt: iso(T0 + 5 * 60_000),
      endsAt: iso(T0 + hours(2)),
      plate: 'JAL482A',
    })
    expectApiError(() => db.cancelBooking(USER, soon.id), 409, 'too_late')
  })

  it('validates plate and start time', () => {
    expectApiError(
      () =>
        db.createBooking(USER, {
          spaceId: 'akron-1',
          startsAt: iso(T0 + hours(2)),
          endsAt: iso(T0 + hours(4)),
          plate: 'AB',
        }),
      422,
      'invalid_plate',
    )
    expectApiError(() => book('akron-1', -5, -3), 422, 'in_the_past')
  })
})

describe('persistence', () => {
  it('restores bookings from storage after a reload', () => {
    const store = new Map<string, string>()
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    }
    const first = createDb({ now: () => clock, storage })
    const b = first.createBooking(USER, {
      spaceId: 'akron-1',
      startsAt: iso(T0 + hours(2)),
      endsAt: iso(T0 + hours(4)),
      plate: 'JAL482A',
    })
    const second = createDb({ now: () => clock, storage })
    expect(second.getBooking(USER, b.id).id).toBe(b.id)
  })
})
