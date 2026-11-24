import { beforeEach, describe, expect, it } from 'vitest'
import { createDb, type MockDb } from './db'
import { ApiError } from './errors'
import { VENUE_HOURLY_CENTS, ZONE_SURCHARGE_CENTS } from '../../lib/tariffs'
import { percentOf } from '../../lib/tariffs'
import { seedDemoBookings } from './demo'
import { quoteWindow } from './pricing'

const T0 = Date.parse('2026-10-10T12:00:00.000Z')
const iso = (ms: number) => new Date(ms).toISOString()
const hours = (n: number) => n * 3_600_000

let clock = T0
let db: MockDb
const USER = 'mock-user-3312345678'
const OTHER = 'mock-user-3300000000'
let vehicleId: string

beforeEach(() => {
  clock = T0
  db = createDb({ now: () => clock })
  vehicleId = db.seedVerifiedAccount(USER).vehicles[0]!.id
  db.seedVerifiedAccount(OTHER, { plate: 'ZZZ999' })
})

const vehicleOf = (userId: string) => db.getMe(userId).vehicles[0]!.id

const book = (spaceId: string, fromH: number, toH: number, userId: string | null = USER) =>
  db.createBooking(userId, {
    spaceId,
    startsAt: iso(T0 + hours(fromH)),
    endsAt: iso(T0 + hours(toH)),
    vehicleId: userId === OTHER ? vehicleOf(OTHER) : vehicleId,
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
  const venueZone = { hourlyCents: 6000, zoneSurchargeCents: 5000 }

  it('prices rate × hours + $50 zone charge + 15 % commission + 16 % VAT on it', () => {
    const q = quoteWindow(venueZone, iso(T0), iso(T0 + hours(2)))
    expect(q).toEqual({
      minutes: 120,
      hourlyCents: 6000,
      rentCents: 12000,
      zoneSurchargeCents: 5000,
      subtotalCents: 17000,
      commissionCents: 2550,
      vatCents: 408,
      totalCents: 19958,
    })
  })

  it.each([
    [30, 'too_short'],
    [25 * 60, 'too_long'],
    [90, 'invalid_block'],
    [67, 'invalid_block'],
  ])('rejects a %i minute window (%s)', (minutes, code) => {
    expectApiError(() => quoteWindow(venueZone, iso(T0), iso(T0 + minutes * 60_000)), 422, code)
  })

  it('quotes a seeded space with its venue tariff', () => {
    const q = db.quote('akron-1', iso(T0 + hours(1)), iso(T0 + hours(3)))
    expect(q.hourlyCents).toBe(VENUE_HOURLY_CENTS.akron)
    expect(q.zoneSurchargeCents).toBe(ZONE_SURCHARGE_CENTS)
  })
})

describe('double booking', () => {
  it('rejects an overlapping booking on the same space with 409', () => {
    book('akron-1', 2, 6)
    expectApiError(() => book('akron-1', 5, 8, OTHER), 409, 'space_unavailable')
  })

  it('rejects a booking fully inside an existing one', () => {
    book('akron-1', 2, 8)
    expectApiError(() => book('akron-1', 3, 4, OTHER), 409, 'space_unavailable')
  })

  it('allows back-to-back bookings (end equals next start)', () => {
    book('akron-1', 2, 4)
    expect(() => book('akron-1', 4, 6, OTHER)).not.toThrow()
  })

  it('allows the same hours on a different space', () => {
    book('akron-1', 2, 6)
    expect(() => book('akron-2', 2, 6, OTHER)).not.toThrow()
  })

  it('frees the space again when a pre-booking expires unpaid', () => {
    book('akron-1', 2, 6)
    clock += 11 * 60_000
    expect(() => book('akron-1', 2, 6, OTHER)).not.toThrow()
  })

  it('frees the space when the booking is cancelled', () => {
    const b = book('akron-1', 6, 9)
    db.cancelBooking(USER, b.id)
    expect(() => book('akron-1', 6, 9, OTHER)).not.toThrow()
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

  it('keeps a snapshot of the vehicle on the booking', () => {
    const b = book('akron-1', 2, 4)
    expect(b.vehicle).toMatchObject({ plate: 'JAL482A', make: 'Nissan' })
  })

  it('does not confirm an expired hold', () => {
    const pending = book('akron-1', 2, 4)
    clock += 11 * 60_000
    expectApiError(() => db.confirmBooking(USER, pending.id, 'pi_1'), 409, 'booking_expired')
  })

  it("never shows one driver another driver's booking", () => {
    const mine = book('akron-1', 2, 4)
    expectApiError(() => db.getBooking(OTHER, mine.id), 404, 'not_found')
    expect(db.listBookings(OTHER)).toEqual([])
  })

  it('refuses to start in the past', () => {
    expectApiError(() => book('akron-1', -5, -3), 422, 'in_the_past')
  })

  it("cannot book with another driver's vehicle", () => {
    expectApiError(
      () =>
        db.createBooking(USER, {
          spaceId: 'akron-1',
          startsAt: iso(T0 + hours(2)),
          endsAt: iso(T0 + hours(4)),
          vehicleId: vehicleOf(OTHER),
        }),
      404,
      'not_found',
    )
  })
})

describe('who may book', () => {
  const input = (vId: string) => ({
    spaceId: 'akron-1',
    startsAt: iso(T0 + hours(2)),
    endsAt: iso(T0 + hours(4)),
    vehicleId: vId,
  })

  it('blocks a brand new account until it has a profile', () => {
    expectApiError(() => db.createBooking('mock-user-new', input('x')), 403, 'profile_incomplete')
  })

  it('blocks an account with a profile but no vehicle', () => {
    db.updateProfile('mock-user-new', {
      firstName: 'Ana',
      lastName: 'López',
      birthDate: '1995-03-02',
      email: 'ana@example.com',
      acceptPrivacy: true,
    })
    expectApiError(() => db.createBooking('mock-user-new', input('x')), 403, 'vehicle_required')
  })

  it('blocks an account whose identity is not verified', () => {
    db.updateProfile('mock-user-new', {
      firstName: 'Ana',
      lastName: 'López',
      birthDate: '1995-03-02',
      email: 'ana@example.com',
      acceptPrivacy: true,
    })
    const me = db.addVehicle('mock-user-new', {
      plate: 'ABC-123-D',
      make: 'Kia',
      model: 'Rio',
      color: 'Rojo',
      type: 'sedan',
    })
    expectApiError(
      () => db.createBooking('mock-user-new', input(me.vehicles[0]!.id)),
      403,
      'identity_required',
    )
  })

  it('rejects a vehicle type that does not fit the space', () => {
    const pickup = db.addVehicle(USER, {
      plate: 'PIC-111',
      make: 'Ford',
      model: 'Ranger',
      color: 'Azul',
      type: 'pickup',
    })
    const pickupId = pickup.vehicles.find((v) => v.plate === 'PIC111')!.id
    // akron-1 fits compact, sedan and suv only.
    expectApiError(() => db.createBooking(USER, input(pickupId)), 422, 'vehicle_not_supported')
  })
})

describe('persistence', () => {
  it('restores bookings and accounts from storage after a reload', () => {
    const store = new Map<string, string>()
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    }
    const first = createDb({ now: () => clock, storage })
    const vId = first.seedVerifiedAccount(USER).vehicles[0]!.id
    const b = first.createBooking(USER, {
      spaceId: 'akron-1',
      startsAt: iso(T0 + hours(2)),
      endsAt: iso(T0 + hours(4)),
      vehicleId: vId,
    })
    const second = createDb({ now: () => clock, storage })
    expect(second.getBooking(USER, b.id).id).toBe(b.id)
    expect(second.getMe(USER).identityStatus).toBe('verified')
    expect(second.getMe(USER).vehicles).toHaveLength(1)
  })
})

describe('demo data', () => {
  it('seeds taken spaces for every venue without breaking the booking rules', () => {
    expect(() => seedDemoBookings(db)).not.toThrow()
  })
})

describe('cancelling (free until 2 h before, then 20 %)', () => {
  const confirmed = (fromH: number, toH: number, spaceId = 'akron-1') =>
    db.confirmBooking(USER, book(spaceId, fromH, toH).id, 'pi_1')

  it('tells the driver until when it is free and what a late cancellation costs', () => {
    const b = confirmed(5, 7)
    expect(b.freeCancelUntil).toBe(iso(T0 + hours(3)))
    expect(b.lateCancelFeeCents).toBe(percentOf(b.totalCents, 2000))
    expect(b).toMatchObject({ cancelledBy: null, cancellationFeeCents: null, refundCents: null })
  })

  it('refunds everything when cancelled 2 hours or more before the start', () => {
    const b = confirmed(5, 7)
    clock = T0 + hours(3) // exactly 2 h before: still free
    expect(db.cancelBooking(USER, b.id)).toMatchObject({
      status: 'cancelled',
      cancelledBy: 'driver',
      cancellationFeeCents: 0,
      refundCents: b.totalCents,
    })
  })

  it('keeps 20 % of the total when cancelled later, and refunds the rest', () => {
    const b = confirmed(5, 7)
    clock = T0 + hours(3) + 60_000
    const fee = percentOf(b.totalCents, 2000)
    expect(db.cancelBooking(USER, b.id)).toMatchObject({
      status: 'cancelled',
      cancellationFeeCents: fee,
      refundCents: b.totalCents - fee,
    })
  })

  it('cannot be cancelled once it has started, or twice', () => {
    const b = confirmed(5, 7)
    clock = T0 + hours(5)
    expectApiError(() => db.cancelBooking(USER, b.id), 409, 'already_started')

    const other = confirmed(10, 12, 'akron-2')
    db.cancelBooking(USER, other.id)
    expectApiError(() => db.cancelBooking(USER, other.id), 409, 'not_cancellable')
  })

  it('drops an unpaid hold with nothing to charge or refund', () => {
    const held = book('akron-1', 1, 3)
    expect(db.cancelBooking(USER, held.id)).toMatchObject({
      status: 'cancelled',
      cancellationFeeCents: 0,
      refundCents: 0,
    })
  })

  it('frees the space for someone else', () => {
    const b = confirmed(5, 7)
    db.cancelBooking(USER, b.id)
    expect(() => book('akron-1', 5, 7, OTHER)).not.toThrow()
  })
})

describe('getting there', () => {
  it('gives the exact pin only once the booking is confirmed, like the address', () => {
    const held = book('akron-1', 2, 4)
    expect(held.space.location).toBeNull()
    const confirmed = db.confirmBooking(USER, held.id, 'pi_1')
    expect(confirmed.space.location).toEqual(db.getSpace('akron-1').location)
  })
})
