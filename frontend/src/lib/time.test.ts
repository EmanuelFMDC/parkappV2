import { describe, expect, it } from 'vitest'
import { formatDateTime, localToUtcIso, utcToLocalParts } from './time'

describe('localToUtcIso', () => {
  it('converts Mexico City wall time to UTC (UTC-6, no DST since 2022)', () => {
    expect(localToUtcIso('2026-09-30', '18:00')).toBe('2026-10-01T00:00:00.000Z')
  })

  it('also holds in the northern summer', () => {
    expect(localToUtcIso('2026-07-15', '09:30')).toBe('2026-07-15T15:30:00.000Z')
  })

  it('rejects malformed input', () => {
    expect(() => localToUtcIso('nope', '18:00')).toThrow(RangeError)
  })
})

describe('formatDateTime', () => {
  it('shows a UTC instant in Mexico City time', () => {
    const text = formatDateTime('2026-10-01T00:00:00.000Z', 'es-MX', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
    expect(text).toBe('18:00')
  })

  it('round-trips with localToUtcIso', () => {
    const utc = localToUtcIso('2026-12-24', '20:15')
    const back = formatDateTime(utc, 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    })
    expect(back).toBe('20:15')
  })
})

describe('utcToLocalParts', () => {
  it('reads a UTC instant as Mexico City wall time', () => {
    expect(utcToLocalParts('2026-10-01T00:30:00.000Z')).toEqual({
      date: '2026-09-30',
      time: '18:30',
    })
  })

  it('round-trips with localToUtcIso, including across midnight UTC', () => {
    const parts = utcToLocalParts(localToUtcIso('2026-12-31', '23:30'))
    expect(parts).toEqual({ date: '2026-12-31', time: '23:30' })
  })
})
