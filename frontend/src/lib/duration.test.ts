import { describe, expect, it } from 'vitest'
import { formatDuration } from './duration'

describe('formatDuration', () => {
  it.each([
    [60, '1 h'],
    [210, '3 h 30 min'],
    [45, '45 min'],
    [0, '0 min'],
  ])('formats %i minutes', (minutes, expected) => {
    expect(formatDuration(minutes, 'h', 'min')).toBe(expected)
  })
})
