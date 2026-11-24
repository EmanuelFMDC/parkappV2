import { beforeEach, describe, expect, it } from 'vitest'
import { createDb, type MockDb } from './db'
import { ApiError } from './errors'
import { offsetPoint } from './geo'
import { venues } from './seed'

const T0 = Date.parse('2026-10-10T12:00:00.000Z')
const iso = (ms: number) => new Date(ms).toISOString()
const H = 3_600_000
const DAY = 24 * H
const DRIVER = 'mock-user-3312345678'
const HOST = 'mock-user-3311111111'
const akron = venues.find((v) => v.id === 'akron')!
const report = { category: 'damage' as const, description: 'Encontré un rayón en la defensa.' }

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

/** A host's space and a confirmed 2-hour booking on it, starting 3 hours after T0. */
function confirmedOnHostSpace() {
  db.updateProfile(HOST, {
    firstName: 'Marisol',
    lastName: 'Ríos',
    birthDate: '1988-04-12',
    email: 'marisol@example.com',
    acceptPrivacy: true,
  })
  db.startIdentity(HOST)
  const space = db.createHostSpace(HOST, {
    venueId: 'akron',
    street: 'Av. Patria 1234',
    neighborhood: 'Jardines Universidad',
    municipality: 'Zapopan',
    location: offsetPoint(akron.location, 500, 90),
    dimensions: { lengthCm: 520, widthCm: 300, heightCm: 230 },
    features: [],
    description: '',
    photoKeys: ['a', 'b', 'c'],
    quantity: 1,
    availability: null,
    acceptHostTerms: true,
  })
  db.approveAllSpacesNow()
  const held = db.createBooking(DRIVER, {
    spaceId: space.id,
    startsAt: iso(T0 + 3 * H),
    endsAt: iso(T0 + 5 * H),
    vehicleId: db.getMe(DRIVER).vehicles[0]!.id,
  })
  return db.confirmBooking(DRIVER, held.id, 'pi_1')
}

beforeEach(() => {
  clock = T0
  db = createDb({ now: () => clock, identityDelayMs: 0, reviewDelayMs: 0 })
  db.seedVerifiedAccount(DRIVER)
})

describe('the driver reports an incident', () => {
  it('on a confirmed booking, and sees it on the booking as open', () => {
    const b = confirmedOnHostSpace()
    const after = db.reportIncident(DRIVER, b.id, report)
    expect(after.incidents).toEqual([
      expect.objectContaining({ reportedBy: 'driver', ...report, status: 'open' }),
    ])
  })

  it('up to 7 days after the end, not later', () => {
    const b = confirmedOnHostSpace()
    clock = T0 + 5 * H + 7 * DAY
    expect(() => db.reportIncident(DRIVER, b.id, report)).not.toThrow()
    clock += 1
    expectApiError(() => db.reportIncident(DRIVER, b.id, report), 409, 'not_reportable')
  })

  it('needs a category and a description of 10 to 1000 characters', () => {
    const b = confirmedOnHostSpace()
    expectApiError(
      () => db.reportIncident(DRIVER, b.id, { category: 'damage', description: 'Rayón' }),
      422,
      'invalid_incident',
    )
    expectApiError(
      () =>
        db.reportIncident(DRIVER, b.id, {
          category: 'nope' as never,
          description: report.description,
        }),
      422,
      'invalid_incident',
    )
    expectApiError(
      () => db.reportIncident(DRIVER, b.id, { category: 'other', description: 'x'.repeat(1001) }),
      422,
      'invalid_incident',
    )
  })

  it('not on a cancelled booking or an unpaid hold', () => {
    const b = confirmedOnHostSpace()
    db.cancelBooking(DRIVER, b.id)
    expectApiError(() => db.reportIncident(DRIVER, b.id, report), 409, 'not_reportable')
  })
})

describe('the host reports an incident', () => {
  it('on a booking on their space; each side sees only its own reports', () => {
    const b = confirmedOnHostSpace()
    db.reportIncident(DRIVER, b.id, report)
    const hostView = db.reportHostIncident(HOST, b.id, {
      category: 'access',
      description: 'El auto se quedó una hora más y bloqueó el portón.',
    })
    expect(hostView.incidents).toEqual([
      expect.objectContaining({ reportedBy: 'host', category: 'access', status: 'open' }),
    ])
    expect(db.getBooking(DRIVER, b.id).incidents).toHaveLength(1)
    expect(db.getBooking(DRIVER, b.id).incidents[0]?.reportedBy).toBe('driver')
  })

  it("not on someone else's space", () => {
    const b = confirmedOnHostSpace()
    expectApiError(() => db.reportHostIncident('mock-user-other', b.id, report), 404, 'not_found')
  })
})
