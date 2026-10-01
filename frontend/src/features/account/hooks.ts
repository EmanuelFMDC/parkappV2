import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useApi } from '../../api/context'
import type { Me, ProfileInput, VehicleInput } from '../../api/types'
import { unwrap } from '../../api/unwrap'
import { useAuth } from '../auth/context'
import { accountStage, type AccountStage } from './stage'

const POLL_IDENTITY_MS = 2000

/** The signed-in person's account, kept fresh while their identity check is pending. */
export function useMe() {
  const api = useApi()
  const { user } = useAuth()
  return useQuery({
    queryKey: ['me', user?.id],
    enabled: Boolean(user),
    queryFn: () => unwrap(api.GET('/api/me')),
    // The provider answers asynchronously (a webhook, in production): poll until it does.
    refetchInterval: (query) =>
      query.state.data?.identityStatus === 'pending' ? POLL_IDENTITY_MS : false,
  })
}

export interface Account {
  stage: AccountStage
  me: Me | undefined
  /** True while we do not yet know the stage (signed in, account still loading). */
  loading: boolean
}

export function useAccount(): Account {
  const { user } = useAuth()
  const me = useMe()
  if (!user) return { stage: 'signed_out', me: undefined, loading: false }
  if (me.isPending) return { stage: 'signed_out', me: undefined, loading: true }
  return { stage: accountStage(me.data), me: me.data, loading: false }
}

/** Account mutations all return the updated account, which replaces the cached copy. */
function useAccountMutation<T>(call: (api: ReturnType<typeof useApi>, input: T) => Promise<Me>) {
  const api = useApi()
  const { user } = useAuth()
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (input: T) => call(api, input),
    onSuccess: (me) => queryClient.setQueryData(['me', user?.id], me),
  })
}

export const useUpdateProfile = () =>
  useAccountMutation<ProfileInput>((api, body) => unwrap(api.PUT('/api/me/profile', { body })))

export const useAddVehicle = () =>
  useAccountMutation<VehicleInput>((api, body) => unwrap(api.POST('/api/me/vehicles', { body })))

export const useRemoveVehicle = () =>
  useAccountMutation<string>((api, vehicleId) =>
    unwrap(api.DELETE('/api/me/vehicles/{vehicleId}', { params: { path: { vehicleId } } })),
  )

export const useStartIdentity = () =>
  useAccountMutation<void>((api) => unwrap(api.POST('/api/me/identity')))
