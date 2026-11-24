import { describe, expect, it } from 'vitest'
import {
  COMMISSION_BPS,
  MUNICIPALITY_HOURLY_CENTS,
  VAT_BPS,
  VENUE_HOURLY_CENTS,
  ZONE_SURCHARGE_CENTS,
  percentOf,
  priceBooking,
  tariffFor,
} from './tariffs'

describe('tariffs', () => {
  it('match the business model: 15 % commission, 16 % VAT, $50 venue-zone charge', () => {
    expect(COMMISSION_BPS).toBe(1500)
    expect(VAT_BPS).toBe(1600)
    expect(ZONE_SURCHARGE_CENTS).toBe(5000)
  })

  it('have an integer hourly rate for every venue and municipality', () => {
    for (const cents of [
      ...Object.values(VENUE_HOURLY_CENTS),
      ...Object.values(MUNICIPALITY_HOURLY_CENTS),
    ]) {
      expect(Number.isSafeInteger(cents)).toBe(true)
      expect(cents).toBeGreaterThan(0)
    }
  })

  it('make Tonalá cheaper than Zapopan', () => {
    expect(MUNICIPALITY_HOURLY_CENTS['Tonalá']).toBeLessThan(MUNICIPALITY_HOURLY_CENTS.Zapopan)
  })
})

describe('tariffFor', () => {
  it('uses the venue rate and the zone charge within the venue radius', () => {
    expect(
      tariffFor({ venueId: 'akron', distanceM: 2999, radiusM: 3000, municipality: 'Zapopan' }),
    ).toEqual({
      zone: 'venue',
      hourlyCents: VENUE_HOURLY_CENTS.akron,
      zoneSurchargeCents: ZONE_SURCHARGE_CENTS,
    })
  })

  it('counts the radius edge as inside the zone', () => {
    expect(
      tariffFor({ venueId: 'jalisco', distanceM: 3000, radiusM: 3000, municipality: 'Guadalajara' })
        .zone,
    ).toBe('venue')
  })

  it('falls back to the municipality rate, with no zone charge, outside the radius', () => {
    expect(
      tariffFor({ venueId: 'akron', distanceM: 3001, radiusM: 3000, municipality: 'Tonalá' }),
    ).toEqual({
      zone: 'municipality',
      hourlyCents: MUNICIPALITY_HOURLY_CENTS['Tonalá'],
      zoneSurchargeCents: 0,
    })
  })

  it('rejects an unknown venue', () => {
    expect(() =>
      tariffFor({ venueId: 'nope', distanceM: 10, radiusM: 3000, municipality: 'Zapopan' }),
    ).toThrow(RangeError)
  })
})

describe('percentOf', () => {
  it('rounds half up using integers only', () => {
    expect(percentOf(10_000, 1500)).toBe(1500)
    expect(percentOf(333, 1500)).toBe(50) // 49.95 -> 50
    expect(percentOf(330, 1500)).toBe(50) // 49.5 -> 50
    expect(percentOf(329, 1500)).toBe(49) // 49.35 -> 49
    expect(percentOf(0, 1600)).toBe(0)
  })
})

describe('priceBooking', () => {
  it('applies: rate × hours + zone charge + 15 % commission + 16 % VAT on the commission', () => {
    // $60/h for 3 h = $180, + $50 = $230; commission $34.50; VAT on it $5.52; total $270.02
    expect(priceBooking({ hourlyCents: 6000, zoneSurchargeCents: 5000 }, 3)).toEqual({
      rentCents: 18000,
      zoneSurchargeCents: 5000,
      subtotalCents: 23000,
      commissionCents: 3450,
      vatCents: 552,
      totalCents: 27002,
    })
  })

  it('has no zone charge outside a venue zone', () => {
    const p = priceBooking({ hourlyCents: 2500, zoneSurchargeCents: 0 }, 2)
    expect(p).toMatchObject({ rentCents: 5000, zoneSurchargeCents: 0, subtotalCents: 5000 })
    expect(p.totalCents).toBe(5000 + 750 + 120)
  })

  it('always adds up to the total in integer cents', () => {
    for (const hourly of [1500, 2500, 4333, 6000]) {
      for (const hours of [1, 2, 5, 24]) {
        const p = priceBooking({ hourlyCents: hourly, zoneSurchargeCents: 5000 }, hours)
        for (const v of Object.values(p)) expect(Number.isSafeInteger(v)).toBe(true)
        expect(p.subtotalCents + p.commissionCents + p.vatCents).toBe(p.totalCents)
      }
    }
  })

  it('only takes whole hours', () => {
    expect(() => priceBooking({ hourlyCents: 6000, zoneSurchargeCents: 0 }, 1.5)).toThrow(
      RangeError,
    )
    expect(() => priceBooking({ hourlyCents: 6000, zoneSurchargeCents: 0 }, 0)).toThrow(RangeError)
  })
})
