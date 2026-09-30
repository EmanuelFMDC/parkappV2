import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

export interface ParkingSession {
  lotId: string
  plate: string
  startsAt: number
  endsAt: number
  total: number
  code: string
  level: string
  spot: number
}

interface SessionContextValue {
  session: ParkingSession | null
  start: (s: ParkingSession) => void
  extend: (minutes: number, cost: number) => void
  end: () => void
}

const STORAGE_KEY = 'parkapp.session'
const SessionContext = createContext<SessionContextValue | null>(null)

function load(): ParkingSession | null {
  try {
    const raw = sessionStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as ParkingSession) : null
  } catch {
    return null
  }
}

function persist(s: ParkingSession | null) {
  try {
    if (s) sessionStorage.setItem(STORAGE_KEY, JSON.stringify(s))
    else sessionStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable: keep in memory only */
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<ParkingSession | null>(load)

  const set = useCallback((s: ParkingSession | null) => {
    persist(s)
    setSession(s)
  }, [])

  const value = useMemo<SessionContextValue>(
    () => ({
      session,
      start: (s) => set(s),
      extend: (minutes, cost) =>
        set(session ? { ...session, endsAt: session.endsAt + minutes * 60_000, total: session.total + cost } : null),
      end: () => set(null),
    }),
    [session, set],
  )

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useSession() {
  const ctx = useContext(SessionContext)
  if (!ctx) throw new Error('useSession must be used inside SessionProvider')
  return ctx
}
