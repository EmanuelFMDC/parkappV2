export interface AuthUser {
  id: string
  displayName: string | null
  phone: string | null
}

/** Firebase Auth (phone + Google) sits behind this interface. The backend verifies the ID token as a JWT. */
export interface AuthService {
  signInWithPhone(phone: string): Promise<{ verificationId: string }>
  confirmCode(verificationId: string, code: string): Promise<AuthUser>
  signInWithGoogle(): Promise<AuthUser>
  signOut(): Promise<void>
  getIdToken(): Promise<string | null>
  currentUser(): AuthUser | null
  onAuthChange(listener: (user: AuthUser | null) => void): () => void
}

export const MOCK_SMS_CODE = '000000'

export function createMockAuthService(): AuthService {
  let user: AuthUser | null = null
  const listeners = new Set<(user: AuthUser | null) => void>()
  const set = (next: AuthUser | null) => {
    user = next
    listeners.forEach((l) => l(user))
    return next
  }

  return {
    async signInWithPhone(phone) {
      return { verificationId: `mock-verification-${phone}` }
    },
    async confirmCode(verificationId, code) {
      if (code !== MOCK_SMS_CODE) throw new Error('Invalid verification code')
      const phone = verificationId.replace('mock-verification-', '')
      return set({ id: `mock-user-${phone}`, displayName: null, phone })!
    },
    async signInWithGoogle() {
      return set({ id: 'mock-google-user', displayName: 'Usuario de prueba', phone: null })!
    },
    async signOut() {
      set(null)
    },
    async getIdToken() {
      return user ? `mock-token-${user.id}` : null
    },
    currentUser: () => user,
    onAuthChange(listener) {
      listeners.add(listener)
      return () => listeners.delete(listener)
    },
  }
}
