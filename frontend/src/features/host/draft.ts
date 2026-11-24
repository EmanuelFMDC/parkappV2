import { useCallback, useRef, useState } from 'react'
import type { LatLng, Municipality, SpaceFeature } from '../../api/types'
import type { Availability } from '../../lib/availability'

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
  location: LatLng | null
  lengthCm: string
  widthCm: string
  heightCm: string
  features: SpaceFeature[]
  photos: DraftPhoto[]
  description: string
  /** Identical spots, as typed. */
  quantity: string
  /** When the host rents it; null = always. */
  availability: Availability | null
  acceptTerms: boolean
}

export const EMPTY_DRAFT: HostDraft = {
  venueId: '',
  street: '',
  neighborhood: '',
  municipality: '',
  location: null,
  lengthCm: '',
  widthCm: '',
  heightCm: '',
  features: [],
  photos: [],
  description: '',
  quantity: '1',
  availability: null,
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
