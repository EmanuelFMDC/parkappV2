import type { Me } from '../../api/types'

/**
 * Where a person is in creating their account. Mirrors the rules the server enforces when
 * booking (profile_incomplete, vehicle_required, identity_required), so the UI can send them
 * to the right place instead of waiting for a 403.
 */
export type AccountStage = 'signed_out' | 'profile' | 'vehicle' | 'identity' | 'ready'

/** Hosts publish a space, drivers book one. Only drivers need a registered car. */
export type Role = 'driver' | 'host'

export const ACCOUNT_STAGES: Exclude<AccountStage, 'ready'>[] = [
  'signed_out',
  'profile',
  'vehicle',
  'identity',
]

export function accountStage(me: Me | null | undefined, role: Role = 'driver'): AccountStage {
  if (!me) return 'signed_out'
  if (!me.firstName || !me.lastName || !me.birthDate || !me.email || !me.privacyAcceptedAt) {
    return 'profile'
  }
  if (role === 'driver' && me.vehicles.length === 0) return 'vehicle'
  if (me.identityStatus !== 'verified') return 'identity'
  return 'ready'
}

/** Only follow redirects that stay inside the app (no `//evil.example`, no `https:` URLs). */
export function safeNext(next: string | null): string {
  return next && next.startsWith('/') && !next.startsWith('//') ? next : '/'
}
