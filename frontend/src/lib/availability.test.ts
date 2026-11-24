import { describe, expect, it } from 'vitest'
import { isWithinAvailability, validAvailability, type Availability } from './availability'
import { localToUtcIso } from './time'

// 2026-10-16 is a Friday (5), 2026-10-17 a Saturday (6), 2026-10-18 a Sunday (7). Mexico City time.
const at = (date: string, time: string) => localToUtcIso(date, time)

describe('validAvailability', () => {
  it('accepts weekdays 1-7, a start hour 0-23 and an end hour 1-24', () => {
    expect(validAvailability({ days: [5, 6], fromHour: 16, toHour: 24 })).toBe(true)
    expect(validAvailability({ days: [6], fromHour: 18, toHour: 2 })).toBe(true) // overnight
  })

  it.each<[string, Availability]>([
    ['no days', { days: [], fromHour: 8, toHour: 20 }],
    ['day 0', { days: [0], fromHour: 8, toHour: 20 }],
    ['day 8', { days: [8], fromHour: 8, toHour: 20 }],
    ['repeated days', { days: [5, 5], fromHour: 8, toHour: 20 }],
    ['same start and end', { days: [5], fromHour: 8, toHour: 8 }],
    ['start 24', { days: [5], fromHour: 24, toHour: 2 }],
    ['end 0', { days: [5], fromHour: 8, toHour: 0 }],
    ['half hours', { days: [5], fromHour: 8.5, toHour: 20 }],
  ])('rejects %s', (_name, a) => {
    expect(validAvailability(a)).toBe(false)
  })
})

describe('isWithinAvailability', () => {
  const evenings: Availability = { days: [5, 6], fromHour: 16, toHour: 24 }

  it('is always true with no schedule (always available)', () => {
    expect(isWithinAvailability(null, at('2026-10-18', '03:00'), at('2026-10-18', '05:00'))).toBe(
      true,
    )
  })

  it('needs every hour of the booking inside the schedule', () => {
    expect(
      isWithinAvailability(evenings, at('2026-10-16', '18:00'), at('2026-10-16', '23:00')),
    ).toBe(true)
    expect(
      isWithinAvailability(evenings, at('2026-10-16', '15:00'), at('2026-10-16', '18:00')),
    ).toBe(false)
    // Thursday is not in the schedule
    expect(
      isWithinAvailability(evenings, at('2026-10-15', '18:00'), at('2026-10-15', '20:00')),
    ).toBe(false)
  })

  it('crosses midnight only into a day that is also available', () => {
    // Friday 22:00 to Saturday 00:00 ends exactly at midnight: fine
    expect(
      isWithinAvailability(evenings, at('2026-10-16', '22:00'), at('2026-10-17', '00:00')),
    ).toBe(true)
    // Saturday 23:00 to Sunday 01:00: Sunday 00:00-01:00 is outside
    expect(
      isWithinAvailability(evenings, at('2026-10-17', '23:00'), at('2026-10-18', '01:00')),
    ).toBe(false)
  })

  it('supports an overnight schedule that ends the next morning', () => {
    const nights: Availability = { days: [6], fromHour: 18, toHour: 2 }
    // Saturday 18:00 to Sunday 02:00
    expect(isWithinAvailability(nights, at('2026-10-17', '18:00'), at('2026-10-18', '02:00'))).toBe(
      true,
    )
    // Sunday 18:00 is not covered (Sunday is not a start day)
    expect(isWithinAvailability(nights, at('2026-10-18', '18:00'), at('2026-10-18', '20:00'))).toBe(
      false,
    )
  })
})
