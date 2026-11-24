import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../../api/context'
import type { BookingCreate, IncidentCreate } from '../../api/types'
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

/** Arriving (check-in) and leaving (check-out), each with photos of the car and the spot. */
export function useCheckInOut() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({
      bookingId,
      step,
      photoKeys,
    }: {
      bookingId: string
      step: 'check-in' | 'check-out'
      photoKeys: string[]
    }) =>
      unwrap(
        step === 'check-in'
          ? api.POST('/api/bookings/{bookingId}/check-in', {
              params: { path: { bookingId } },
              body: { photoKeys },
            })
          : api.POST('/api/bookings/{bookingId}/check-out', {
              params: { path: { bookingId } },
              body: { photoKeys },
            }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  })
}

export function useReportIncident() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ bookingId, input }: { bookingId: string; input: IncidentCreate }) =>
      unwrap(
        api.POST('/api/bookings/{bookingId}/incidents', {
          params: { path: { bookingId } },
          body: input,
        }),
      ),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['bookings'] }),
  })
}
