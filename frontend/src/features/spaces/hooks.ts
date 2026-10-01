import { useQuery } from '@tanstack/react-query'
import { useApi } from '../../api/context'
import { AVAILABILITY_POLL_MS } from '../../api/polling'
import { unwrap } from '../../api/unwrap'

export interface TimeWindow {
  startsAt: string
  endsAt: string
}

/** Spaces near a venue with availability for the window. Polls so taken spaces disappear without WebSockets. */
export function useSpaces(venueId: string | undefined, window: TimeWindow | null) {
  const api = useApi()
  return useQuery({
    queryKey: ['spaces', venueId, window?.startsAt, window?.endsAt],
    enabled: Boolean(venueId && window),
    refetchInterval: AVAILABILITY_POLL_MS,
    queryFn: async () =>
      (
        await unwrap(
          api.GET('/api/venues/{venueId}/spaces', {
            params: { path: { venueId: venueId! }, query: window! },
          }),
        )
      ).items,
  })
}

export function useSpace(spaceId: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: ['space', spaceId],
    enabled: Boolean(spaceId),
    retry: false,
    queryFn: () =>
      unwrap(api.GET('/api/spaces/{spaceId}', { params: { path: { spaceId: spaceId! } } })),
  })
}

export function useReviews(spaceId: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: ['space', spaceId, 'reviews'],
    enabled: Boolean(spaceId),
    queryFn: async () =>
      (
        await unwrap(
          api.GET('/api/spaces/{spaceId}/reviews', { params: { path: { spaceId: spaceId! } } }),
        )
      ).items,
  })
}

export function useQuote(spaceId: string | undefined, window: TimeWindow | null) {
  const api = useApi()
  return useQuery({
    queryKey: ['quote', spaceId, window?.startsAt, window?.endsAt],
    enabled: Boolean(spaceId && window),
    retry: false,
    queryFn: () =>
      unwrap(
        api.GET('/api/spaces/{spaceId}/quote', {
          params: { path: { spaceId: spaceId! }, query: window! },
        }),
      ),
  })
}
