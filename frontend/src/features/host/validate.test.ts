import { describe, expect, it } from 'vitest'
import type { Venue } from '../../api/types'
import { offsetPoint } from '../../lib/geo'
import { EMPTY_DRAFT, type HostDraft } from './draft'
import {
  buildCreateInput,
  firstIncompleteStep,
  stepForErrorCode,
  validateLocation,
  validatePhotos,
  validatePrice,
  validateSize,
} from './validate'

const venue: Venue = {
  id: 'akron',
  name: 'Estadio Akron',
  area: 'Zapopan',
  location: { lat: 20.6817, lng: -103.4626 },
  radiusM: 3000,
}

const complete: HostDraft = {
  ...EMPTY_DRAFT,
  venueId: 'akron',
  street: 'Av. Patria 1234',
  neighborhood: 'Jardines Universidad',
  municipality: 'Zapopan',
  location: offsetPoint(venue.location, 600, 90),
  lengthCm: '520',
  widthCm: '300',
  heightCm: '230',
  photos: [
    { key: 'a', name: 'a.jpg' },
    { key: 'b', name: 'b.jpg' },
    { key: 'c', name: 'c.jpg' },
  ],
  quantity: '1',
  availability: null,
  acceptTerms: true,
}

const code = (p: ReturnType<typeof validateLocation>) => p?.code ?? null

describe('validateLocation', () => {
  it('accepts a complete location', () => {
    expect(validateLocation(complete, venue)).toBeNull()
  })

  it.each([
    ['no venue yet', { ...complete }, undefined, 'venue_required'],
    ['a short street', { ...complete, street: 'Av' }, venue, 'invalid_address'],
    ['no neighborhood', { ...complete, neighborhood: ' ' }, venue, 'invalid_address'],
    ['no municipality', { ...complete, municipality: '' as const }, venue, 'invalid_municipality'],
    ['no pin', { ...complete, location: null }, venue, 'location_required'],
    [
      'a pin beyond the radius',
      { ...complete, location: offsetPoint(venue.location, 3500, 0) },
      venue,
      'outside_radius',
    ],
  ])('rejects %s', (_name, draft, v, expected) => {
    expect(code(validateLocation(draft, v))).toBe(expected)
  })

  it('accepts a pin right at the edge of the radius', () => {
    const edge = { ...complete, location: offsetPoint(venue.location, 2990, 45) }
    expect(validateLocation(edge, venue)).toBeNull()
  })
})

describe('validateSize', () => {
  it('accepts realistic dimensions with at least one car type', () => {
    expect(validateSize(complete)).toBeNull()
  })

  it.each([
    ['empty length', { lengthCm: '' }, 'length'],
    ['text in the width', { widthCm: 'ancho' }, 'width'],
    ['a decimal height', { heightCm: '2.3' }, 'height'],
    ['a width that is too big', { widthCm: '900' }, 'width'],
  ])('rejects %s', (_name, over, field) => {
    expect(validateSize({ ...complete, ...over })).toEqual({ field, code: 'invalid_dimensions' })
  })

  it('needs measurements where at least one standard car fits', () => {
    expect(
      validateSize({ ...complete, lengthCm: '300', widthCm: '200', heightCm: '180' })?.code,
    ).toBe('fits_no_car')
  })

  it.each([
    ['0', 'invalid_quantity'],
    ['21', 'invalid_quantity'],
    ['1.5', 'invalid_quantity'],
    ['', 'invalid_quantity'],
    ['1', null],
    ['20', null],
  ])('quantity %j -> %j', (quantity, expected) => {
    expect(validateSize({ ...complete, quantity })?.code ?? null).toBe(expected)
  })
})

describe('validatePhotos', () => {
  it('accepts three photos; ParkApp writes the title', () => {
    expect(validatePhotos(complete)).toBeNull()
  })

  it('needs 3 to 8 photos', () => {
    expect(validatePhotos({ ...complete, photos: complete.photos.slice(0, 2) })?.code).toBe(
      'photos_required',
    )
    const nine = Array.from({ length: 9 }, (_, i) => ({ key: `k${i}`, name: `${i}.jpg` }))
    expect(validatePhotos({ ...complete, photos: nine })?.code).toBe('too_many_photos')
  })

  it('needs a description of at most 500 characters', () => {
    expect(validatePhotos({ ...complete, description: 'x'.repeat(501) })?.code).toBe(
      'invalid_description',
    )
  })
})

describe('validatePrice', () => {
  it('passes once the host rules are accepted (ParkApp sets the price)', () => {
    expect(validatePrice(complete)).toBeNull()
  })

  it('needs the host rules accepted', () => {
    expect(validatePrice({ ...complete, acceptTerms: false })?.code).toBe('terms_required')
  })
})

describe('firstIncompleteStep', () => {
  it('is null for a complete draft', () => {
    expect(firstIncompleteStep(complete, venue)).toBeNull()
  })

  it('finds the first step with a problem, so nobody skips ahead', () => {
    expect(firstIncompleteStep(EMPTY_DRAFT, venue)).toBe('location')
    expect(firstIncompleteStep({ ...complete, lengthCm: '' }, venue)).toBe('size')
    expect(firstIncompleteStep({ ...complete, photos: [] }, venue)).toBe('photos')
    expect(firstIncompleteStep({ ...complete, acceptTerms: false }, venue)).toBe('price')
  })
})

describe('buildCreateInput', () => {
  it('builds the request in centimeters, without a price', () => {
    const input = buildCreateInput(complete)!
    expect(input).not.toHaveProperty('priceCentsPerHour')
    expect(input.dimensions).toEqual({ lengthCm: 520, widthCm: 300, heightCm: 230 })
    expect(input.photoKeys).toEqual(['a', 'b', 'c'])
    expect(input.acceptHostTerms).toBe(true)
  })

  it('returns null without a pin', () => {
    expect(buildCreateInput({ ...complete, location: null })).toBeNull()
  })
})

describe('stepForErrorCode', () => {
  it.each([
    ['outside_radius', 'location'],
    ['duplicate_space', 'location'],
    ['invalid_dimensions', 'size'],
    ['photos_required', 'photos'],
    ['unknown_thing', null],
  ])('%s belongs to %s', (errorCode, step) => {
    expect(stepForErrorCode(errorCode)).toBe(step)
  })
})
