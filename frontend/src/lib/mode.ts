import { useLocation } from 'react-router-dom'

/** One account, two ways to use the app: looking for a spot, or renting one out. */
export type Mode = 'driver' | 'host'

/**
 * The address decides the mode, so links, reloads and the back button always agree with what is on
 * screen. Everything under /host is host mode; account creation and the rest are driver mode.
 */
export function modeOf(pathname: string): Mode {
  return pathname === '/host' || pathname.startsWith('/host/') ? 'host' : 'driver'
}

export function useMode(): Mode {
  return modeOf(useLocation().pathname)
}

/** The home screen of each mode: where switching to it lands. */
export const HOME_OF: Record<Mode, string> = { driver: '/', host: '/host' }
export const PROFILE_OF: Record<Mode, string> = { driver: '/profile', host: '/host/profile' }
