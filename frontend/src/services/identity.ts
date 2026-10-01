export type VerificationStatus = 'not_started' | 'pending' | 'verified' | 'rejected'

/** Truora (INE) sits behind this interface. Hosts only, at the start. */
export interface IdentityService {
  startVerification(): Promise<{ sessionUrl: string }>
  getStatus(): Promise<VerificationStatus>
}

export function createMockIdentityService(): IdentityService {
  let status: VerificationStatus = 'not_started'
  return {
    async startVerification() {
      status = 'pending'
      return { sessionUrl: 'about:blank#mock-identity-session' }
    },
    async getStatus() {
      return status
    },
  }
}
