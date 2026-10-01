import type { HostSpaceCreate, Venue } from '../../api/types'
import { distanceM } from '../../lib/geo'
import {
  DESCRIPTION_MAX,
  DIMENSION_LIMITS,
  MUNICIPALITIES,
  PHOTOS_MAX,
  PHOTOS_MIN,
  PRICE_MAX_CENTS,
  PRICE_MIN_CENTS,
  STREET_MIN,
  TITLE_MAX,
  TITLE_MIN,
  dimensionsInRange,
} from '../../lib/hostRules'
import { parsePesosToCents } from '../../lib/money'
import type { HostDraft } from './draft'

export type HostStep = 'location' | 'size' | 'photos' | 'price'
export const HOST_STEPS: HostStep[] = ['location', 'size', 'photos', 'price']

/** A problem with one field, with an error code that has a translation under `errors.code`. */
export interface FieldProblem {
  field: string
  code: string
}

const toInt = (value: string) => (/^\d{1,4}$/.test(value.trim()) ? Number(value) : NaN)

export function dimensionsOf(draft: HostDraft) {
  return {
    lengthCm: toInt(draft.lengthCm),
    widthCm: toInt(draft.widthCm),
    heightCm: toInt(draft.heightCm),
  }
}

/** The first problem in the "where" step, or null. The server checks the same rules again on publish. */
export function validateLocation(draft: HostDraft, venue: Venue | undefined): FieldProblem | null {
  if (!venue) return { field: 'venue', code: 'venue_required' }
  if (draft.street.trim().length < STREET_MIN) return { field: 'street', code: 'invalid_address' }
  if (draft.neighborhood.trim().length < 2)
    return { field: 'neighborhood', code: 'invalid_address' }
  if (!draft.municipality || !MUNICIPALITIES.includes(draft.municipality)) {
    return { field: 'municipality', code: 'invalid_municipality' }
  }
  if (!draft.location) return { field: 'location', code: 'location_required' }
  if (distanceM(draft.location, venue.location) > venue.radiusM) {
    return { field: 'location', code: 'outside_radius' }
  }
  return null
}

export function validateSize(draft: HostDraft): FieldProblem | null {
  const d = dimensionsOf(draft)
  for (const [field, key] of [
    ['length', 'lengthCm'],
    ['width', 'widthCm'],
    ['height', 'heightCm'],
  ] as const) {
    const { min, max } = DIMENSION_LIMITS[key]
    if (!(d[key] >= min && d[key] <= max)) return { field, code: 'invalid_dimensions' }
  }
  if (!dimensionsInRange(d)) return { field: 'length', code: 'invalid_dimensions' }
  if (draft.vehicleTypes.length === 0) return { field: 'types', code: 'vehicle_types_required' }
  return null
}

export function validatePhotos(draft: HostDraft): FieldProblem | null {
  const title = draft.title.trim()
  if (draft.photos.length < PHOTOS_MIN) return { field: 'photos', code: 'photos_required' }
  if (draft.photos.length > PHOTOS_MAX) return { field: 'photos', code: 'too_many_photos' }
  if (title.length < TITLE_MIN || title.length > TITLE_MAX) {
    return { field: 'title', code: 'invalid_title' }
  }
  if (draft.description.length > DESCRIPTION_MAX) {
    return { field: 'description', code: 'invalid_description' }
  }
  return null
}

export function validatePrice(draft: HostDraft): FieldProblem | null {
  const cents = parsePesosToCents(draft.price)
  if (cents === null || cents < PRICE_MIN_CENTS || cents > PRICE_MAX_CENTS) {
    return { field: 'price', code: 'invalid_price' }
  }
  if (!draft.acceptTerms) return { field: 'terms', code: 'terms_required' }
  return null
}

export function validateStep(
  step: HostStep,
  draft: HostDraft,
  venue: Venue | undefined,
): FieldProblem | null {
  switch (step) {
    case 'location':
      return validateLocation(draft, venue)
    case 'size':
      return validateSize(draft)
    case 'photos':
      return validatePhotos(draft)
    case 'price':
      return validatePrice(draft)
  }
}

/** The first step that still has a problem, so a deep link or a reload cannot skip ahead. */
export function firstIncompleteStep(draft: HostDraft, venue: Venue | undefined): HostStep | null {
  return HOST_STEPS.find((s) => validateStep(s, draft, venue) !== null) ?? null
}

/** Turns a complete draft into the request body, or null if any number does not parse. */
export function buildCreateInput(draft: HostDraft): HostSpaceCreate | null {
  const priceCentsPerHour = parsePesosToCents(draft.price)
  const dimensions = dimensionsOf(draft)
  if (priceCentsPerHour === null || !draft.location || !draft.municipality) return null
  return {
    venueId: draft.venueId,
    street: draft.street.trim(),
    neighborhood: draft.neighborhood.trim(),
    municipality: draft.municipality,
    references: draft.references.trim(),
    location: draft.location,
    dimensions,
    vehicleTypes: draft.vehicleTypes,
    features: draft.features,
    title: draft.title.trim(),
    description: draft.description.trim(),
    photoKeys: draft.photos.map((p) => p.key),
    priceCentsPerHour,
    acceptHostTerms: draft.acceptTerms,
  }
}

/** Which step to send the host back to when the server rejects something at publish time. */
const STEP_OF_CODE: Record<string, HostStep> = {
  invalid_address: 'location',
  invalid_municipality: 'location',
  outside_radius: 'location',
  duplicate_space: 'location',
  invalid_dimensions: 'size',
  vehicle_types_required: 'size',
  invalid_title: 'photos',
  invalid_description: 'photos',
  photos_required: 'photos',
  too_many_photos: 'photos',
  invalid_price: 'price',
  terms_required: 'price',
}

export const stepForErrorCode = (code: string): HostStep | null => STEP_OF_CODE[code] ?? null
