import { createMockAuthService, type AuthService } from './auth'
import { createMockIdentityService, type IdentityService } from './identity'
import { createMockMapService, type MapService } from './maps'
import { createMockPaymentService, type PaymentService } from './payments'
import { createMockPushService, type PushService } from './push'
import { createMockStorageService, type StorageService } from './storage'

/**
 * Every external provider (Google Maps, Firebase, Stripe, Truora, Cloud Storage, FCM)
 * is reached only through these interfaces. Real implementations are added on request.
 */
export interface Services {
  maps: MapService
  auth: AuthService
  payments: PaymentService
  identity: IdentityService
  storage: StorageService
  push: PushService
}

export function createMockServices(): Services {
  return {
    maps: createMockMapService(),
    auth: createMockAuthService(),
    payments: createMockPaymentService(),
    identity: createMockIdentityService(),
    storage: createMockStorageService(),
    push: createMockPushService(),
  }
}
