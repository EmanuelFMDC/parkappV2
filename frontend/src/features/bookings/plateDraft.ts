import { useCallback, useState } from 'react'

const KEY = 'parkapp.draft.plate'

export function readPlateDraft(): string {
  try {
    return sessionStorage.getItem(KEY) ?? ''
  } catch {
    return ''
  }
}

/** The plate is kept for this browser tab only, never in the URL. */
export function usePlateDraft(): [string, (plate: string) => void] {
  const [plate, setPlate] = useState(readPlateDraft)
  const update = useCallback((next: string) => {
    setPlate(next)
    try {
      sessionStorage.setItem(KEY, next)
    } catch {
      /* storage unavailable: the plate lives in memory for this page only */
    }
  }, [])
  return [plate, update]
}
