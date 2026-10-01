import { describe, expect, it } from 'vitest'
import { assertCents, formatCents, parsePesosToCents } from './money'

describe('assertCents', () => {
  it('accepts integers', () => {
    expect(assertCents(4800)).toBe(4800)
  })

  it('rejects floats and NaN', () => {
    expect(() => assertCents(48.5)).toThrow(RangeError)
    expect(() => assertCents(Number.NaN)).toThrow(RangeError)
  })
})

describe('formatCents', () => {
  it('shows whole pesos without decimals', () => {
    expect(formatCents(4800, 'es-MX')).toBe('$48')
  })

  it('shows centavos when present', () => {
    expect(formatCents(4850, 'es-MX')).toBe('$48.50')
  })

  it('refuses non-integer cents', () => {
    expect(() => formatCents(48.5, 'es-MX')).toThrow(RangeError)
  })
})

describe('parsePesosToCents', () => {
  it.each([
    ['48', 4800],
    ['48.5', 4850],
    ['48.50', 4850],
    ['48,05', 4805],
    ['0.99', 99],
  ])('parses %s', (input, cents) => {
    expect(parsePesosToCents(input)).toBe(cents)
  })

  it.each(['', 'abc', '-5', '48.555', '1e3'])('rejects %j', (input) => {
    expect(parsePesosToCents(input)).toBeNull()
  })

  it('has no float rounding error on 19.99', () => {
    expect(parsePesosToCents('19.99')).toBe(1999)
  })
})
