import type { Review, Space, SpaceFeature, Venue, VenueEvent } from '../../api/types'
import { localToUtcIso, APP_TIME_ZONE } from '../../lib/time'
import { offsetPoint } from './geo'

/**
 * Sample data. Venue names come from the project spec; coordinates are APPROXIMATE
 * and must be verified before production (see docs/decisiones.md D-014).
 */
export const venues: Venue[] = [
  {
    id: 'akron',
    name: 'Estadio Akron',
    area: 'Zapopan',
    location: { lat: 20.6817, lng: -103.4626 },
    radiusM: 3000,
  },
  {
    id: 'jalisco',
    name: 'Estadio Jalisco',
    area: 'Guadalajara',
    location: { lat: 20.7058, lng: -103.3277 },
    radiusM: 3000,
  },
  {
    id: 'telmex',
    name: 'Auditorio Telmex',
    area: 'Zapopan',
    location: { lat: 20.7347, lng: -103.4565 },
    radiusM: 3000,
  },
  {
    id: 'benito-juarez',
    name: 'Auditorio Benito Juárez',
    area: 'Guadalajara',
    location: { lat: 20.6786, lng: -103.356 },
    radiusM: 3000,
  },
  {
    id: 'arena-vfg',
    name: 'Arena VFG',
    area: 'Guadalajara',
    location: { lat: 20.659, lng: -103.401 },
    radiusM: 3000,
  },
]

type SpaceTemplate = {
  title: string
  features: SpaceFeature[]
  vehicleTypes: Space['vehicleTypes']
  dimensions: Space['dimensions']
  description: string
  tone: 'day' | 'dusk' | 'night'
}

const templates: SpaceTemplate[] = [
  {
    title: 'Cochera con portón eléctrico',
    features: ['gate', 'camera'],
    vehicleTypes: ['compact', 'sedan', 'suv'],
    dimensions: { lengthCm: 520, widthCm: 300, heightCm: 230 },
    description:
      'Cochera privada con portón eléctrico y cámara. Cabe un auto grande con espacio para abrir las puertas.',
    tone: 'day',
  },
  {
    title: 'Cajón techado para auto compacto',
    features: ['covered'],
    vehicleTypes: ['compact', 'sedan'],
    dimensions: { lengthCm: 450, widthCm: 250, heightCm: 210 },
    description: 'Cajón techado junto a la entrada. Ideal para un auto compacto o sedán.',
    tone: 'dusk',
  },
  {
    title: 'Espacio amplio para camioneta',
    features: ['covered', 'gate'],
    vehicleTypes: ['sedan', 'suv', 'pickup'],
    dimensions: { lengthCm: 600, widthCm: 320, heightCm: 250 },
    description: 'Espacio amplio y techado, con altura suficiente para camionetas y pick-ups.',
    tone: 'night',
  },
  {
    title: 'Cajón en esquina con entrada fácil',
    features: ['lit'],
    vehicleTypes: ['compact', 'sedan', 'suv'],
    dimensions: { lengthCm: 500, widthCm: 280, heightCm: 400 },
    description: 'Cajón al aire libre en esquina, con buena iluminación y maniobra sencilla.',
    tone: 'day',
  },
  {
    title: 'Cochera doble con cámara',
    features: ['camera', 'gate', 'lit'],
    vehicleTypes: ['compact', 'sedan', 'suv'],
    dimensions: { lengthCm: 540, widthCm: 520, heightCm: 240 },
    description: 'Cochera doble vigilada por cámara. Se renta por lugar, no completa.',
    tone: 'dusk',
  },
  {
    title: 'Cajón con cargador eléctrico',
    features: ['ev_charger', 'covered'],
    vehicleTypes: ['compact', 'sedan', 'suv'],
    dimensions: { lengthCm: 520, widthCm: 290, heightCm: 230 },
    description: 'Cajón techado con cargador para auto eléctrico. Lleva tu propio cable.',
    tone: 'night',
  },
]

const hosts = ['Marisol R.', 'Héctor V.', 'Alejandra P.', 'Jorge T.', 'Daniela C.', 'Luis M.']
const distances = [320, 480, 760, 1150, 1700, 2400]
const bearings = [20, 95, 160, 230, 300, 340]
const prices = [7500, 5000, 9000, 4500, 6500, 8500]
const ratings = [4.9, 4.7, 4.8, 4.5, 4.6, 4.9]
const reviewCounts = [128, 64, 31, 12, 47, 22]

export function buildSpaces(): Space[] {
  return venues.flatMap((venue, v) =>
    templates.map((t, i) => {
      const dist = distances[(i + v) % distances.length]!
      return {
        id: `${venue.id}-${i + 1}`,
        title: t.title,
        neighborhood: `Zona ${venue.name}`,
        location: offsetPoint(venue.location, dist, (bearings[i]! + v * 37) % 360),
        // Recomputed from coordinates at request time; kept only to satisfy the type.
        distanceM: dist,
        priceCentsPerHour: prices[(i + v) % prices.length]!,
        rating: ratings[(i + v) % ratings.length]!,
        reviewCount: reviewCounts[(i + v) % reviewCounts.length]!,
        features: t.features,
        photoUrls: [`placeholder://${t.tone}`],
        available: true,
        description: t.description,
        dimensions: t.dimensions,
        vehicleTypes: t.vehicleTypes,
        host: {
          displayName: hosts[(i + v) % hosts.length]!,
          verified: (i + v) % 3 !== 2,
          memberSince: `202${3 + ((i + v) % 3)}-0${1 + ((i + v) % 9)}-15`,
        },
      }
    }),
  )
}

const comments = [
  ['Llegué con tiempo y el lugar estaba libre. El anfitrión muy atento.', 5],
  ['Fácil de encontrar y a pocos minutos a pie del recinto.', 5],
  ['Buen lugar, aunque la maniobra es un poco justa con camioneta.', 4],
  ['Tal como en las fotos. Salí sin problema después del evento.', 5],
  ['Todo bien, pero el portón tardó un poco en abrir.', 4],
] as const
const authors = ['Carla', 'Iván', 'Sofía', 'Mauricio', 'Renata']

export function buildReviews(spaceId: string, count: number, now: number): Review[] {
  const n = Math.min(count, comments.length)
  return Array.from({ length: n }, (_, i) => ({
    id: `${spaceId}-r${i + 1}`,
    authorName: authors[i % authors.length]!,
    rating: comments[i]![1],
    comment: comments[i]![0],
    createdAt: new Date(now - (i + 1) * 9 * 86_400_000).toISOString(),
  }))
}

const eventTitles = ['Concierto de ejemplo', 'Partido de ejemplo', 'Espectáculo de ejemplo']

/** Three upcoming events per venue, always in the future relative to `now`, at 20:00 Mexico City time. */
export function buildEvents(now: number): VenueEvent[] {
  const day = (n: number) =>
    new Intl.DateTimeFormat('en-CA', { timeZone: APP_TIME_ZONE }).format(
      new Date(now + n * 86_400_000),
    )
  return venues.flatMap((venue, v) =>
    [4 + v, 9 + v, 16 + v].map((offset, i) => {
      const date = day(offset)
      return {
        id: `${venue.id}-e${i + 1}`,
        venueId: venue.id,
        title: eventTitles[i]!,
        startsAt: localToUtcIso(date, '20:00'),
        endsAt: localToUtcIso(date, '23:30'),
      }
    }),
  )
}
