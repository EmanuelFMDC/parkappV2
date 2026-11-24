import type { HostSpaceCreate, Venue } from '../../api/types'
import { distanceM } from '../../lib/geo'
import {
  DESCRIPTION_MAX,
  DIMENSION_LIMITS,
  MUNICIPALITIES,
  PHOTOS_MAX,
  PHOTOS_MIN,
  STREET_MIN,
  QUANTITY_MAX,
  QUANTITY_MIN,
  dimensionsInRange,
  suggestVehicleTypes,
} from '../../lib/hostRules'
import { validAvailability } from '../../lib/availability'
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
  if (suggestVehicleTypes(d).length === 0) return { field: 'length', code: 'fits_no_car' }
  const quantity = toInt(draft.quantity)
  if (!(quantity >= QUANTITY_MIN && quantity <= QUANTITY_MAX)) {
    return { field: 'quantity', code: 'invalid_quantity' }
  }
  return null
}

export function validatePhotos(draft: HostDraft): FieldProblem | null {
  if (draft.photos.length < PHOTOS_MIN) return { field: 'photos', code: 'photos_required' }
  if (draft.photos.length > PHOTOS_MAX) return { field: 'photos', code: 'too_many_photos' }
  if (draft.description.length > DESCRIPTION_MAX) {
    return { field: 'description', code: 'invalid_description' }
  }
  return null
}

/** The last step: when the host rents it, and the host rules with the right-to-rent declaration. */
export function validatePrice(draft: HostDraft): FieldProblem | null {
  if (draft.availability && !validAvailability(draft.availability)) {
    return { field: 'availability', code: 'invalid_availability' }
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

/** Turns a complete draft into the request body, or null if something required is missing. */
export function buildCreateInput(draft: HostDraft): HostSpaceCreate | null {
  const dimensions = dimensionsOf(draft)
  if (!draft.location || !draft.municipality) return null
  return {
    venueId: draft.venueId,
    street: draft.street.trim(),
    neighborhood: draft.neighborhood.trim(),
    municipality: draft.municipality,
    location: draft.location,
    dimensions,
    features: draft.features,
    description: draft.description.trim(),
    photoKeys: draft.photos.map((p) => p.key),
    quantity: toInt(draft.quantity),
    availability: draft.availability,
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
  fits_no_car: 'size',
  invalid_quantity: 'size',
  invalid_availability: 'price',
  invalid_description: 'photos',
  photos_required: 'photos',
  too_many_photos: 'photos',
  terms_required: 'price',
}

export const stepForErrorCode = (code: string): HostStep | null => STEP_OF_CODE[code] ?? null
