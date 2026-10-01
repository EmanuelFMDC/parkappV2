import { assertCents } from '../lib/money'

export interface PaymentIntent {
  clientSecret: string
  amountCents: number
}

export type PaymentResult = { status: 'succeeded' } | { status: 'failed'; reason: string }

/** Stripe Connect sits behind this interface. Amounts are integer cents. */
export interface PaymentService {
  createPaymentIntent(input: { bookingId: string; amountCents: number }): Promise<PaymentIntent>
  confirm(clientSecret: string): Promise<PaymentResult>
}

export function createMockPaymentService(): PaymentService {
  return {
    async createPaymentIntent({ bookingId, amountCents }) {
      return { clientSecret: `mock-secret-${bookingId}`, amountCents: assertCents(amountCents) }
    },
    async confirm(clientSecret) {
      return clientSecret.startsWith('mock-secret-')
        ? { status: 'succeeded' }
        : { status: 'failed', reason: 'unknown_payment' }
    },
  }
}
