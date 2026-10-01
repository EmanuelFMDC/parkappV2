import type { Venue } from '../api/types'
import type { PhotoTone } from '../components/ui'

export interface SampleSpace {
  id: 'gate' | 'covered' | 'suv' | 'corner'
  priceCents: number
  rating: number
  reviewCount: number
  distanceM: number
  tags: Array<'covered' | 'gate' | 'camera'>
  tone: PhotoTone
  /** Position on the sample map, percent. */
  x: number
  y: number
}

/** Placeholder data for the style guide only. Real spaces come from the API. */
export const sampleSpaces: SampleSpace[] = [
  {
    id: 'gate',
    priceCents: 7500,
    rating: 4.9,
    reviewCount: 128,
    distanceM: 350,
    tags: ['gate', 'camera'],
    tone: 'day',
    x: 38,
    y: 36,
  },
  {
    id: 'covered',
    priceCents: 5000,
    rating: 4.7,
    reviewCount: 64,
    distanceM: 620,
    tags: ['covered'],
    tone: 'dusk',
    x: 70,
    y: 30,
  },
  {
    id: 'suv',
    priceCents: 9000,
    rating: 4.8,
    reviewCount: 31,
    distanceM: 900,
    tags: ['covered', 'gate'],
    tone: 'night',
    x: 26,
    y: 66,
  },
  {
    id: 'corner',
    priceCents: 4500,
    rating: 4.5,
    reviewCount: 12,
    distanceM: 1400,
    tags: [],
    tone: 'day',
    x: 74,
    y: 68,
  },
]

export const VENUE_POSITION = { x: 52, y: 52 }

/** A venue for the host map demos. The name is translated where it is used. */
export function sampleVenue(name: string): Venue {
  return {
    id: 'sample',
    name,
    area: 'Zapopan',
    location: { lat: 20.6817, lng: -103.4627 },
    radiusM: 3000,
  }
}
