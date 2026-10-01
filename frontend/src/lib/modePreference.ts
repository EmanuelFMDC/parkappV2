import type { Mode } from './mode'

/** Which mode the person used last, kept on this device. */
const KEY = 'parkapp.mode'
/** Set once the app has decided whether to restore the mode, so it only ever happens when opening the app. */
const SESSION_KEY = 'parkapp.mode.restore-checked'

export function readMode(): Mode | null {
  try {
    const value = localStorage.getItem(KEY)
    return value === 'host' || value === 'driver' ? value : null
  } catch {
    return null
  }
}

export function writeMode(mode: Mode) {
  try {
    localStorage.setItem(KEY, mode)
  } catch {
    /* storage unavailable: the app simply opens in driver mode */
  }
}

/** Forgotten on sign-out, so the next person on a shared phone starts fresh. */
export function clearMode() {
  try {
    localStorage.removeItem(KEY)
    sessionStorage.removeItem(SESSION_KEY)
  } catch {
    /* nothing to clear */
  }
}

export function wasRestoreChecked(): boolean {
  try {
    return sessionStorage.getItem(SESSION_KEY) === '1'
  } catch {
    return false
  }
}

export function markRestoreChecked() {
  try {
    sessionStorage.setItem(SESSION_KEY, '1')
  } catch {
    /* without it, a reload could restore again: harmless */
  }
}

interface RestoreInput {
  pathname: string
  search: string
  stored: Mode | null
  /** The decision was already taken in this browser tab. */
  alreadyChecked: boolean
}

/**
 * Could the app restore host mode right now? Only when it was just opened (first decision of the
 * tab), at the bare root, with no link parameters, and host mode was the last one used.
 */
export function canRestoreHost({
  pathname,
  search,
  stored,
  alreadyChecked,
}: RestoreInput): boolean {
  return !alreadyChecked && pathname === '/' && search === '' && stored === 'host'
}
