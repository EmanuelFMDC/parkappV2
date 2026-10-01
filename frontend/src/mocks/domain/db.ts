import type {
  Booking,
  BookingCreate,
  HostBooking,
  HostSpace,
  HostSpaceCreate,
  HostSpaceUpdate,
  Me,
  ProfileInput,
  Quote,
  Review,
  Space,
  SpaceSummary,
  Vehicle,
  VehicleInput,
  Venue,
  VenueEvent,
} from '../../api/types'
import { createAccounts } from './accounts'
import { ApiError, notFound } from './errors'
import { distanceM } from './geo'
import { quoteWindow } from './pricing'
import { buildEvents, buildReviews, venues } from './seed'
import { createSpaceStore } from './spaces'

const PRE_BOOKING_MS = 10 * 60_000
const FREE_CANCEL_MS = 10 * 60_000
const STORAGE_KEY = 'parkapp.mock.bookings'

interface StoredBooking {
  id: string
  userId: string
  spaceId: string
  venueId: string
  status: Booking['status']
  startsAt: string
  endsAt: string
  vehicle: Vehicle
  subtotalCents: number
  serviceFeeCents: number
  totalCents: number
  expiresAt: string | null
  accessCode: string | null
  spotLabel: string | null
  createdAt: string
}

interface DbOptions {
  now?: () => number
  /** Where bookings survive page reloads. `null` keeps everything in memory (tests). */
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null
  /** How long the simulated identity provider takes to answer. */
  identityDelayMs?: number
  /** How long simulated back-office takes to review a new space. */
  reviewDelayMs?: number
}

const BLOCKING: Booking['status'][] = ['pending_payment', 'confirmed']

function overlaps(aStart: number, aEnd: number, bStart: number, bEnd: number): boolean {
  return aStart < bEnd && bStart < aEnd
}

function randomCode(): string {
  const alphabet = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'
  return Array.from(
    { length: 6 },
    () => alphabet[Math.floor(Math.random() * alphabet.length)],
  ).join('')
}

/**
 * In-memory stand-in for the Django backend. It enforces the same rules the real one must:
 * no overlapping bookings on a space, integer-cent pricing, UTC dates, and the exact address
 * only after confirmation.
 */
export function createDb({
  now = Date.now,
  storage = null,
  identityDelayMs,
  reviewDelayMs,
}: DbOptions = {}) {
  const store = createSpaceStore({ now, storage, reviewDelayMs })
  const events = buildEvents(now())
  const reviews = new Map<string, Review[]>(
    store.active().map((s) => [s.id, buildReviews(s.id, s.reviewCount, now())]),
  )
  const accounts = createAccounts({ now, storage, identityDelayMs })
  const bookings: StoredBooking[] = load()
  let counter = bookings.length

  function load(): StoredBooking[] {
    try {
      const raw = storage?.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as StoredBooking[]) : []
    } catch {
      return []
    }
  }
  function save() {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(bookings))
    } catch {
      /* storage unavailable: stay in memory */
    }
  }

  function venueOf(space: Space): Venue {
    return venues.find((v) => v.id === store.venueIdOf(space.id))!
  }
  function requireVenue(id: string): Venue {
    const venue = venues.find((v) => v.id === id)
    if (!venue) throw notFound('Venue')
    return venue
  }
  /** Any space, whatever its status: a booking keeps working after its space is paused. */
  const requireSpace = (id: string): Space => store.require(id)
  /** Only spaces drivers may see and book. */
  function requireActiveSpace(id: string): Space {
    const space = store.require(id)
    if (!store.isActive(id)) throw notFound('Space')
    return space
  }

  /** Releases unpaid pre-bookings whose hold ran out (Cloud Tasks does this in production). */
  function expireStale() {
    const t = now()
    let changed = false
    for (const b of bookings) {
      if (b.status === 'pending_payment' && b.expiresAt && Date.parse(b.expiresAt) <= t) {
        b.status = 'expired'
        changed = true
      }
    }
    if (changed) save()
  }

  function isFree(spaceId: string, startsAt: string, endsAt: string): boolean {
    const s = Date.parse(startsAt)
    const e = Date.parse(endsAt)
    return !bookings.some(
      (b) =>
        b.spaceId === spaceId &&
        BLOCKING.includes(b.status) &&
        overlaps(s, e, Date.parse(b.startsAt), Date.parse(b.endsAt)),
    )
  }

  function summary(space: Space, venue: Venue, startsAt: string, endsAt: string): SpaceSummary {
    return {
      id: space.id,
      title: space.title,
      neighborhood: space.neighborhood,
      location: space.location,
      distanceM: distanceM(space.location, venue.location),
      priceCentsPerHour: space.priceCentsPerHour,
      rating: space.rating,
      reviewCount: space.reviewCount,
      features: space.features,
      photoUrls: space.photoUrls,
      available: isFree(space.id, startsAt, endsAt),
    }
  }

  function toBooking(b: StoredBooking): Booking {
    const space = requireSpace(b.spaceId)
    const revealed = b.status === 'confirmed' || b.status === 'completed'
    return {
      id: b.id,
      status: b.status,
      space: {
        id: space.id,
        title: space.title,
        neighborhood: space.neighborhood,
        address: revealed ? store.addressOf(space.id) : null,
        photoUrl: space.photoUrls[0] ?? null,
        spotLabel: revealed ? b.spotLabel : null,
      },
      venueName: requireVenue(b.venueId).name,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      vehicle: b.vehicle,
      subtotalCents: b.subtotalCents,
      serviceFeeCents: b.serviceFeeCents,
      totalCents: b.totalCents,
      expiresAt: b.status === 'pending_payment' ? b.expiresAt : null,
      accessCode: revealed ? b.accessCode : null,
      createdAt: b.createdAt,
    }
  }

  function ownBooking(userId: string, id: string): StoredBooking {
    expireStale()
    const b = bookings.find((x) => x.id === id && x.userId === userId)
    if (!b) throw notFound('Booking')
    return b
  }

  const requireUser = (userId: string | null): string => accounts.ensure(userId).id

  return {
    now,
    health: () => ({ status: 'ok' as const, version: '0.1.0-mock' }),

    listVenues: (): Venue[] => venues,
    listEvents: (venueId: string): VenueEvent[] => {
      requireVenue(venueId)
      return events
        .filter((e) => e.venueId === venueId && Date.parse(e.endsAt) > now())
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
    },

    searchSpaces(venueId: string, startsAt: string, endsAt: string): SpaceSummary[] {
      const venue = requireVenue(venueId)
      quoteWindow(1, startsAt, endsAt) // validates the window
      expireStale()
      return store
        .active()
        .filter((s) => store.venueIdOf(s.id) === venue.id)
        .map((s) => summary(s, venue, startsAt, endsAt))
        .filter((s) => s.distanceM <= venue.radiusM)
        .sort((a, b) => a.distanceM - b.distanceM)
    },

    getSpace(id: string): Space {
      const space = requireActiveSpace(id)
      const venue = venueOf(space)
      return { ...space, distanceM: distanceM(space.location, venue.location), available: true }
    },
    listReviews: (spaceId: string): Review[] => {
      requireSpace(spaceId)
      return reviews.get(spaceId) ?? []
    },
    quote(spaceId: string, startsAt: string, endsAt: string): Quote {
      return quoteWindow(requireActiveSpace(spaceId).priceCentsPerHour, startsAt, endsAt)
    },

    createBooking(userId: string | null, input: BookingCreate): Booking {
      const uid = requireUser(userId)
      const blocked = accounts.blockedBy(uid)
      if (blocked) {
        throw new ApiError(403, blocked, 'Complete your account before booking')
      }
      const space = requireActiveSpace(input.spaceId)
      if (store.hostIdOf(space.id) === uid) {
        throw new ApiError(422, 'own_space', 'You cannot book your own space')
      }
      const vehicle = accounts.vehicle(uid, input.vehicleId)
      if (!space.vehicleTypes.includes(vehicle.type)) {
        throw new ApiError(422, 'vehicle_not_supported', 'Your vehicle does not fit this space')
      }
      const q = quoteWindow(space.priceCentsPerHour, input.startsAt, input.endsAt)
      if (Date.parse(input.startsAt) < now() - 5 * 60_000) {
        throw new ApiError(422, 'in_the_past', 'The booking cannot start in the past')
      }
      expireStale()
      if (!isFree(space.id, input.startsAt, input.endsAt)) {
        throw new ApiError(
          409,
          'space_unavailable',
          'This space was just booked for part of that time',
        )
      }
      counter += 1
      const stored: StoredBooking = {
        id: `bk_${counter}_${Math.floor(now() / 1000)}`,
        userId: uid,
        spaceId: space.id,
        venueId: venueOf(space).id,
        status: 'pending_payment',
        startsAt: input.startsAt,
        endsAt: input.endsAt,
        vehicle,
        subtotalCents: q.subtotalCents,
        serviceFeeCents: q.serviceFeeCents,
        totalCents: q.totalCents,
        expiresAt: new Date(now() + PRE_BOOKING_MS).toISOString(),
        accessCode: null,
        spotLabel: null,
        createdAt: new Date(now()).toISOString(),
      }
      bookings.push(stored)
      save()
      return toBooking(stored)
    },

    listBookings(userId: string | null): Booking[] {
      const uid = requireUser(userId)
      expireStale()
      return bookings
        .filter((b) => b.userId === uid)
        .sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
        .map(toBooking)
    },
    getBooking: (userId: string | null, id: string): Booking =>
      toBooking(ownBooking(requireUser(userId), id)),

    confirmBooking(userId: string | null, id: string, paymentIntentId: string): Booking {
      const b = ownBooking(requireUser(userId), id)
      if (!paymentIntentId) throw new ApiError(422, 'missing_payment', 'A payment is required')
      if (b.status === 'confirmed') return toBooking(b)
      if (b.status !== 'pending_payment') {
        throw new ApiError(409, 'booking_expired', 'The hold on this space ran out. Search again.')
      }
      b.status = 'confirmed'
      b.accessCode = randomCode()
      b.spotLabel = `Cochera ${1 + (b.id.length % 3)}`
      b.expiresAt = null
      save()
      return toBooking(b)
    },

    cancelBooking(userId: string | null, id: string): Booking {
      const b = ownBooking(requireUser(userId), id)
      if (b.status === 'cancelled' || b.status === 'expired' || b.status === 'completed') {
        throw new ApiError(409, 'not_cancellable', 'This booking can no longer be cancelled')
      }
      if (now() > Date.parse(b.startsAt) - FREE_CANCEL_MS) {
        throw new ApiError(409, 'too_late', 'Free cancellation ended 10 minutes before the start')
      }
      b.status = 'cancelled'
      save()
      return toBooking(b)
    },

    getMe: (userId: string | null): Me => accounts.get(userId),
    updateMe: (userId: string | null, patch: Partial<Pick<Me, 'language'>>): Me =>
      patch.language ? accounts.updateLanguage(userId, patch.language) : accounts.get(userId),
    updateProfile: (userId: string | null, input: ProfileInput): Me =>
      accounts.updateProfile(userId, input),
    addVehicle: (userId: string | null, input: VehicleInput): Me =>
      accounts.addVehicle(userId, input),
    removeVehicle: (userId: string | null, vehicleId: string): Me =>
      accounts.removeVehicle(userId, vehicleId),
    startIdentity: (userId: string | null): Me => accounts.startIdentity(userId),

    listHostSpaces: (userId: string | null): HostSpace[] => store.listFor(requireUser(userId)),
    createHostSpace(userId: string | null, input: HostSpaceCreate): HostSpace {
      const uid = requireUser(userId)
      // A host needs personal data and a verified identity, but no car.
      const blocked = accounts.blockedBy(uid, { needsVehicle: false })
      if (blocked) throw new ApiError(403, blocked, 'Complete your account before publishing')
      return store.create(uid, input, accounts.hostLabel(uid))
    },
    updateHostSpace: (userId: string | null, id: string, patch: HostSpaceUpdate): HostSpace =>
      store.update(requireUser(userId), id, patch),

    /** What drivers booked on this host's spaces. Never the driver's phone, email or ID. */
    listHostBookings(userId: string | null): HostBooking[] {
      const uid = requireUser(userId)
      expireStale()
      const mine = new Set(store.idsFor(uid))
      return bookings
        .filter((b) => mine.has(b.spaceId) && !['pending_payment', 'expired'].includes(b.status))
        .sort((a, b) => Date.parse(a.startsAt) - Date.parse(b.startsAt))
        .map((b) => {
          const card = accounts.driverCard(b.userId)
          return {
            id: b.id,
            status: b.status,
            space: { id: b.spaceId, title: requireSpace(b.spaceId).title },
            startsAt: b.startsAt,
            endsAt: b.endsAt,
            driver: { ...card, firstName: card.firstName || 'Conductor', vehicle: b.vehicle },
            subtotalCents: b.subtotalCents,
            createdAt: b.createdAt,
          }
        })
    },

    /** Test and demo controls for simulated back-office, the identity provider and verified accounts. */
    setReviewOutcome: (outcome: 'active' | 'rejected') => store.setReviewOutcome(outcome),
    approveAllSpacesNow: () => store.approveAllNow(),
    setIdentityOutcome: (outcome: 'verified' | 'rejected') => accounts.setIdentityOutcome(outcome),
    seedVerifiedAccount: (userId: string, vehicle?: Partial<VehicleInput>): Me =>
      accounts.seedVerified(userId, vehicle),

    /** Test and demo helper: another driver books a space, as in real life. */
    seedForeignBooking(spaceId: string, startsAt: string, endsAt: string) {
      const space = requireSpace(spaceId)
      counter += 1
      bookings.push({
        id: `bk_foreign_${counter}`,
        userId: 'someone-else',
        spaceId,
        venueId: store.venueIdOf(space.id),
        status: 'confirmed',
        startsAt,
        endsAt,
        vehicle: {
          id: 'veh_foreign',
          plate: 'XXX000',
          make: 'Otro',
          model: 'Auto',
          color: 'Negro',
          type: 'sedan',
        },
        subtotalCents: 0,
        serviceFeeCents: 0,
        totalCents: 0,
        expiresAt: null,
        accessCode: 'FOREIG',
        spotLabel: null,
        createdAt: new Date(now()).toISOString(),
      })
      save()
    },
  }
}

export type MockDb = ReturnType<typeof createDb>
