import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { clearMode } from '../../lib/modePreference'
import { useServices } from '../../services/context'
import { AuthContext, type AuthState } from './context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const { auth } = useServices()
  const queryClient = useQueryClient()
  const [user, setUser] = useState(() => auth.currentUser())

  useEffect(
    () =>
      auth.onAuthChange((next) => {
        setUser(next)
        if (!next) clearMode()
        // Whatever was cached belonged to the previous person.
        queryClient.removeQueries({ queryKey: ['bookings'] })
        queryClient.removeQueries({ queryKey: ['me'] })
        queryClient.removeQueries({ queryKey: ['host'] })
      }),
    [auth, queryClient],
  )

  const value = useMemo<AuthState>(
    () => ({
      user,
      requestCode: async (phone) => (await auth.signInWithPhone(phone)).verificationId,
      confirmCode: async (verificationId, code) =>
        void (await auth.confirmCode(verificationId, code)),
      signInWithGoogle: async () => void (await auth.signInWithGoogle()),
      signOut: () => auth.signOut(),
    }),
    [auth, user],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
