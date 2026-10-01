import { beforeEach, describe, expect, it } from 'vitest'
import type { HostSpaceCreate } from '../../api/types'
import { createDb, type MockDb } from './db'
import { ApiError } from './errors'
import { offsetPoint } from './geo'
import { venues } from './seed'

const T0 = Date.parse('2026-10-10T12:00:00.000Z')
const hours = (n: number) => n * 3_600_000
const iso = (ms: number) => new Date(ms).toISOString()
const HOST = 'mock-user-3311111111'
const DRIVER = 'mock-user-3322222222'
const akron = venues.find((v) => v.id === 'akron')!

let clock = T0
let db: MockDb

const valid = (over: Partial<HostSpaceCreate> = {}): HostSpaceCreate => ({
  venueId: 'akron',
  street: 'Av. Patria 1234',
  neighborhood: 'Jardines Universidad',
  municipality: 'Zapopan',
  references: 'Portón negro junto a la farmacia',
  location: offsetPoint(akron.location, 600, 90),
  dimensions: { lengthCm: 520, widthCm: 300, heightCm: 230 },
  vehicleTypes: ['compact', 'sedan', 'suv'],
  features: ['covered', 'gate'],
  title: 'Cochera techada junto al estadio',
  description: 'Entrada amplia y portón eléctrico.',
  photoKeys: ['mock/a.jpg', 'mock/b.jpg', 'mock/c.jpg'],
  priceCentsPerHour: 6000,
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

/** A host who finished data and identity but has no car (they only publish). */
function verifiedHostWithoutCar(userId = HOST) {
  db.updateProfile(userId, {
    firstName: 'Marisol',
    lastName: 'Ríos',
    birthDate: '1988-04-12',
    email: 'marisol@example.com',
    acceptPrivacy: true,
  })
  db.startIdentity(userId)
  clock += 3500
}

const window = { startsAt: iso(T0 + hours(48)), endsAt: iso(T0 + hours(52)) }
const search = () => db.searchSpaces('akron', window.startsAt, window.endsAt)
const publishAndApprove = (over: Partial<HostSpaceCreate> = {}) => {
  const space = db.createHostSpace(HOST, valid(over))
  clock += 6000
  return space
}

beforeEach(() => {
  clock = T0
  db = createDb({ now: () => clock })
})

describe('who may publish', () => {
  it('needs personal data first', () => {
    expectApiError(() => db.createHostSpace(HOST, valid()), 403, 'profile_incomplete')
  })

  it('needs a verified identity', () => {
    db.updateProfile(HOST, {
      firstName: 'Marisol',
      lastName: 'Ríos',
      birthDate: '1988-04-12',
      email: 'marisol@example.com',
      acceptPrivacy: true,
    })
    expectApiError(() => db.createHostSpace(HOST, valid()), 403, 'identity_required')
  })

  it('does not need a car', () => {
    verifiedHostWithoutCar()
    expect(db.getMe(HOST).vehicles).toEqual([])
    expect(() => db.createHostSpace(HOST, valid())).not.toThrow()
  })

  it('needs a signed-in user', () => {
    expectApiError(() => db.createHostSpace(null, valid()), 401, 'unauthorized')
  })
})

describe('review before it goes live', () => {
  beforeEach(() => verifiedHostWithoutCar())

  it('starts in review and is invisible to drivers', () => {
    const space = db.createHostSpace(HOST, valid())
    expect(space.status).toBe('pending_review')
    expect(search().some((s) => s.id === space.id)).toBe(false)
    expectApiError(() => db.getSpace(space.id), 404, 'not_found')
  })

  it('goes live once back-office approves it', () => {
    const space = publishAndApprove()
    expect(db.listHostSpaces(HOST)[0]?.status).toBe('active')
    const found = search().find((s) => s.id === space.id)
    expect(found).toMatchObject({ title: valid().title, priceCentsPerHour: 6000, available: true })
    expect(found!.distanceM).toBeGreaterThan(550)
    expect(found!.distanceM).toBeLessThan(650)
  })

  it('shows why when back-office rejects it, and never lists it', () => {
    db.setReviewOutcome('rejected')
    const space = publishAndApprove()
    const mine = db.listHostSpaces(HOST)[0]!
    expect(mine.status).toBe('rejected')
    expect(mine.reviewNote).toMatch(/fotos/i)
    expect(search().some((s) => s.id === space.id)).toBe(false)
  })

  it('starts a new host space with no rating', () => {
    const space = publishAndApprove()
    expect(db.getSpace(space.id)).toMatchObject({ rating: 0, reviewCount: 0 })
    expect(db.getSpace(space.id).host.displayName).toBe('Marisol R.')
  })
})

describe('what a host may publish', () => {
  beforeEach(() => verifiedHostWithoutCar())

  it.each([
    ['a street that is too short', { street: 'Av' }, 'invalid_address'],
    [
      'a municipality outside the metro area',
      { municipality: 'Puerto Vallarta' as never },
      'invalid_municipality',
    ],
    [
      'impossible dimensions',
      { dimensions: { lengthCm: 50, widthCm: 300, heightCm: 230 } },
      'invalid_dimensions',
    ],
    ['no car type', { vehicleTypes: [] }, 'vehicle_types_required'],
    ['a short title', { title: 'Hola' }, 'invalid_title'],
    ['a long title', { title: 'x'.repeat(61) }, 'invalid_title'],
    ['a long description', { description: 'x'.repeat(501) }, 'invalid_description'],
    ['two photos', { photoKeys: ['a', 'b'] }, 'photos_required'],
    ['nine photos', { photoKeys: Array.from({ length: 9 }, (_, i) => `p${i}`) }, 'too_many_photos'],
    ['a price under the minimum', { priceCentsPerHour: 1999 }, 'invalid_price'],
    ['a price over the maximum', { priceCentsPerHour: 50001 }, 'invalid_price'],
    ['a fractional price', { priceCentsPerHour: 6000.5 }, 'invalid_price'],
    ['unaccepted host rules', { acceptHostTerms: false }, 'terms_required'],
  ] as const)('rejects %s', (_name, over, code) => {
    expectApiError(
      () => db.createHostSpace(HOST, valid(over as Partial<HostSpaceCreate>)),
      422,
      code,
    )
  })

  it('rejects a location farther than the venue radius', () => {
    expectApiError(
      () => db.createHostSpace(HOST, valid({ location: offsetPoint(akron.location, 3500, 90) })),
      422,
      'outside_radius',
    )
  })

  it('accepts the edges of the allowed ranges', () => {
    expect(() =>
      db.createHostSpace(HOST, valid({ priceCentsPerHour: 2000, photoKeys: ['a', 'b', 'c'] })),
    ).not.toThrow()
    expect(() =>
      db.createHostSpace(
        HOST,
        valid({
          street: 'Calle Otra 99',
          priceCentsPerHour: 50000,
          photoKeys: Array.from({ length: 8 }, (_, i) => `p${i}`),
        }),
      ),
    ).not.toThrow()
  })

  it('does not publish the same address twice, even with different capitals', () => {
    db.createHostSpace(HOST, valid())
    expectApiError(
      () => db.createHostSpace(HOST, valid({ street: 'AV. PATRIA 1234' })),
      409,
      'duplicate_space',
    )
  })

  it('returns 404 for an unknown venue', () => {
    expectApiError(() => db.createHostSpace(HOST, valid({ venueId: 'nowhere' })), 404, 'not_found')
  })
})

describe('managing a published space', () => {
  beforeEach(() => verifiedHostWithoutCar())

  it('pausing removes it from searches and resuming brings it back', () => {
    const space = publishAndApprove()
    expect(db.updateHostSpace(HOST, space.id, { status: 'paused' }).status).toBe('paused')
    expect(search().some((s) => s.id === space.id)).toBe(false)
    db.updateHostSpace(HOST, space.id, { status: 'active' })
    expect(search().some((s) => s.id === space.id)).toBe(true)
  })

  it('changes the price in integer cents', () => {
    const space = publishAndApprove()
    expect(db.updateHostSpace(HOST, space.id, { priceCentsPerHour: 7500 }).priceCentsPerHour).toBe(
      7500,
    )
    expect(db.quote(space.id, window.startsAt, window.endsAt).subtotalCents).toBe(30000)
    expectApiError(
      () => db.updateHostSpace(HOST, space.id, { priceCentsPerHour: 10 }),
      422,
      'invalid_price',
    )
  })

  it('cannot pause or resume a space that is still under review', () => {
    const space = db.createHostSpace(HOST, valid())
    expectApiError(
      () => db.updateHostSpace(HOST, space.id, { status: 'paused' }),
      409,
      'not_editable',
    )
  })

  it("never touches another host's space", () => {
    const space = publishAndApprove()
    expectApiError(
      () => db.updateHostSpace('mock-user-other', space.id, { status: 'paused' }),
      404,
      'not_found',
    )
    expect(db.listHostSpaces('mock-user-other')).toEqual([])
  })

  it('lists only my spaces, newest first', () => {
    db.createHostSpace(HOST, valid())
    clock += 1000
    db.createHostSpace(HOST, valid({ street: 'Calle Segunda 55', title: 'Otra cochera cercana' }))
    expect(db.listHostSpaces(HOST).map((s) => s.title)).toEqual([
      'Otra cochera cercana',
      valid().title,
    ])
  })
})

describe('drivers and hosts', () => {
  let spaceId: string
  beforeEach(() => {
    verifiedHostWithoutCar()
    spaceId = publishAndApprove().id
    db.seedVerifiedAccount(DRIVER)
  })

  const book = (userId: string, vehicleId: string) =>
    db.createBooking(userId, {
      spaceId,
      startsAt: window.startsAt,
      endsAt: window.endsAt,
      vehicleId,
    })

  it('a host cannot book their own space', () => {
    db.seedVerifiedAccount(HOST)
    const vehicleId = db.getMe(HOST).vehicles[0]!.id
    expectApiError(() => book(HOST, vehicleId), 422, 'own_space')
  })

  it('a driver can book it and gets the exact address only once it is confirmed', () => {
    const vehicleId = db.getMe(DRIVER).vehicles[0]!.id
    const held = book(DRIVER, vehicleId)
    expect(held.space.address).toBeNull()
    const confirmed = db.confirmBooking(DRIVER, held.id, 'pi_1')
    expect(confirmed.space.address).toBe('Av. Patria 1234, Zapopan')
  })

  it('shows the host the first name, badge and car, never phone, email or ID', () => {
    const vehicleId = db.getMe(DRIVER).vehicles[0]!.id
    db.confirmBooking(DRIVER, book(DRIVER, vehicleId).id, 'pi_1')

    const [received] = db.listHostBookings(HOST)
    expect(received).toMatchObject({
      status: 'confirmed',
      space: { id: spaceId },
      driver: { firstName: 'Prueba', identityVerified: true },
      subtotalCents: 24000,
    })
    expect(received!.driver.vehicle.plate).toBe('JAL482A')

    const everything = JSON.stringify(received)
    expect(everything).not.toContain('3322222222') // the phone
    expect(everything).not.toContain('prueba@example.com') // the email
  })

  it('does not show unpaid holds to the host, and shows cancellations', () => {
    const vehicleId = db.getMe(DRIVER).vehicles[0]!.id
    const held = book(DRIVER, vehicleId)
    expect(db.listHostBookings(HOST)).toEqual([])
    db.confirmBooking(DRIVER, held.id, 'pi_1')
    db.cancelBooking(DRIVER, held.id)
    expect(db.listHostBookings(HOST)[0]?.status).toBe('cancelled')
  })

  it("only shows a host their own spaces' bookings", () => {
    const vehicleId = db.getMe(DRIVER).vehicles[0]!.id
    db.confirmBooking(DRIVER, book(DRIVER, vehicleId).id, 'pi_1')
    expect(db.listHostBookings('mock-user-other')).toEqual([])
  })

  it('a paused space cannot be booked or opened, but an existing booking keeps working', () => {
    const vehicleId = db.getMe(DRIVER).vehicles[0]!.id
    const confirmed = db.confirmBooking(DRIVER, book(DRIVER, vehicleId).id, 'pi_1')
    db.updateHostSpace(HOST, spaceId, { status: 'paused' })

    expectApiError(() => db.getSpace(spaceId), 404, 'not_found')
    expect(db.getBooking(DRIVER, confirmed.id).space.address).toBe('Av. Patria 1234, Zapopan')
    const other = db.seedVerifiedAccount('mock-user-3333333333').vehicles[0]!.id
    expectApiError(() => book('mock-user-3333333333', other), 404, 'not_found')
  })
})

describe('persistence', () => {
  it('keeps published spaces after a reload', () => {
    const store = new Map<string, string>()
    const storage = {
      getItem: (k: string) => store.get(k) ?? null,
      setItem: (k: string, v: string) => void store.set(k, v),
    }
    const first = createDb({ now: () => clock, storage })
    first.updateProfile(HOST, {
      firstName: 'Marisol',
      lastName: 'Ríos',
      birthDate: '1988-04-12',
      email: 'marisol@example.com',
      acceptPrivacy: true,
    })
    first.startIdentity(HOST)
    clock += 3500
    first.createHostSpace(HOST, valid())

    const second = createDb({ now: () => clock, storage })
    expect(second.listHostSpaces(HOST)).toHaveLength(1)
    expect(second.listHostSpaces(HOST)[0]).toMatchObject({
      title: valid().title,
      status: 'pending_review',
    })
  })
})
