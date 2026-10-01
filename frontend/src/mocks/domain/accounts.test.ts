import { beforeEach, describe, expect, it } from 'vitest'
import type { ProfileInput, VehicleInput } from '../../api/types'
import { ageOn, createAccounts, normalizePlate, type Accounts } from './accounts'
import { ApiError } from './errors'

// 2026-10-10 at noon UTC is the same calendar day in Mexico City.
const T0 = Date.parse('2026-10-10T18:00:00.000Z')
let clock = T0
let accounts: Accounts
const USER = 'mock-user-3312345678'

const profile = (over: Partial<ProfileInput> = {}): ProfileInput => ({
  firstName: 'Ana',
  lastName: 'López García',
  birthDate: '1995-03-02',
  email: 'Ana@Example.com',
  acceptPrivacy: true,
  ...over,
})
const car = (over: Partial<VehicleInput> = {}): VehicleInput => ({
  plate: 'jal-482-a',
  make: 'Nissan',
  model: 'Versa',
  color: 'Gris',
  type: 'sedan',
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

beforeEach(() => {
  clock = T0
  accounts = createAccounts({ now: () => clock, storage: null, identityDelayMs: 3000 })
})

describe('ageOn', () => {
  it.each([
    ['2008-10-10', '2026-10-10', 18],
    ['2008-10-11', '2026-10-10', 17],
    ['2000-02-29', '2026-02-28', 25],
    ['1990-01-01', '2026-10-10', 36],
  ])('%s on %s is %i', (birth, today, age) => {
    expect(ageOn(birth, today)).toBe(age)
  })
})

describe('profile', () => {
  it('saves legal name, birth date and email, and records privacy consent', () => {
    const me = accounts.updateProfile(USER, profile())
    expect(me).toMatchObject({
      firstName: 'Ana',
      lastName: 'López García',
      birthDate: '1995-03-02',
      email: 'ana@example.com',
    })
    expect(me.privacyAcceptedAt).toBe(new Date(T0).toISOString())
  })

  it('keeps the original consent time when the profile is edited later', () => {
    accounts.updateProfile(USER, profile())
    clock += 86_400_000
    const me = accounts.updateProfile(USER, profile({ firstName: 'Anabel' }))
    expect(me.privacyAcceptedAt).toBe(new Date(T0).toISOString())
  })

  it.each([
    ['a number in the name', { firstName: 'An4' }, 'invalid_name'],
    ['an empty last name', { lastName: ' ' }, 'invalid_name'],
    ['a birth date in the future', { birthDate: '2030-01-01' }, 'invalid_birth_date'],
    ['an impossible date', { birthDate: '1995-02-31' }, 'invalid_birth_date'],
    ['under 18', { birthDate: '2010-01-01' }, 'underage'],
    ['a bad email', { email: 'ana@' }, 'invalid_email'],
    ['no consent', { acceptPrivacy: false }, 'consent_required'],
  ] as const)('rejects %s', (_name, over, code) => {
    expectApiError(() => accounts.updateProfile(USER, profile(over)), 422, code)
  })

  it('accepts accents, apostrophes and compound names', () => {
    expect(() =>
      accounts.updateProfile(USER, profile({ firstName: 'María José', lastName: "D'Ávila" })),
    ).not.toThrow()
  })
})

describe('vehicles', () => {
  it('normalizes the plate so the same car cannot be added twice', () => {
    expect(normalizePlate('jal-482 a')).toBe('JAL482A')
    const me = accounts.addVehicle(USER, car())
    expect(me.vehicles[0]).toMatchObject({ plate: 'JAL482A', make: 'Nissan', type: 'sedan' })
    expectApiError(
      () => accounts.addVehicle(USER, car({ plate: 'JAL 482-A' })),
      409,
      'duplicate_vehicle',
    )
  })

  it.each([
    ['too short a plate', { plate: 'AB' }, 'invalid_plate'],
    ['symbols in the plate', { plate: 'AB#12!' }, 'invalid_plate'],
    ['no make', { make: '' }, 'invalid_vehicle'],
  ] as const)('rejects %s', (_name, over, code) => {
    expectApiError(() => accounts.addVehicle(USER, car(over)), 422, code)
  })

  it('limits the number of vehicles', () => {
    for (let i = 0; i < 5; i++) accounts.addVehicle(USER, car({ plate: `AAA10${i}` }))
    expectApiError(
      () => accounts.addVehicle(USER, car({ plate: 'AAA999' })),
      422,
      'too_many_vehicles',
    )
  })

  it('removes only the requested vehicle', () => {
    const two = accounts.addVehicle(USER, car({ plate: 'AAA111' }))
    const withSecond = accounts.addVehicle(USER, car({ plate: 'BBB222' }))
    const after = accounts.removeVehicle(USER, two.vehicles[0]!.id)
    expect(after.vehicles.map((v) => v.plate)).toEqual(['BBB222'])
    expect(withSecond.vehicles).toHaveLength(2)
    expectApiError(() => accounts.removeVehicle(USER, 'veh_nope'), 404, 'not_found')
  })
})

describe('identity verification', () => {
  const ready = () => {
    accounts.updateProfile(USER, profile())
    accounts.addVehicle(USER, car())
  }

  it('cannot start before the profile and a vehicle exist', () => {
    expectApiError(() => accounts.startIdentity(USER), 403, 'profile_incomplete')
    accounts.updateProfile(USER, profile())
    expectApiError(() => accounts.startIdentity(USER), 403, 'vehicle_required')
  })

  it('is pending while the provider decides, then verified', () => {
    ready()
    expect(accounts.startIdentity(USER).identityStatus).toBe('pending')
    clock += 1000
    expect(accounts.get(USER).identityStatus).toBe('pending')
    expect(accounts.blockedBy(USER)).toBe('identity_required')
    clock += 2500
    expect(accounts.get(USER).identityStatus).toBe('verified')
    expect(accounts.blockedBy(USER)).toBeNull()
  })

  it('can be rejected, and then tried again', () => {
    ready()
    accounts.setIdentityOutcome('rejected')
    accounts.startIdentity(USER)
    clock += 3500
    expect(accounts.get(USER).identityStatus).toBe('rejected')
    expect(accounts.blockedBy(USER)).toBe('identity_required')

    accounts.setIdentityOutcome('verified')
    expect(accounts.startIdentity(USER).identityStatus).toBe('pending')
    clock += 3500
    expect(accounts.get(USER).identityStatus).toBe('verified')
  })

  it('does not restart a verified identity', () => {
    ready()
    accounts.startIdentity(USER)
    clock += 3500
    expect(accounts.startIdentity(USER).identityStatus).toBe('verified')
  })
})

describe('accounts are private', () => {
  it("one user's data never appears on another account", () => {
    accounts.updateProfile(USER, profile())
    accounts.addVehicle(USER, car())
    const other = accounts.get('mock-user-3300000000')
    expect(other.firstName).toBeNull()
    expect(other.vehicles).toEqual([])
  })

  it('needs a signed-in user', () => {
    expectApiError(() => accounts.get(null), 401, 'unauthorized')
  })
})
