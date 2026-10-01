import { describe, expect, it } from 'vitest'
import { modeOf } from './mode'

describe('modeOf', () => {
  it.each([
    ['/host', 'host'],
    ['/host/bookings', 'host'],
    ['/host/profile', 'host'],
    ['/host/new/location', 'host'],
    ['/', 'driver'],
    ['/bookings', 'driver'],
    ['/profile', 'driver'],
    ['/venues/akron/spaces', 'driver'],
    ['/book/akron-1/time', 'driver'],
    ['/account/new', 'driver'],
    // A path that only starts with the same letters is not host mode.
    ['/hostel', 'driver'],
    ['/hosting', 'driver'],
  ])('%s is %s mode', (path, mode) => {
    expect(modeOf(path)).toBe(mode)
  })
})
