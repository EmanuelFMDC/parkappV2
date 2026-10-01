import { useQuery } from '@tanstack/react-query'
import { useApi } from '../../api/context'
import { unwrap } from '../../api/unwrap'

export function useVenues() {
  const api = useApi()
  return useQuery({
    queryKey: ['venues'],
    queryFn: async () => (await unwrap(api.GET('/api/venues'))).items,
    staleTime: 5 * 60_000,
  })
}

export function useVenueEvents(venueId: string | undefined) {
  const api = useApi()
  return useQuery({
    queryKey: ['venues', venueId, 'events'],
    enabled: Boolean(venueId),
    queryFn: async () =>
      (
        await unwrap(
          api.GET('/api/venues/{venueId}/events', { params: { path: { venueId: venueId! } } }),
        )
      ).items,
  })
}
