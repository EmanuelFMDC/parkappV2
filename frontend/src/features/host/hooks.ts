import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../../api/context'
import type { HostSpaceCreate, HostSpaceUpdate } from '../../api/types'
import { unwrap } from '../../api/unwrap'
import { useAuth } from '../auth/context'

const POLL_REVIEW_MS = 3000

/** The signed-in host's spaces. Polls while one is waiting for back-office, so approval shows up by itself. */
export function useHostSpaces() {
  const api = useApi()
  const { user } = useAuth()
  return useQuery({
    queryKey: ['host', 'spaces', user?.id],
    enabled: Boolean(user),
    queryFn: async () => (await unwrap(api.GET('/api/host/spaces'))).items,
    refetchInterval: (query) =>
      query.state.data?.some((s) => s.status === 'pending_review') ? POLL_REVIEW_MS : false,
  })
}

export function useHostBookings() {
  const api = useApi()
  const { user } = useAuth()
  return useQuery({
    queryKey: ['host', 'bookings', user?.id],
    enabled: Boolean(user),
    queryFn: async () => (await unwrap(api.GET('/api/host/bookings'))).items,
  })
}

export function useCreateHostSpace() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (body: HostSpaceCreate) => unwrap(api.POST('/api/host/spaces', { body })),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['host'] }),
  })
}

export function useUpdateHostSpace() {
  const api = useApi()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ spaceId, patch }: { spaceId: string; patch: HostSpaceUpdate }) =>
      unwrap(
        api.PATCH('/api/host/spaces/{spaceId}', {
          params: { path: { spaceId } },
          body: patch,
        }),
      ),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['host'] })
      // Drivers' searches may now include or exclude this space.
      void queryClient.invalidateQueries({ queryKey: ['spaces'] })
    },
  })
}
