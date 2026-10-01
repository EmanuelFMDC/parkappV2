export type PushPermission = 'granted' | 'denied'

export interface PushMessage {
  title: string
  body: string
}

/** Firebase Cloud Messaging (through Capacitor on mobile) sits behind this interface. */
export interface PushService {
  requestPermission(): Promise<PushPermission>
  getToken(): Promise<string | null>
  onMessage(listener: (message: PushMessage) => void): () => void
}

export function createMockPushService(): PushService {
  let granted = false
  return {
    async requestPermission() {
      granted = true
      return 'granted'
    },
    async getToken() {
      return granted ? 'mock-push-token' : null
    },
    onMessage() {
      return () => undefined
    },
  }
}
