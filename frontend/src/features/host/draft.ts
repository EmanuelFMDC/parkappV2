import { useCallback, useRef, useState } from 'react'
import type { LatLng, Municipality, SpaceFeature, VehicleType } from '../../api/types'

export interface DraftPhoto {
  /** Object key returned by the signed-upload step. */
  key: string
  name: string
}

/** Everything the host fills in across the four steps. Numbers stay as text until they are validated. */
export interface HostDraft {
  venueId: string
  street: string
  neighborhood: string
  municipality: Municipality | ''
  references: string
  location: LatLng | null
  lengthCm: string
  widthCm: string
  heightCm: string
  vehicleTypes: VehicleType[]
  /** Once the host edits the car types by hand, changing the size stops overwriting them. */
  typesTouched: boolean
  features: SpaceFeature[]
  photos: DraftPhoto[]
  title: string
  description: string
  price: string
  acceptTerms: boolean
}

export const EMPTY_DRAFT: HostDraft = {
  venueId: '',
  street: '',
  neighborhood: '',
  municipality: '',
  references: '',
  location: null,
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  vehicleTypes: [],
  typesTouched: false,
  features: [],
  photos: [],
  title: '',
  description: '',
  price: '',
  acceptTerms: false,
}

const KEY = 'parkapp.host.draft'

function read(): HostDraft {
  try {
    const raw = sessionStorage.getItem(KEY)
    return raw ? { ...EMPTY_DRAFT, ...(JSON.parse(raw) as Partial<HostDraft>) } : EMPTY_DRAFT
  } catch {
    return EMPTY_DRAFT
  }
}

function write(draft: HostDraft | null) {
  try {
    if (draft) sessionStorage.setItem(KEY, JSON.stringify(draft))
    else sessionStorage.removeItem(KEY)
  } catch {
    /* storage unavailable: the draft lives in memory for this page only */
  }
}

/** The draft survives reloads of the tab (sessionStorage) but never leaves the browser until published. */
export function useHostDraft(): {
  draft: HostDraft
  patch: (changes: Partial<HostDraft>) => void
  clear: () => void
} {
  const [draft, setDraft] = useState(read)
  const latest = useRef(draft)

  const patch = useCallback((changes: Partial<HostDraft>) => {
    latest.current = { ...latest.current, ...changes }
    write(latest.current)
    setDraft(latest.current)
  }, [])

  const clear = useCallback(() => {
    latest.current = EMPTY_DRAFT
    write(null)
    setDraft(EMPTY_DRAFT)
  }, [])

  return { draft, patch, clear }
}
