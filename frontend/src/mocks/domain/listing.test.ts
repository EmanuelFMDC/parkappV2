import { beforeEach, describe, expect, it } from 'vitest'
import type { HostSpaceCreate } from '../../api/types'
import { localToUtcIso } from '../../lib/time'
import { createDb, type MockDb } from './db'
import { ApiError } from './errors'
import { offsetPoint } from './geo'
import { venues } from './seed'

// Saturday 2026-10-10, 06:00 in Mexico City.
const T0 = Date.parse('2026-10-10T12:00:00.000Z')
const HOST = 'mock-user-3311111111'
const DRIVERS = ['mock-user-3322222222', 'mock-user-3333333333', 'mock-user-3344444444']
const akron = venues.find((v) => v.id === 'akron')!
const local = (date: string, time: string) => localToUtcIso(date, time)

let clock = T0
let db: MockDb

const valid = (over: Partial<HostSpaceCreate> = {}): HostSpaceCreate => ({
  venueId: 'akron',
  street: 'Av. Patria 1234',
  neighborhood: 'Jardines Universidad',
  municipality: 'Zapopan',
  location: offsetPoint(akron.location, 600, 90),
  dimensions: { lengthCm: 520, widthCm: 300, heightCm: 230 },
  features: ['covered', 'gate'],
  description: 'Entrada amplia. Portón negro junto a la farmacia.',
  photoKeys: ['mock/a.jpg', 'mock/b.jpg', 'mock/c.jpg'],
  quantity: 1,
  availability: null,
  acceptHostTerms: true,
  ...over,
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

function publish(over: Partial<HostSpaceCreate> = {}) {
  const space = db.createHostSpace(HOST, valid(over))
  db.approveAllSpacesNow()
  return space
}

const book = (driver: string, spaceId: string, startsAt: string, endsAt: string) =>
  db.createBooking(driver, {
    spaceId,
    startsAt,
    endsAt,
    vehicleId: db.getMe(driver).vehicles[0]!.id,
  })

beforeEach(() => {
  clock = T0
  db = createDb({ now: () => clock, reviewDelayMs: 0 })
  db.updateProfile(HOST, {
    firstName: 'Marisol',
    lastName: 'Ríos',
    birthDate: '1988-04-12',
    email: 'marisol@example.com',
    acceptPrivacy: true,
  })
  db.startIdentity(HOST)
  clock += 3500
  DRIVERS.forEach((d, i) => db.seedVerifiedAccount(d, { plate: `JAL00${i}A` }))
})

describe('fewer fields: ParkApp fills the title and the cars that fit', () => {
  it('writes the title from the features, the count and the neighborhood', () => {
    expect(publish().title).toBe('Cochera techada en Jardines Universidad')
    expect(publish({ street: 'Calle Dos 22', quantity: 3, features: ['covered'] }).title).toBe(
      '3 cajones techados en Jardines Universidad',
    )
    expect(publish({ street: 'Calle Tres 33', features: [] }).title).toBe(
      'Cochera en Jardines Universidad',
    )
  })

  it('works out which cars fit from the measurements', () => {
    expect(publish().vehicleTypes).toEqual(['compact', 'sedan', 'suv'])
  })

  it('refuses a space where no standard car fits', () => {
    expectApiError(
      () =>
        db.createHostSpace(
          HOST,
          valid({ dimensions: { lengthCm: 300, widthCm: 200, heightCm: 180 } }),
        ),
      422,
      'fits_no_car',
    )
  })
})

describe('several identical spots in one listing', () => {
  it('takes between 1 and 20 whole spots', () => {
    for (const quantity of [0, 21, 1.5]) {
      expectApiError(() => db.createHostSpace(HOST, valid({ quantity })), 422, 'invalid_quantity')
    }
    expect(publish({ quantity: 20 }).quantity).toBe(20)
  })

  it('accepts as many overlapping bookings as spots, and no more', () => {
    const space = publish({ quantity: 2 })
    const from = local('2026-10-12', '18:00')
    const to = local('2026-10-12', '22:00')
    book(DRIVERS[0]!, space.id, from, to)
    book(DRIVERS[1]!, space.id, from, to)
    expect(db.searchSpaces('akron', from, to).find((s) => s.id === space.id)?.available).toBe(false)
    expectApiError(() => book(DRIVERS[2]!, space.id, from, to), 409, 'space_unavailable')
  })

  it('counts back-to-back bookings as one spot, not two', () => {
    const space = publish({ quantity: 2 })
    book(DRIVERS[0]!, space.id, local('2026-10-12', '18:00'), local('2026-10-12', '20:00'))
    book(DRIVERS[1]!, space.id, local('2026-10-12', '20:00'), local('2026-10-12', '22:00'))
    // Only one spot is ever taken between 18:00 and 22:00, so a third driver still fits.
    expect(() =>
      book(DRIVERS[2]!, space.id, local('2026-10-12', '18:00'), local('2026-10-12', '22:00')),
    ).not.toThrow()
  })
})

describe('when the host rents it', () => {
  const saturdays = { days: [6], fromHour: 8, toHour: 20 }

  it('refuses a schedule that makes no sense', () => {
    expectApiError(
      () =>
        db.createHostSpace(HOST, valid({ availability: { days: [], fromHour: 8, toHour: 20 } })),
      422,
      'invalid_availability',
    )
  })

  it('only shows and books the space inside the schedule', () => {
    const space = publish({ availability: saturdays })
    expect(space.availability).toEqual(saturdays)
    const inside = [local('2026-10-17', '10:00'), local('2026-10-17', '12:00')] as const
    const outside = [local('2026-10-17', '19:00'), local('2026-10-17', '21:00')] as const

    expect(db.searchSpaces('akron', ...inside).some((s) => s.id === space.id)).toBe(true)
    expect(db.searchSpaces('akron', ...outside).some((s) => s.id === space.id)).toBe(false)
    expectApiError(() => book(DRIVERS[0]!, space.id, ...outside), 409, 'outside_availability')
    expect(() => book(DRIVERS[0]!, space.id, ...inside)).not.toThrow()
  })

  it('can be changed later, and back to always', () => {
    const space = publish()
    expect(db.updateHostSpace(HOST, space.id, { availability: saturdays }).availability).toEqual(
      saturdays,
    )
    expect(db.updateHostSpace(HOST, space.id, { availability: null }).availability).toBeNull()
    expectApiError(
      () =>
        db.updateHostSpace(HOST, space.id, {
          availability: { days: [6], fromHour: 9, toHour: 9 },
        }),
      422,
      'invalid_availability',
    )
  })
})
