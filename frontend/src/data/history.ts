export interface Visit {
  id: string
  lotName: string
  /** ISO date */
  date: string
  minutes: number
  total: number
  status: 'completed' | 'cancelled'
}

export const visits: Visit[] = [
  { id: 'v1', lotName: 'Reforma 222', date: '2026-09-27T09:10:00', minutes: 210, total: 176, status: 'completed' },
  { id: 'v2', lotName: 'Torre Norte', date: '2026-09-22T18:30:00', minutes: 95, total: 77, status: 'completed' },
  { id: 'v3', lotName: 'Plaza Río', date: '2026-09-19T13:00:00', minutes: 0, total: 0, status: 'cancelled' },
  { id: 'v4', lotName: 'Glorieta Insurgentes', date: '2026-09-11T20:05:00', minutes: 130, total: 86, status: 'completed' },
]
