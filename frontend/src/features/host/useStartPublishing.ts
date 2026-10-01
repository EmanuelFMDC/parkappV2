import { useNavigate } from 'react-router-dom'
import { useAccount } from '../account/hooks'

/**
 * Starts publishing a garage. Someone whose account is ready goes straight to the first step;
 * anyone else registers as a host first and comes back to that same step.
 */
export function useStartPublishing() {
  const navigate = useNavigate()
  const { stage, loading } = useAccount('host')
  const ready = stage === 'ready'
  return {
    ready,
    loading,
    start: () =>
      navigate(ready ? '/host/new/location' : '/account/new?next=%2Fhost%2Fnew%2Flocation&as=host'),
  }
}
