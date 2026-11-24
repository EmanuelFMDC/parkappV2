import type {
  HostSpace,
  HostSpaceCreate,
  HostSpaceUpdate,
  Municipality,
  Space,
  SpaceStatus,
  Venue,
} from '../../api/types'
import {
  DESCRIPTION_MAX,
  PHOTOS_MAX,
  PHOTOS_MIN,
  STREET_MIN,
  QUANTITY_MAX,
  QUANTITY_MIN,
  MUNICIPALITIES,
  dimensionsInRange,
  suggestVehicleTypes,
} from '../../lib/hostRules'
import { validAvailability, type Availability } from '../../lib/availability'
import { tariffFor, type Tariff } from '../../lib/tariffs'
import { ApiError, notFound } from './errors'
import { distanceM } from './geo'
import { buildSpaces, venues } from './seed'

const STORAGE_KEY = 'parkapp.mock.spaces'
const TONES = ['day', 'dusk', 'night'] as const
const REJECTION_NOTE = 'Las fotos no se ven bien. Sube fotos claras de la entrada y del lugar.'

interface Meta {
  venueId: string
  hostId: string | null
  status: SpaceStatus
  street: string
  municipality: Municipality
  references: string
  reviewNote: string | null
  createdAt: string
  reviewStartedAt: number | null
  /** Identical spots; each booking takes one. Older saved spaces have none (= 1). */
  quantity?: number
  /** When the host rents it; null or missing = always. */
  availability?: Availability | null
}

interface Stored {
  space: Space
  meta: Meta
}

interface Options {
  now: () => number
  storage: Pick<Storage, 'getItem' | 'setItem'> | null
  /** How long simulated back-office takes to review a new space. */
  reviewDelayMs?: number
}

export interface HostLabel {
  displayName: string
  memberSince: string
}

const invalid = (code: string, message: string) => new ApiError(422, code, message)

function checkAvailability(a: Availability | null | undefined) {
  if (a && !validAvailability(a)) {
    throw invalid('invalid_availability', 'Pick at least one day and two different hours')
  }
}

/** ParkApp writes the title so the host has one field less: "Cochera techada en Providencia". */
export function autoTitle(features: string[], quantity: number, neighborhood: string): string {
  const covered = features.includes('covered')
  const noun =
    quantity > 1
      ? `${quantity} cajones${covered ? ' techados' : ''}`
      : `Cochera${covered ? ' techada' : ''}`
  return `${noun} en ${neighborhood}`
}

/**
 * Every space on the platform: the sample ones and the ones hosts publish. Public searches only
 * see `active` spaces; a new one waits in `pending_review` until back-office approves it.
 */
export function createSpaceStore({ now, storage, reviewDelayMs = 5000 }: Options) {
  let reviewOutcome: 'active' | 'rejected' = 'active'
  let counter = 0

  const seeded: Stored[] = buildSpaces().map((space, i) => {
    const venue = venues.find((v) => space.id.startsWith(`${v.id}-`))!
    return {
      space,
      meta: {
        venueId: venue.id,
        hostId: null,
        status: 'active',
        street: `Calle de ejemplo ${100 + i}`,
        municipality: venue.area as Municipality,
        references: '',
        reviewNote: null,
        createdAt: new Date(now()).toISOString(),
        reviewStartedAt: null,
      },
    }
  })
  const hosted: Stored[] = load()
  counter = hosted.length

  function load(): Stored[] {
    try {
      const raw = storage?.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as Stored[]) : []
    } catch {
      return []
    }
  }
  function save() {
    try {
      storage?.setItem(STORAGE_KEY, JSON.stringify(hosted))
    } catch {
      /* storage unavailable: stay in memory */
    }
  }

  /** Back-office answers asynchronously; reading is when we notice it did. */
  function settle() {
    let changed = false
    for (const { meta } of hosted) {
      if (
        meta.status === 'pending_review' &&
        meta.reviewStartedAt !== null &&
        now() - meta.reviewStartedAt >= reviewDelayMs
      ) {
        meta.status = reviewOutcome
        meta.reviewNote = reviewOutcome === 'rejected' ? REJECTION_NOTE : null
        meta.reviewStartedAt = null
        changed = true
      }
    }
    if (changed) save()
  }

  /** ParkApp sets the price from where the space is; the host never does. */
  function tariffOf({ space, meta }: Stored): Tariff {
    const venue = venueById(meta.venueId)
    return tariffFor({
      venueId: venue.id,
      distanceM: distanceM(space.location, venue.location),
      radiusM: venue.radiusM,
      municipality: meta.municipality,
    })
  }
  function applyTariff(e: Stored): Stored {
    const t = tariffOf(e)
    e.space.priceCentsPerHour = t.hourlyCents
    e.space.zoneSurchargeCents = t.zoneSurchargeCents
    return e
  }

  const everything = (): Stored[] => {
    settle()
    return [...seeded, ...hosted].map(applyTariff)
  }
  const entry = (id: string) => everything().find((e) => e.space.id === id)
  const venueById = (id: string): Venue => venues.find((v) => v.id === id)!

  function toHostSpace({ space, meta }: Stored): HostSpace {
    const venue = venueById(meta.venueId)
    return {
      id: space.id,
      status: meta.status,
      title: space.title,
      description: space.description,
      venue: { id: venue.id, name: venue.name },
      street: meta.street,
      neighborhood: space.neighborhood,
      municipality: meta.municipality,
      references: meta.references,
      location: space.location,
      distanceM: distanceM(space.location, venue.location),
      dimensions: space.dimensions,
      vehicleTypes: space.vehicleTypes,
      features: space.features,
      priceCentsPerHour: space.priceCentsPerHour,
      zoneSurchargeCents: space.zoneSurchargeCents,
      photoUrls: space.photoUrls,
      quantity: meta.quantity ?? 1,
      availability: meta.availability ?? null,
      reviewNote: meta.reviewNote,
      createdAt: meta.createdAt,
    }
  }

  function validateCreate(input: HostSpaceCreate, venue: Venue) {
    if (input.street.trim().length < STREET_MIN || input.neighborhood.trim().length < 2) {
      throw invalid('invalid_address', 'Enter the street, number and neighborhood')
    }
    if (!MUNICIPALITIES.includes(input.municipality)) {
      throw invalid('invalid_municipality', 'Pick a municipality in the metropolitan area')
    }
    if (distanceM(input.location, venue.location) > venue.radiusM) {
      throw invalid(
        'outside_radius',
        `The space must be within ${venue.radiusM / 1000} km of the venue`,
      )
    }
    if (!dimensionsInRange(input.dimensions)) {
      throw invalid('invalid_dimensions', 'Check the length, width and height')
    }
    if (suggestVehicleTypes(input.dimensions).length === 0) {
      throw invalid('fits_no_car', 'No standard car fits these measurements')
    }
    if (
      !Number.isInteger(input.quantity) ||
      input.quantity < QUANTITY_MIN ||
      input.quantity > QUANTITY_MAX
    ) {
      throw invalid('invalid_quantity', `Between ${QUANTITY_MIN} and ${QUANTITY_MAX} spots`)
    }
    checkAvailability(input.availability)
    if (input.description.length > DESCRIPTION_MAX) {
      throw invalid(
        'invalid_description',
        `The description can have up to ${DESCRIPTION_MAX} characters`,
      )
    }
    if (input.photoKeys.length < PHOTOS_MIN) {
      throw invalid('photos_required', `Add at least ${PHOTOS_MIN} photos`)
    }
    if (input.photoKeys.length > PHOTOS_MAX) {
      throw invalid('too_many_photos', `Add at most ${PHOTOS_MAX} photos`)
    }
    if (input.acceptHostTerms !== true) {
      throw invalid('terms_required', 'You must accept the host rules')
    }
  }

  return {
    find: (id: string): Space | undefined => entry(id)?.space,
    require(id: string): Space {
      const e = entry(id)
      if (!e) throw notFound('Space')
      return e.space
    },
    /** Spaces drivers can see and book. */
    active: (): Space[] =>
      everything()
        .filter((e) => e.meta.status === 'active')
        .map((e) => e.space),
    isActive: (id: string): boolean => entry(id)?.meta.status === 'active',
    quantityOf: (id: string): number => entry(id)?.meta.quantity ?? 1,
    availabilityOf: (id: string): Availability | null => entry(id)?.meta.availability ?? null,
    tariff(id: string): Tariff {
      const e = entry(id)
      if (!e) throw notFound('Space')
      return tariffOf(e)
    },
    venueIdOf: (id: string): string => entry(id)!.meta.venueId,
    hostIdOf: (id: string): string | null => entry(id)?.meta.hostId ?? null,
    addressOf(id: string): string {
      const { meta } = entry(id)!
      return `${meta.street}, ${meta.municipality}`
    },

    listFor: (userId: string): HostSpace[] =>
      everything()
        .filter((e) => e.meta.hostId === userId)
        .sort((a, b) => Date.parse(b.meta.createdAt) - Date.parse(a.meta.createdAt))
        .map(toHostSpace),
    idsFor: (userId: string): string[] =>
      everything()
        .filter((e) => e.meta.hostId === userId)
        .map((e) => e.space.id),

    create(userId: string, input: HostSpaceCreate, host: HostLabel): HostSpace {
      const venue = venues.find((v) => v.id === input.venueId)
      if (!venue) throw notFound('Venue')
      validateCreate(input, venue)

      const street = input.street.trim()
      const duplicate = everything().some(
        (e) =>
          e.meta.hostId === userId &&
          e.meta.venueId === venue.id &&
          e.meta.street.toLowerCase() === street.toLowerCase(),
      )
      if (duplicate) {
        throw new ApiError(409, 'duplicate_space', 'You already published a space at this address')
      }

      counter += 1
      const space: Space = {
        id: `host_${counter}`,
        title: autoTitle(input.features, input.quantity, input.neighborhood.trim()),
        neighborhood: input.neighborhood.trim(),
        location: input.location,
        distanceM: distanceM(input.location, venue.location),
        // Set from the tariff on every read (applyTariff).
        priceCentsPerHour: 0,
        zoneSurchargeCents: 0,
        rating: 0,
        reviewCount: 0,
        features: input.features,
        // The mock cannot keep real images; each upload is shown as an illustration.
        photoUrls: input.photoKeys.map((_, i) => `placeholder://${TONES[i % TONES.length]}`),
        available: true,
        description: input.description.trim(),
        dimensions: input.dimensions,
        vehicleTypes: suggestVehicleTypes(input.dimensions),
        host: { displayName: host.displayName, verified: true, memberSince: host.memberSince },
      }
      const stored: Stored = {
        space,
        meta: {
          venueId: venue.id,
          hostId: userId,
          status: 'pending_review',
          street,
          municipality: input.municipality,
          references: (input.references ?? '').trim(),
          reviewNote: null,
          createdAt: new Date(now()).toISOString(),
          reviewStartedAt: now(),
          quantity: input.quantity,
          availability: input.availability ?? null,
        },
      }
      hosted.push(stored)
      save()
      return toHostSpace(applyTariff(stored))
    },

    update(userId: string, id: string, patch: HostSpaceUpdate): HostSpace {
      const e = everything().find((x) => x.space.id === id && x.meta.hostId === userId)
      if (!e) throw notFound('Space')
      if (patch.status !== undefined) {
        if (e.meta.status !== 'active' && e.meta.status !== 'paused') {
          throw new ApiError(
            409,
            'not_editable',
            'A space under review or rejected cannot be paused or resumed',
          )
        }
        e.meta.status = patch.status
      }
      if (patch.availability !== undefined) {
        checkAvailability(patch.availability)
        e.meta.availability = patch.availability
      }
      save()
      return toHostSpace(e)
    },

    /** Test and demo control: how simulated back-office will answer the next reviews. */
    setReviewOutcome(next: 'active' | 'rejected') {
      reviewOutcome = next
    },
    /** Test and demo helper: skip the wait and approve everything pending. */
    approveAllNow() {
      for (const { meta } of hosted) {
        if (meta.status === 'pending_review') {
          meta.status = 'active'
          meta.reviewStartedAt = null
        }
      }
      save()
    },
  }
}

export type SpaceStore = ReturnType<typeof createSpaceStore>
