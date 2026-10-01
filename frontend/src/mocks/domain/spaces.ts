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
  PRICE_MAX_CENTS,
  PRICE_MIN_CENTS,
  STREET_MIN,
  TITLE_MAX,
  TITLE_MIN,
  MUNICIPALITIES,
  VEHICLE_TYPES,
  dimensionsInRange,
} from '../../lib/hostRules'
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

  const everything = (): Stored[] => {
    settle()
    return [...seeded, ...hosted]
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
      photoUrls: space.photoUrls,
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
    if (
      input.vehicleTypes.length === 0 ||
      !input.vehicleTypes.every((t) => VEHICLE_TYPES.includes(t))
    ) {
      throw invalid('vehicle_types_required', 'Pick at least one type of car that fits')
    }
    const title = input.title.trim()
    if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
      throw invalid('invalid_title', `The title needs ${TITLE_MIN} to ${TITLE_MAX} characters`)
    }
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
    if (
      !Number.isInteger(input.priceCentsPerHour) ||
      input.priceCentsPerHour < PRICE_MIN_CENTS ||
      input.priceCentsPerHour > PRICE_MAX_CENTS
    ) {
      throw invalid('invalid_price', 'The price per hour is out of range')
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
        title: input.title.trim(),
        neighborhood: input.neighborhood.trim(),
        location: input.location,
        distanceM: distanceM(input.location, venue.location),
        priceCentsPerHour: input.priceCentsPerHour,
        rating: 0,
        reviewCount: 0,
        features: input.features,
        // The mock cannot keep real images; each upload is shown as an illustration.
        photoUrls: input.photoKeys.map((_, i) => `placeholder://${TONES[i % TONES.length]}`),
        available: true,
        description: input.description.trim(),
        dimensions: input.dimensions,
        vehicleTypes: input.vehicleTypes,
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
        },
      }
      hosted.push(stored)
      save()
      return toHostSpace(stored)
    },

    update(userId: string, id: string, patch: HostSpaceUpdate): HostSpace {
      const e = everything().find((x) => x.space.id === id && x.meta.hostId === userId)
      if (!e) throw notFound('Space')
      if (patch.priceCentsPerHour !== undefined) {
        const p = patch.priceCentsPerHour
        if (!Number.isInteger(p) || p < PRICE_MIN_CENTS || p > PRICE_MAX_CENTS) {
          throw invalid('invalid_price', 'The price per hour is out of range')
        }
      }
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
      if (patch.priceCentsPerHour !== undefined) e.space.priceCentsPerHour = patch.priceCentsPerHour
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
