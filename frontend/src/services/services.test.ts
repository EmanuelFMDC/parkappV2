import { describe, expect, it } from 'vitest'
import { createMockServices } from './index'
import { MOCK_SMS_CODE } from './auth'

describe('mock services', () => {
  it('signs in with phone and exposes a token', async () => {
    const { auth } = createMockServices()
    expect(await auth.getIdToken()).toBeNull()

    const { verificationId } = await auth.signInWithPhone('3312345678')
    const user = await auth.confirmCode(verificationId, MOCK_SMS_CODE)

    expect(user.phone).toBe('3312345678')
    expect(await auth.getIdToken()).toBe(`mock-token-${user.id}`)
  })

  it('rejects a wrong code and notifies listeners on sign-out', async () => {
    const { auth } = createMockServices()
    const { verificationId } = await auth.signInWithPhone('3300000000')
    await expect(auth.confirmCode(verificationId, '123456')).rejects.toThrow()

    await auth.confirmCode(verificationId, MOCK_SMS_CODE)
    const seen: Array<string | null> = []
    auth.onAuthChange((u) => seen.push(u?.id ?? null))
    await auth.signOut()
    expect(seen).toEqual([null])
  })

  it('only accepts integer cents for payments', async () => {
    const { payments } = createMockServices()
    const intent = await payments.createPaymentIntent({ bookingId: 'b1', amountCents: 9600 })
    expect(intent.amountCents).toBe(9600)
    expect(await payments.confirm(intent.clientSecret)).toEqual({ status: 'succeeded' })

    await expect(
      payments.createPaymentIntent({ bookingId: 'b2', amountCents: 96.5 }),
    ).rejects.toThrow(RangeError)
  })

  it('does not return a push token before permission is granted', async () => {
    const { push } = createMockServices()
    expect(await push.getToken()).toBeNull()
    await push.requestPermission()
    expect(await push.getToken()).not.toBeNull()
  })

  it('tracks identity verification status', async () => {
    const { identity } = createMockServices()
    expect(await identity.getStatus()).toBe('not_started')
    await identity.startVerification()
    expect(await identity.getStatus()).toBe('pending')
  })
})
