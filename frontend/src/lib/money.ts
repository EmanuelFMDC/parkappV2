/** Money is always integer cents (CLAUDE.md). Floats are only used at the very last step, for display. */

export const CURRENCY = 'MXN'

export function assertCents(cents: number): number {
  if (!Number.isSafeInteger(cents)) {
    throw new RangeError(`Money must be an integer number of cents, got ${cents}`)
  }
  return cents
}

export function formatCents(cents: number, locale: string, currency: string = CURRENCY): string {
  assertCents(cents)
  const whole = cents % 100 === 0
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(cents / 100)
}

/** Parses "48", "48.5" or "48.50" into 4800, 4850, 4850 without touching floats. */
export function parsePesosToCents(input: string): number | null {
  const match = /^\s*(\d{1,9})(?:[.,](\d{1,2}))?\s*$/.exec(input)
  if (!match) return null
  const pesos = Number(match[1])
  const centavos = Number((match[2] ?? '').padEnd(2, '0'))
  return pesos * 100 + centavos
}
