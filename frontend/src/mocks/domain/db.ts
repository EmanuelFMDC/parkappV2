import type {
  Booking,
  BookingCreate,
  HostBooking,
  HostSpace,
  HostSpaceCreate,
  HostSpaceUpdate,
  Incident,
  IncidentCreate,
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
import {
  CHECK_IN_EARLY_MS,
  CHECK_PHOTOS_MAX,
  CHECK_PHOTOS_MIN,
  OVERTIME_GRACE_MS,
  overtimeHours,
} from '../../lib/arrival'
import { isWithinAvailability } from '../../lib/availability'
import { percentOf, priceBooking } from '../../lib/tariffs'
import { createAccounts } from './accounts'
import { ApiError, notFound } from './errors'
import { distanceM } from './geo'
import { quoteWindow, validateWindow } from './pricing'
import { buildEvents, buildReviews, venues } from './seed'
import { createSpaceStore } from './spaces'

const PRE_BOOKING_MS = 10 * 60_000
/** Cancelling is free until 2 hours before the start; later, ParkApp keeps 20 % of the total. */
const FREE_CANCEL_MS = 2 * 3_600_000
const LATE_CANCEL_BPS = 2000
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
  rentCents: number
  zoneSurchargeCents: number
  subtotalCents: number
  commissionCents: number
  vatCents: number
  totalCents: number
  expiresAt: string | null
  accessCode: string | null
  spotLabel: string | null
  cancelledBy: 'driver' | 'host' | null
  cancellationFeeCents: number | null
  refundCents: number | null
  checkedInAt: string | null
  checkedOutAt: string | null
  checkInPhotoKeys: string[]
  checkOutPhotoKeys: string[]
  overtimeHours: number | null
  overtimeCents: number | null
  incidents?: Incident[]
  createdAt: string
}

const INCIDENT_CATEGORIES: IncidentCreate['category'][] = ['damage', 'access', 'safety', 'other']
/** Reports are taken up to a week after the booking ends. */
const REPORT_WINDOW_MS = 7 * 24 * 3_600_000

interface DbOptions {
  now?: () => number
  /** Where bookings survive page reloads. `null` keeps everything in memory (tests). */
  storage?: Pick<Storage, 'getItem' | 'setItem'> | null
  /** How long the simulated identity provider takes to answer. */
  identityDelayMs?: number
  /** How long simulated back-office takes to review a new space. */
  reviewDelayMs?: number
}

const BLOCKING: Booking['status'][] = ['pending_payment', 'confirmed', 'in_use']

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
 * In-memory stand-in for the backend. It enforces the same rules the real one must:
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
      return raw ? (JSON.parse(raw) as StoredBooking[]).map(upgrade) : []
    } catch {
      return []
    }
  }
  /** Bookings saved before the commission model kept a single service fee. */
  function upgrade(b: StoredBooking & { serviceFeeCents?: number }): StoredBooking {
    const cancellation = {
      cancelledBy: b.cancelledBy ?? (b.status === 'cancelled' ? ('driver' as const) : null),
      cancellationFeeCents: b.cancellationFeeCents ?? (b.status === 'cancelled' ? 0 : null),
      refundCents: b.refundCents ?? (b.status === 'cancelled' ? 0 : null),
    }
    const arrival = {
      checkedInAt: b.checkedInAt ?? null,
      checkedOutAt: b.checkedOutAt ?? null,
      checkInPhotoKeys: b.checkInPhotoKeys ?? [],
      checkOutPhotoKeys: b.checkOutPhotoKeys ?? [],
      overtimeHours: b.overtimeHours ?? null,
      overtimeCents: b.overtimeCents ?? null,
    }
    if (b.commissionCents !== undefined) return { ...b, ...cancellation, ...arrival }
    const { serviceFeeCents = 0, ...rest } = b
    return {
      ...rest,
      ...cancellation,
      ...arrival,
      rentCents: b.subtotalCents,
      zoneSurchargeCents: 0,
      commissionCents: serviceFeeCents,
      vatCents: 0,
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

  /**
   * Free while, at every instant of the window, fewer bookings hold the space than it has
   * identical spots. (Two back-to-back bookings use one spot, not two.)
   */
  function isFree(spaceId: string, startsAt: string, endsAt: string): boolean {
    const s = Date.parse(startsAt)
    const e = Date.parse(endsAt)
    const held = bookings
      .filter((b) => b.spaceId === spaceId && BLOCKING.includes(b.status))
      .map((b) => [Date.parse(b.startsAt), Date.parse(b.endsAt)] as const)
      .filter(([bs, be]) => overlaps(s, e, bs, be))
    // The busiest moment starts when the window or one of the bookings starts.
    const moments = [s, ...held.map(([bs]) => bs).filter((t) => t > s)]
    const busiest = Math.max(
      0,
      ...moments.map((t) => held.filter(([bs, be]) => bs <= t && t < be).length),
    )
    return busiest < store.quantityOf(spaceId)
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
    const revealed = b.status === 'confirmed' || b.status === 'in_use' || b.status === 'completed'
    return {
      id: b.id,
      status: b.status,
      space: {
        id: space.id,
        title: space.title,
        neighborhood: space.neighborhood,
        address: revealed ? store.addressOf(space.id) : null,
        location: revealed ? space.location : null,
        photoUrl: space.photoUrls[0] ?? null,
        spotLabel: revealed ? b.spotLabel : null,
      },
      venueName: requireVenue(b.venueId).name,
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      vehicle: b.vehicle,
      rentCents: b.rentCents,
      zoneSurchargeCents: b.zoneSurchargeCents,
      subtotalCents: b.subtotalCents,
      commissionCents: b.commissionCents,
      vatCents: b.vatCents,
      totalCents: b.totalCents,
      expiresAt: b.status === 'pending_payment' ? b.expiresAt : null,
      accessCode: revealed ? b.accessCode : null,
      freeCancelUntil: new Date(Date.parse(b.startsAt) - FREE_CANCEL_MS).toISOString(),
      lateCancelFeeCents: percentOf(b.totalCents, LATE_CANCEL_BPS),
      cancelledBy: b.cancelledBy,
      cancellationFeeCents: b.cancellationFeeCents,
      refundCents: b.refundCents,
      checkInOpensAt: new Date(Date.parse(b.startsAt) - CHECK_IN_EARLY_MS).toISOString(),
      overtimeStartsAt: new Date(Date.parse(b.endsAt) + OVERTIME_GRACE_MS).toISOString(),
      overtimeHourCents: overtimePrice(b, 1).totalCents,
      checkedInAt: b.checkedInAt,
      checkedOutAt: b.checkedOutAt,
      checkInPhotoCount: b.checkInPhotoKeys.length,
      checkOutPhotoCount: b.checkOutPhotoKeys.length,
      overtimeHours: b.overtimeHours,
      overtimeCents: b.overtimeCents,
      incidents: (b.incidents ?? []).filter((i) => i.reportedBy === 'driver'),
      createdAt: b.createdAt,
    }
  }

  /** Damage, access or safety problems, for ParkApp to mediate between driver and host. */
  function addIncident(b: StoredBooking, by: Incident['reportedBy'], input: IncidentCreate) {
    if (!['confirmed', 'in_use', 'completed'].includes(b.status)) {
      throw new ApiError(409, 'not_reportable', 'Only confirmed or finished bookings')
    }
    if (now() > Date.parse(b.endsAt) + REPORT_WINDOW_MS) {
      throw new ApiError(409, 'not_reportable', 'Reports are taken up to 7 days after the end')
    }
    const description = typeof input.description === 'string' ? input.description.trim() : ''
    if (
      !INCIDENT_CATEGORIES.includes(input.category) ||
      description.length < 10 ||
      description.length > 1000
    ) {
      throw new ApiError(422, 'invalid_incident', 'Pick a category and describe what happened')
    }
    b.incidents = [
      ...(b.incidents ?? []),
      {
        id: `inc_${b.id}_${(b.incidents ?? []).length + 1}`,
        reportedBy: by,
        category: input.category,
        description,
        status: 'open',
        createdAt: new Date(now()).toISOString(),
      },
    ]
    save()
  }

  /** Extra hours: the space's hourly rate with commission and VAT, without the zone charge. */
  function overtimePrice(b: StoredBooking, hours: number) {
    const { hourlyCents } = store.tariff(b.spaceId)
    return priceBooking({ hourlyCents, zoneSurchargeCents: 0 }, hours)
  }

  function checkPhotos(photoKeys: unknown) {
    const keys = Array.isArray(photoKeys) ? photoKeys.filter((k) => typeof k === 'string') : []
    if (keys.length < CHECK_PHOTOS_MIN) {
      throw new ApiError(422, 'check_photos_required', `Add at least ${CHECK_PHOTOS_MIN} photos`)
    }
    if (keys.length > CHECK_PHOTOS_MAX) {
      throw new ApiError(422, 'check_too_many_photos', `Add at most ${CHECK_PHOTOS_MAX} photos`)
    }
    return keys as string[]
  }

  /** Only a confirmed booking that has not started, or an unpaid hold, can be cancelled. */
  function assertCancellable(b: StoredBooking) {
    if (b.status !== 'confirmed' && b.status !== 'pending_payment') {
      throw new ApiError(409, 'not_cancellable', 'This booking can no longer be cancelled')
    }
    if (now() >= Date.parse(b.startsAt)) {
      throw new ApiError(409, 'already_started', 'This booking has already started')
    }
  }

  function markCancelled(b: StoredBooking, by: 'driver' | 'host', feeCents: number) {
    const paid = b.status === 'confirmed'
    b.status = 'cancelled'
    b.cancelledBy = by
    b.cancellationFeeCents = paid ? feeCents : 0
    b.refundCents = paid ? b.totalCents - feeCents : 0
    b.expiresAt = null
    save()
  }

  function toHostBooking(b: StoredBooking): HostBooking {
    const card = accounts.driverCard(b.userId)
    return {
      id: b.id,
      status: b.status,
      space: { id: b.spaceId, title: requireSpace(b.spaceId).title },
      startsAt: b.startsAt,
      endsAt: b.endsAt,
      driver: { ...card, firstName: card.firstName || 'Conductor', vehicle: b.vehicle },
      subtotalCents: b.subtotalCents,
      cancelledBy: b.cancelledBy,
      checkedInAt: b.checkedInAt,
      checkedOutAt: b.checkedOutAt,
      overtimeHours: b.overtimeHours,
      incidents: (b.incidents ?? []).filter((i) => i.reportedBy === 'host'),
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
      validateWindow(startsAt, endsAt)
      expireStale()
      return (
        store
          .active()
          .filter((s) => store.venueIdOf(s.id) === venue.id)
          // Outside the host's schedule the space is not on offer at all.
          .filter((s) => isWithinAvailability(store.availabilityOf(s.id), startsAt, endsAt))
          .map((s) => summary(s, venue, startsAt, endsAt))
          .filter((s) => s.distanceM <= venue.radiusM)
          .sort((a, b) => a.distanceM - b.distanceM)
      )
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
      requireActiveSpace(spaceId)
      return quoteWindow(store.tariff(spaceId), startsAt, endsAt)
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
      const q = quoteWindow(store.tariff(space.id), input.startsAt, input.endsAt)
      if (Date.parse(input.startsAt) < now() - 5 * 60_000) {
        throw new ApiError(422, 'in_the_past', 'The booking cannot start in the past')
      }
      if (!isWithinAvailability(store.availabilityOf(space.id), input.startsAt, input.endsAt)) {
        throw new ApiError(409, 'outside_availability', 'The host does not rent it at that time')
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
        rentCents: q.rentCents,
        zoneSurchargeCents: q.zoneSurchargeCents,
        subtotalCents: q.subtotalCents,
        commissionCents: q.commissionCents,
        vatCents: q.vatCents,
        totalCents: q.totalCents,
        expiresAt: new Date(now() + PRE_BOOKING_MS).toISOString(),
        accessCode: null,
        spotLabel: null,
        cancelledBy: null,
        cancellationFeeCents: null,
        refundCents: null,
        checkedInAt: null,
        checkedOutAt: null,
        checkInPhotoKeys: [],
        checkOutPhotoKeys: [],
        overtimeHours: null,
        overtimeCents: null,
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
      assertCancellable(b)
      const late = now() > Date.parse(b.startsAt) - FREE_CANCEL_MS
      markCancelled(b, 'driver', late ? percentOf(b.totalCents, LATE_CANCEL_BPS) : 0)
      return toBooking(b)
    },

    /** The driver arrives: photos of the car and the spot, and the booking is in use. */
    checkIn(userId: string | null, id: string, photoKeys: unknown): Booking {
      const b = ownBooking(requireUser(userId), id)
      if (b.status !== 'confirmed') {
        throw new ApiError(409, 'not_checkable', 'Only a confirmed booking can be checked in')
      }
      if (now() < Date.parse(b.startsAt) - CHECK_IN_EARLY_MS) {
        throw new ApiError(409, 'too_early', 'Check-in opens 30 minutes before the start')
      }
      if (now() >= Date.parse(b.endsAt)) {
        throw new ApiError(409, 'booking_over', 'This booking has already ended')
      }
      b.checkInPhotoKeys = checkPhotos(photoKeys)
      b.checkedInAt = new Date(now()).toISOString()
      b.status = 'in_use'
      save()
      return toBooking(b)
    },

    /**
     * The driver leaves: photos again, and every started hour after the grace period is charged to
     * the card used for the booking (Stripe, off-session, in production).
     */
    checkOut(userId: string | null, id: string, photoKeys: unknown): Booking {
      const b = ownBooking(requireUser(userId), id)
      if (b.status !== 'in_use') {
        throw new ApiError(409, 'not_checked_in', 'Check in before checking out')
      }
      b.checkOutPhotoKeys = checkPhotos(photoKeys)
      const extra = overtimeHours(Date.parse(b.endsAt), now())
      b.overtimeHours = extra
      b.overtimeCents = extra > 0 ? overtimePrice(b, extra).totalCents : 0
      b.checkedOutAt = new Date(now()).toISOString()
      b.status = 'completed'
      save()
      return toBooking(b)
    },

    reportIncident(userId: string | null, id: string, input: IncidentCreate): Booking {
      const b = ownBooking(requireUser(userId), id)
      addIncident(b, 'driver', input)
      return toBooking(b)
    },

    reportHostIncident(userId: string | null, id: string, input: IncidentCreate): HostBooking {
      const mine = new Set(store.idsFor(requireUser(userId)))
      const b = bookings.find((x) => x.id === id && mine.has(x.spaceId))
      if (!b) throw notFound('Booking')
      addIncident(b, 'host', input)
      return toHostBooking(b)
    },

    /** The host cancels a booking on one of their spaces: the driver always gets 100 % back. */
    cancelHostBooking(userId: string | null, id: string): HostBooking {
      const uid = requireUser(userId)
      expireStale()
      const mine = new Set(store.idsFor(uid))
      const b = bookings.find((x) => x.id === id && mine.has(x.spaceId))
      if (!b) throw notFound('Booking')
      if (b.status !== 'confirmed') {
        throw new ApiError(409, 'not_cancellable', 'Only a confirmed booking can be cancelled')
      }
      assertCancellable(b)
      markCancelled(b, 'host', 0)
      return toHostBooking(b)
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
        .map(toHostBooking)
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
        rentCents: 0,
        zoneSurchargeCents: 0,
        subtotalCents: 0,
        commissionCents: 0,
        vatCents: 0,
        totalCents: 0,
        expiresAt: null,
        accessCode: 'FOREIG',
        spotLabel: null,
        cancelledBy: null,
        cancellationFeeCents: null,
        refundCents: null,
        checkedInAt: null,
        checkedOutAt: null,
        checkInPhotoKeys: [],
        checkOutPhotoKeys: [],
        overtimeHours: null,
        overtimeCents: null,
        createdAt: new Date(now()).toISOString(),
      })
      save()
    },
  }
}

export type MockDb = ReturnType<typeof createDb>
