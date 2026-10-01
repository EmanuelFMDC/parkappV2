import { describe, expect, it } from 'vitest'
import type { Me } from '../../api/types'
import { accountStage, safeNext } from './stage'

const complete: Me = {
  id: 'u1',
  phone: '3312345678',
  email: 'ana@example.com',
  firstName: 'Ana',
  lastName: 'López',
  birthDate: '1995-03-02',
  language: 'es-MX',
  privacyAcceptedAt: '2026-10-10T12:00:00.000Z',
  identityStatus: 'verified',
  vehicles: [
    { id: 'v1', plate: 'JAL482A', make: 'Nissan', model: 'Versa', color: 'Gris', type: 'sedan' },
  ],
}

describe('accountStage', () => {
  it('is signed out without an account', () => {
    expect(accountStage(null)).toBe('signed_out')
    expect(accountStage(undefined)).toBe('signed_out')
  })

  it.each([
    ['first name', { firstName: null }],
    ['last name', { lastName: null }],
    ['birth date', { birthDate: null }],
    ['email', { email: null }],
    ['privacy consent', { privacyAcceptedAt: null }],
  ] as const)('asks for the profile when %s is missing', (_name, over) => {
    expect(accountStage({ ...complete, ...over })).toBe('profile')
  })

  it('asks for a vehicle after the profile', () => {
    expect(accountStage({ ...complete, vehicles: [] })).toBe('vehicle')
  })

  it.each(['not_started', 'pending', 'rejected'] as const)(
    'asks for identity verification while it is %s',
    (identityStatus) => {
      expect(accountStage({ ...complete, identityStatus })).toBe('identity')
    },
  )

  it('is ready only when everything is done', () => {
    expect(accountStage(complete)).toBe('ready')
  })

  it('goes in order: profile before vehicle before identity', () => {
    expect(
      accountStage({ ...complete, firstName: null, vehicles: [], identityStatus: 'not_started' }),
    ).toBe('profile')
    expect(accountStage({ ...complete, vehicles: [], identityStatus: 'not_started' })).toBe(
      'vehicle',
    )
  })
})

describe('safeNext', () => {
  it.each([
    ['/book/akron-2/time?venue=akron', '/book/akron-2/time?venue=akron'],
    ['/', '/'],
    [null, '/'],
    ['', '/'],
    ['https://evil.example', '/'],
    ['//evil.example', '/'],
    ['javascript:alert(1)', '/'],
  ])('maps %j to %j', (input, expected) => {
    expect(safeNext(input)).toBe(expected)
  })
})
