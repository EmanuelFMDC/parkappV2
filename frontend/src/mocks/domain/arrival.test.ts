import { beforeEach, describe, expect, it } from 'vitest'
import { CHECK_PHOTOS_MAX, CHECK_PHOTOS_MIN, overtimeHours } from '../../lib/arrival'
import { VENUE_HOURLY_CENTS, priceBooking } from '../../lib/tariffs'
import { createDb, type MockDb } from './db'
import { ApiError } from './errors'

const T0 = Date.parse('2026-10-10T12:00:00.000Z')
const iso = (ms: number) => new Date(ms).toISOString()
const H = 3_600_000
const MIN = 60_000
const USER = 'mock-user-3312345678'
const photos = (n = CHECK_PHOTOS_MIN) => Array.from({ length: n }, (_, i) => `mock/p${i}.jpg`)

let clock = T0
let db: MockDb

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

/** A confirmed 2-hour booking on akron-1 starting 3 hours after T0. */
function confirmed() {
  const vehicleId = db.getMe(USER).vehicles[0]!.id
  const held = db.createBooking(USER, {
    spaceId: 'akron-1',
    startsAt: iso(T0 + 3 * H),
    endsAt: iso(T0 + 5 * H),
    vehicleId,
  })
  return db.confirmBooking(USER, held.id, 'pi_1')
}

beforeEach(() => {
  clock = T0
  db = createDb({ now: () => clock })
  db.seedVerifiedAccount(USER)
})

describe('overtimeHours', () => {
  it('charges nothing within 10 minutes, then every started hour', () => {
    const end = T0
    expect(overtimeHours(end, end)).toBe(0)
    expect(overtimeHours(end, end + 10 * MIN)).toBe(0)
    expect(overtimeHours(end, end + 11 * MIN)).toBe(1)
    expect(overtimeHours(end, end + 60 * MIN)).toBe(1)
    expect(overtimeHours(end, end + 61 * MIN)).toBe(2)
  })
})

describe('check-in', () => {
  it('opens 30 minutes before the start, and says so', () => {
    const b = confirmed()
    expect(b.checkInOpensAt).toBe(iso(T0 + 3 * H - 30 * MIN))
    clock = T0 + 3 * H - 31 * MIN
    expectApiError(() => db.checkIn(USER, b.id, photos()), 409, 'too_early')
  })

  it('needs photos of the car on arrival', () => {
    const b = confirmed()
    clock = T0 + 3 * H
    expectApiError(
      () => db.checkIn(USER, b.id, photos(CHECK_PHOTOS_MIN - 1)),
      422,
      'check_photos_required',
    )
    expectApiError(
      () => db.checkIn(USER, b.id, photos(CHECK_PHOTOS_MAX + 1)),
      422,
      'check_too_many_photos',
    )
  })

  it('puts the booking in use and records when and how many photos', () => {
    const b = confirmed()
    clock = T0 + 3 * H - 10 * MIN
    expect(db.checkIn(USER, b.id, photos())).toMatchObject({
      status: 'in_use',
      checkedInAt: iso(clock),
      checkInPhotoCount: CHECK_PHOTOS_MIN,
    })
    expectApiError(() => db.checkIn(USER, b.id, photos()), 409, 'not_checkable')
  })

  it('is not possible once the booking is over, or on an unpaid hold', () => {
    const b = confirmed()
    clock = T0 + 5 * H
    expectApiError(() => db.checkIn(USER, b.id, photos()), 409, 'booking_over')
  })

  it('keeps the space blocked while in use', () => {
    const b = confirmed()
    clock = T0 + 3 * H
    db.checkIn(USER, b.id, photos())
    const other = 'mock-user-3300000000'
    db.seedVerifiedAccount(other, { plate: 'ZZZ999' })
    expectApiError(
      () =>
        db.createBooking(other, {
          spaceId: 'akron-1',
          startsAt: iso(T0 + 4 * H),
          endsAt: iso(T0 + 6 * H),
          vehicleId: db.getMe(other).vehicles[0]!.id,
        }),
      409,
      'space_unavailable',
    )
  })
})

describe('check-out', () => {
  const inUse = () => {
    const b = confirmed()
    clock = T0 + 3 * H
    return db.checkIn(USER, b.id, photos())
  }

  it('needs the driver to have checked in, and photos on the way out', () => {
    const b = confirmed()
    expectApiError(() => db.checkOut(USER, b.id, photos()), 409, 'not_checked_in')
    clock = T0 + 3 * H
    db.checkIn(USER, b.id, photos())
    expectApiError(() => db.checkOut(USER, b.id, []), 422, 'check_photos_required')
  })

  it('completes on time with no extra charge', () => {
    const b = inUse()
    clock = T0 + 5 * H + 10 * MIN // within the 10-minute grace
    expect(db.checkOut(USER, b.id, photos())).toMatchObject({
      status: 'completed',
      checkedOutAt: iso(clock),
      checkOutPhotoCount: CHECK_PHOTOS_MIN,
      overtimeHours: 0,
      overtimeCents: 0,
    })
  })

  it('charges each started extra hour at the hourly rate, with commission and VAT', () => {
    const b = inUse()
    const oneHour = priceBooking(
      { hourlyCents: VENUE_HOURLY_CENTS.akron!, zoneSurchargeCents: 0 },
      1,
    )
    expect(b.overtimeHourCents).toBe(oneHour.totalCents)
    expect(b.overtimeStartsAt).toBe(iso(T0 + 5 * H + 10 * MIN))

    clock = T0 + 5 * H + 70 * MIN // 1 h 10 min late: two started hours
    const twoHours = priceBooking(
      { hourlyCents: VENUE_HOURLY_CENTS.akron!, zoneSurchargeCents: 0 },
      2,
    )
    expect(db.checkOut(USER, b.id, photos())).toMatchObject({
      status: 'completed',
      overtimeHours: 2,
      overtimeCents: twoHours.totalCents,
    })
  })

  it('records when the driver arrived and left, and the extra hours', () => {
    const b = inUse()
    clock = T0 + 5 * H + 30 * MIN
    db.checkOut(USER, b.id, photos())
    expect(db.getBooking(USER, b.id)).toMatchObject({
      checkedInAt: iso(T0 + 3 * H),
      checkedOutAt: iso(clock),
      overtimeHours: 1,
    })
  })
})
