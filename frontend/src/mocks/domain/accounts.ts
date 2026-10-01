import type { IdentityStatus, Me, ProfileInput, Vehicle, VehicleInput } from '../../api/types'
import { APP_TIME_ZONE } from '../../lib/time'
import { ApiError, notFound, unauthorized } from './errors'

const STORAGE_KEY = 'parkapp.mock.accounts'
const MAX_VEHICLES = 5
export const MIN_AGE = 18

interface Account {
  id: string
  phone: string | null
  email: string | null
  firstName: string | null
  lastName: string | null
  birthDate: string | null
  language: Me['language']
  privacyAcceptedAt: string | null
  identity: { status: IdentityStatus; startedAt: number | null }
  vehicles: Vehicle[]
}

interface Options {
  now: () => number
  storage: Pick<Storage, 'getItem' | 'setItem'> | null
  /** How long the (simulated) provider takes to decide. */
  identityDelayMs?: number
}

export type AccountBlock = 'profile_incomplete' | 'vehicle_required' | 'identity_required'

const NAME = /^\p{L}[\p{L} '.-]{1,59}$/u
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
const PLATE = /^[A-Z0-9]{5,8}$/
const invalid = (code: string, message: string) => new ApiError(422, code, message)

export function normalizePlate(plate: string): string {
  return plate.toUpperCase().replace(/[\s-]/g, '')
}

/** Whole years between a birth date and a reference date, both "YYYY-MM-DD". */
export function ageOn(birthDate: string, today: string): number {
  const [by, bm, bd] = birthDate.split('-').map(Number) as [number, number, number]
  const [ty, tm, td] = today.split('-').map(Number) as [number, number, number]
  return ty - by - (tm < bm || (tm === bm && td < bd) ? 1 : 0)
}

const isRealDate = (value: string) => {
  const d = new Date(`${value}T12:00:00Z`)
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(d.getTime()) &&
    d.toISOString().startsWith(value)
  )
}

/** Accounts, personal data, vehicles and identity verification, with the rules the real backend must enforce. */
export function createAccounts({ now, storage, identityDelayMs = 3000 }: Options) {
  let outcome: 'verified' | 'rejected' = 'verified'
  const accounts = new Map<string, Account>(load().map((a) => [a.id, a]))
  let vehicleCounter = [...accounts.values()].reduce((n, a) => n + a.vehicles.length, 0)

  function load(): Account[] {
    try {
      const raw = storage?.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as Account[]) : []
    } catch {
      return []
    }
  }
  function save() {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify([...accounts.values()]))
    } catch {
      /* storage unavailable: stay in memory */
    }
  }
  const today = () =>
    new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIME_ZONE }).format(new Date(now()))

  /** The provider answers asynchronously; reading the account is when we notice it did. */
  function settleIdentity(a: Account) {
    const { status, startedAt } = a.identity
    if (status === 'pending' && startedAt !== null && now() - startedAt >= identityDelayMs) {
      a.identity = { status: outcome, startedAt: null }
      save()
    }
  }

  function ensure(userId: string | null): Account {
    if (!userId) throw unauthorized()
    let a = accounts.get(userId)
    if (!a) {
      a = {
        id: userId,
        phone: userId.startsWith('mock-user-') ? userId.replace('mock-user-', '') : null,
        email: null,
        firstName: null,
        lastName: null,
        birthDate: null,
        language: 'es-MX',
        privacyAcceptedAt: null,
        identity: { status: 'not_started', startedAt: null },
        vehicles: [],
      }
      accounts.set(userId, a)
      save()
    }
    settleIdentity(a)
    return a
  }

  const toMe = (a: Account): Me => ({
    id: a.id,
    phone: a.phone,
    email: a.email,
    firstName: a.firstName,
    lastName: a.lastName,
    birthDate: a.birthDate,
    language: a.language,
    privacyAcceptedAt: a.privacyAcceptedAt,
    identityStatus: a.identity.status,
    vehicles: a.vehicles,
  })

  /** What stops an account from acting. Hosts have no car, so they skip the vehicle check. */
  function block(a: Account, needsVehicle = true): AccountBlock | null {
    if (!a.firstName || !a.lastName || !a.birthDate || !a.email || !a.privacyAcceptedAt) {
      return 'profile_incomplete'
    }
    if (needsVehicle && a.vehicles.length === 0) return 'vehicle_required'
    if (a.identity.status !== 'verified') return 'identity_required'
    return null
  }

  return {
    ensure,
    get: (userId: string | null): Me => toMe(ensure(userId)),

    /** `null` when the account may book; otherwise what is missing. */
    blockedBy: (
      userId: string | null,
      opts: { needsVehicle?: boolean } = {},
    ): AccountBlock | null => block(ensure(userId), opts.needsVehicle ?? true),

    /** How a host appears to drivers: first name and last initial, never more. */
    hostLabel(userId: string): { displayName: string; memberSince: string } {
      const a = ensure(userId)
      const initial = a.lastName ? ` ${a.lastName.charAt(0)}.` : ''
      return {
        displayName: `${a.firstName ?? ''}${initial}`.trim(),
        memberSince: new Date(now()).toISOString().slice(0, 10),
      }
    },

    /** What a host may know about a driver: first name and whether the identity is verified. */
    driverCard(userId: string): { firstName: string; identityVerified: boolean } {
      const a = ensure(userId)
      return { firstName: a.firstName ?? '', identityVerified: a.identity.status === 'verified' }
    },

    vehicle(userId: string | null, vehicleId: string): Vehicle {
      const v = ensure(userId).vehicles.find((x) => x.id === vehicleId)
      if (!v) throw notFound('Vehicle')
      return v
    },

    updateLanguage(userId: string | null, language: Me['language']): Me {
      const a = ensure(userId)
      a.language = language
      save()
      return toMe(a)
    },

    updateProfile(userId: string | null, input: ProfileInput): Me {
      const a = ensure(userId)
      const first = input.firstName.trim()
      const last = input.lastName.trim()
      if (!NAME.test(first) || !NAME.test(last)) {
        throw invalid('invalid_name', 'Enter your legal first and last name')
      }
      if (
        !isRealDate(input.birthDate) ||
        input.birthDate > today() ||
        ageOn(input.birthDate, today()) > 120
      ) {
        throw invalid('invalid_birth_date', 'Enter a valid birth date')
      }
      if (ageOn(input.birthDate, today()) < MIN_AGE) {
        throw invalid('underage', `You must be at least ${MIN_AGE} to book`)
      }
      if (!EMAIL.test(input.email.trim())) throw invalid('invalid_email', 'Enter a valid email')
      if (input.acceptPrivacy !== true) {
        throw invalid('consent_required', 'You must accept the privacy notice')
      }
      a.firstName = first
      a.lastName = last
      a.birthDate = input.birthDate
      a.email = input.email.trim().toLowerCase()
      a.privacyAcceptedAt ??= new Date(now()).toISOString()
      save()
      return toMe(a)
    },

    addVehicle(userId: string | null, input: VehicleInput): Me {
      const a = ensure(userId)
      const plate = normalizePlate(input.plate)
      if (!PLATE.test(plate)) throw invalid('invalid_plate', 'Enter the full license plate')
      const make = input.make.trim()
      const model = input.model.trim()
      const color = input.color.trim()
      if (make.length < 2 || model.length < 1 || color.length < 2) {
        throw invalid('invalid_vehicle', 'Enter make, model and color')
      }
      if (a.vehicles.length >= MAX_VEHICLES) {
        throw invalid('too_many_vehicles', `You can register up to ${MAX_VEHICLES} vehicles`)
      }
      if (a.vehicles.some((v) => v.plate === plate)) {
        throw new ApiError(409, 'duplicate_vehicle', 'This plate is already registered')
      }
      vehicleCounter += 1
      a.vehicles.push({ id: `veh_${vehicleCounter}`, plate, make, model, color, type: input.type })
      save()
      return toMe(a)
    },

    removeVehicle(userId: string | null, vehicleId: string): Me {
      const a = ensure(userId)
      if (!a.vehicles.some((v) => v.id === vehicleId)) throw notFound('Vehicle')
      a.vehicles = a.vehicles.filter((v) => v.id !== vehicleId)
      save()
      return toMe(a)
    },

    startIdentity(userId: string | null): Me {
      const a = ensure(userId)
      // Identity only needs the personal data: hosts verify without registering a car.
      if (block(a, false) === 'profile_incomplete') {
        throw new ApiError(403, 'profile_incomplete', 'Complete your details first')
      }
      if (a.identity.status !== 'verified') {
        a.identity = { status: 'pending', startedAt: now() }
        save()
      }
      return toMe(a)
    },

    /** Test and demo control: how the simulated provider will answer. */
    setIdentityOutcome(next: 'verified' | 'rejected') {
      outcome = next
    },

    /** Test and demo helper: an account that has already gone through everything. */
    seedVerified(userId: string, vehicle?: Partial<VehicleInput>): Me {
      const a = ensure(userId)
      a.firstName = 'Prueba'
      a.lastName = 'Conductor'
      a.birthDate = '1990-05-15'
      a.email = 'prueba@example.com'
      a.privacyAcceptedAt = new Date(now()).toISOString()
      if (a.vehicles.length === 0) {
        vehicleCounter += 1
        a.vehicles.push({
          id: `veh_${vehicleCounter}`,
          plate: 'JAL482A',
          make: 'Nissan',
          model: 'Versa',
          color: 'Gris',
          type: 'sedan',
          ...vehicle,
        })
      }
      a.identity = { status: 'verified', startedAt: null }
      save()
      return toMe(a)
    },
  }
}

export type Accounts = ReturnType<typeof createAccounts>
