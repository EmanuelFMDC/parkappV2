import type { ReactNode } from 'react'
import { Navigate } from 'react-router-dom'
import { useVenues } from '../venues/hooks'
import type { HostDraft } from './draft'
import { HOST_STEPS, validateStep, type HostStep } from './validate'

const PATH: Record<HostStep, string> = {
  location: '/host/new/location',
  size: '/host/new/size',
  photos: '/host/new/photos',
  price: '/host/new/price',
}
export const stepPath = (step: HostStep) => PATH[step]

/**
 * Sends the host back to the first earlier step that is still incomplete (a reload or a typed
 * address cannot skip ahead). Returns the redirect element, or null when this step may be shown.
 */
export function useStepGuard(step: HostStep, draft: HostDraft): ReactNode {
  const venues = useVenues()
  if (venues.isPending) return null
  const venue = venues.data?.find((v) => v.id === draft.venueId)
  const earlier = HOST_STEPS.slice(0, HOST_STEPS.indexOf(step))
  const blocked = earlier.find((s) => validateStep(s, draft, venue) !== null)
  return blocked ? <Navigate to={PATH[blocked]} replace /> : null
}
