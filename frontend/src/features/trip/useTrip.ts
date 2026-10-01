import { useMemo } from 'react'
import { useSearchParams } from 'react-router-dom'
import type { TimeWindow } from '../spaces/hooks'

export interface Trip {
  venueId: string | undefined
  /** `null` when the URL has no valid window (missing, unparsable, or end before start). */
  window: TimeWindow | null
}

const isIso = (value: string | null): value is string =>
  Boolean(value) && !Number.isNaN(Date.parse(value!))

/** The trip (venue + time window) lives in the URL, so back/forward, reloads and shared links all work. */
export function useTrip(): Trip {
  const [params] = useSearchParams()
  const venueId = params.get('venue') ?? undefined
  const from = params.get('from')
  const to = params.get('to')
  return useMemo(() => {
    const valid = isIso(from) && isIso(to) && Date.parse(to) > Date.parse(from)
    return { venueId, window: valid ? { startsAt: from, endsAt: to } : null }
  }, [venueId, from, to])
}

export function tripSearch(trip: { venueId?: string; startsAt: string; endsAt: string }): string {
  const params = new URLSearchParams()
  if (trip.venueId) params.set('venue', trip.venueId)
  params.set('from', trip.startsAt)
  params.set('to', trip.endsAt)
  return `?${params.toString()}`
}
