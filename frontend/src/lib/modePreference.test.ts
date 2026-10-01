import { beforeEach, describe, expect, it } from 'vitest'
import {
  canRestoreHost,
  clearMode,
  markRestoreChecked,
  readMode,
  wasRestoreChecked,
  writeMode,
} from './modePreference'

beforeEach(() => {
  localStorage.clear()
  sessionStorage.clear()
})

describe('stored mode', () => {
  it('is empty at first', () => {
    expect(readMode()).toBeNull()
  })

  it('remembers the last mode', () => {
    writeMode('host')
    expect(readMode()).toBe('host')
    writeMode('driver')
    expect(readMode()).toBe('driver')
  })

  it('ignores anything that is not a mode', () => {
    localStorage.setItem('parkapp.mode', 'admin')
    expect(readMode()).toBeNull()
  })

  it('is forgotten on sign-out, together with the once-per-tab decision', () => {
    writeMode('host')
    markRestoreChecked()
    clearMode()
    expect(readMode()).toBeNull()
    expect(wasRestoreChecked()).toBe(false)
  })
})

describe('canRestoreHost', () => {
  const opening = { pathname: '/', search: '', stored: 'host', alreadyChecked: false } as const

  it('restores when the app is opened at the root after using host mode', () => {
    expect(canRestoreHost(opening)).toBe(true)
  })

  it.each([
    ['driver mode was the last', { stored: 'driver' }],
    ['nothing was stored', { stored: null }],
    ['the decision was already taken in this tab', { alreadyChecked: true }],
    ['a deep link was opened', { pathname: '/bookings' }],
    ['a booking link was opened', { pathname: '/book/akron-1/time' }],
    ['the root has link parameters', { search: '?venue=akron' }],
    ['host mode itself was opened', { pathname: '/host' }],
  ])('does not restore when %s', (_name, over) => {
    expect(canRestoreHost({ ...opening, ...over } as Parameters<typeof canRestoreHost>[0])).toBe(
      false,
    )
  })
})
