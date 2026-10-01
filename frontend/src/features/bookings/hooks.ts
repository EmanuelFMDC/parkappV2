import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../../api/context'
import type { BookingCreate } from '../../api/types'
import { unwrap } from '../../api/unwrap'
import { useAuth } from '../auth/context'

export function useBookings() {
  const api = useApi()
  const { user } = useAuth()
  return useQuery({
    queryKey: ['bookings', user?.id],
    enabled: Boolean(user),
    queryFn: async () => (await unwrap(api.GET('/api/bookings'))).items,
  })
}

export function useBooking(bookingId: string | undefined) {
  const api = useApi()
  const { user } = useAuth()
  return useQuery({
    queryKey: ['bookings', user?.id, bookingId],
    enabled: Boolean(user && bookingId),
    retry: false,
    queryFn: () =>
      unwrap(api.GET('/api/bookings/{bookingId}', { params: { path: { bookingId: bookingId! } } })),
  })
}

export function useCreateBooking() {
  const api = useApi()
  return useMutation({
    mutationFn: (body: BookingCreate) => unwrap(api.POST('/api/bookings', { body })),
  })
}

export function useConfirmBooking() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, paymentIntentId }: { bookingId: string; paymentIntentId: string }) =>
      unwrap(
        api.POST('/api/bookings/{bookingId}/confirm', {
          params: { path: { bookingId } },
          body: { paymentIntentId },
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  })
}

export function useCancelBooking() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (bookingId: string) =>
      unwrap(api.POST('/api/bookings/{bookingId}/cancel', { params: { path: { bookingId } } })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  })
}
