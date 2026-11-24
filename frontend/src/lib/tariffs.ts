import type { Municipality } from '../api/types'

/**
 * ParkApp sets the price, not the host (docs/decisiones.md, "Precios"). The server is the authority; the client uses
 * these only to show the host what they will earn before publishing.
 *
 * Total = rate × hours + $50 in a venue zone + 15 % commission + 16 % VAT on the commission.
 * Money is integer cents and percentages are basis points, so no step ever uses floats.
 *
 * PROVISIONAL AMOUNTS: the rates below are placeholders until the business defines them.
 */

/** Charged once per booking when the space is within a venue's radius. */
export const ZONE_SURCHARGE_CENTS = 5000
export const COMMISSION_BPS = 1500
export const VAT_BPS = 1600

export const VENUE_HOURLY_CENTS: Record<string, number> = {
  akron: 6000,
  jalisco: 5000,
  '3-de-marzo': 4000,
  telmex: 5000,
  'benito-juarez': 4000,
  'arena-vfg': 4000,
}

export const MUNICIPALITY_HOURLY_CENTS: Record<Municipality, number> = {
  Zapopan: 3000,
  Guadalajara: 2500,
  'San Pedro Tlaquepaque': 2000,
  'Tlajomulco de Zúñiga': 1800,
  Tonalá: 1500,
}

export interface Tariff {
  zone: 'venue' | 'municipality'
  hourlyCents: number
  zoneSurchargeCents: number
}

export function tariffFor(input: {
  venueId: string
  distanceM: number
  radiusM: number
  municipality: Municipality
}): Tariff {
  if (input.distanceM <= input.radiusM) {
    const hourlyCents = VENUE_HOURLY_CENTS[input.venueId]
    if (hourlyCents === undefined) throw new RangeError(`No tariff for venue ${input.venueId}`)
    return { zone: 'venue', hourlyCents, zoneSurchargeCents: ZONE_SURCHARGE_CENTS }
  }
  return {
    zone: 'municipality',
    hourlyCents: MUNICIPALITY_HOURLY_CENTS[input.municipality],
    zoneSurchargeCents: 0,
  }
}

/** `bps` basis points of `cents`, rounded half up, in integer arithmetic. */
export function percentOf(cents: number, bps: number): number {
  return Math.floor((cents * bps + 5000) / 10_000)
}

export interface PriceBreakdown {
  /** Rate × hours. */
  rentCents: number
  zoneSurchargeCents: number
  /** Rent + zone charge: what the host is paid. */
  subtotalCents: number
  commissionCents: number
  /** VAT on the commission. */
  vatCents: number
  totalCents: number
}

export function priceBooking(
  tariff: Pick<Tariff, 'hourlyCents' | 'zoneSurchargeCents'>,
  hours: number,
): PriceBreakdown {
  if (!Number.isInteger(hours) || hours < 1) {
    throw new RangeError(`Bookings are whole hours, got ${hours}`)
  }
  const rentCents = tariff.hourlyCents * hours
  const subtotalCents = rentCents + tariff.zoneSurchargeCents
  const commissionCents = percentOf(subtotalCents, COMMISSION_BPS)
  const vatCents = percentOf(commissionCents, VAT_BPS)
  return {
    rentCents,
    zoneSurchargeCents: tariff.zoneSurchargeCents,
    subtotalCents,
    commissionCents,
    vatCents,
    totalCents: subtotalCents + commissionCents + vatCents,
  }
}
