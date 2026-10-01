import { createContext, useContext } from 'react'
import type { AuthUser } from '../../services/auth'

export interface AuthState {
  user: AuthUser | null
  requestCode: (phone: string) => Promise<string>
  confirmCode: (verificationId: string, code: string) => Promise<void>
  signInWithGoogle: () => Promise<void>
  signOut: () => Promise<void>
}

export const AuthContext = createContext<AuthState | null>(null)

export function useAuth(): AuthState {
  const auth = useContext(AuthContext)
  if (!auth) throw new Error('useAuth must be used inside <AuthProvider>')
  return auth
}
