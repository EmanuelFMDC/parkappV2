export type LotFeature = 'covered' | 'ev' | 'secure'

export interface Lot {
  id: string
  name: string
  address: string
  pricePerHour: number
  distanceM: number
  walkMin: number
  free: number
  total: number
  rating: number
  features: LotFeature[]
  open24: boolean
  /** Position on the stylised map, in percent. */
  map: { x: number; y: number }
}

export const lots: Lot[] = [
  {
    id: 'reforma-222',
    name: 'Reforma 222',
    address: 'Paseo de la Reforma 222, Juárez',
    pricePerHour: 48,
    distanceM: 150,
    walkMin: 2,
    free: 34,
    total: 180,
    rating: 4.7,
    features: ['covered', 'secure', 'ev'],
    open24: true,
    map: { x: 34, y: 38 },
  },
  {
    id: 'glorieta-insurgentes',
    name: 'Glorieta Insurgentes',
    address: 'Av. Insurgentes Sur 300, Roma Norte',
    pricePerHour: 36,
    distanceM: 420,
    walkMin: 6,
    free: 9,
    total: 90,
    rating: 4.4,
    features: ['secure'],
    open24: false,
    map: { x: 62, y: 28 },
  },
  {
    id: 'plaza-rio',
    name: 'Plaza Río',
    address: 'Río Tiber 88, Cuauhtémoc',
    pricePerHour: 29,
    distanceM: 680,
    walkMin: 9,
    free: 0,
    total: 60,
    rating: 4.1,
    features: [],
    open24: false,
    map: { x: 24, y: 66 },
  },
  {
    id: 'torre-norte',
    name: 'Torre Norte',
    address: 'Bucareli 61, Centro',
    pricePerHour: 42,
    distanceM: 900,
    walkMin: 12,
    free: 51,
    total: 240,
    rating: 4.8,
    features: ['covered', 'ev', 'secure'],
    open24: true,
    map: { x: 72, y: 64 },
  },
]

export const SERVICE_FEE = 8

export function getLot(id: string | undefined) {
  return lots.find((l) => l.id === id)
}
