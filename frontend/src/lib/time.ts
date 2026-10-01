/**
 * All instants travel as UTC ISO strings (CLAUDE.md). They are converted to the
 * Guadalajara/Mexico City zone only when shown to or entered by a person.
 */

export const APP_TIME_ZONE = 'America/Mexico_City'

export function formatDateTime(
  utcIso: string,
  locale: string,
  options: Intl.DateTimeFormatOptions = { dateStyle: 'medium', timeStyle: 'short' },
): string {
  return new Intl.DateTimeFormat(locale, { ...options, timeZone: APP_TIME_ZONE }).format(
    new Date(utcIso),
  )
}

/** Offset of APP_TIME_ZONE from UTC at a given instant, in milliseconds (negative west of UTC). */
function zoneOffsetMs(instant: number): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: APP_TIME_ZONE,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  }).formatToParts(new Date(instant))
  const get = (type: string) => Number(parts.find((p) => p.type === type)?.value)
  const asUtc = Date.UTC(
    get('year'),
    get('month') - 1,
    get('day'),
    get('hour'),
    get('minute'),
    get('second'),
  )
  return asUtc - Math.floor(instant / 1000) * 1000
}

/** Turns a wall-clock date ("2026-09-30") and time ("18:00") in Mexico City into a UTC ISO string. */
export function localToUtcIso(date: string, time: string): string {
  const [y, m, d] = date.split('-').map(Number)
  const [hh, mm] = time.split(':').map(Number)
  if ([y, m, d, hh, mm].some((n) => n === undefined || Number.isNaN(n))) {
    throw new RangeError(`Invalid local date/time: ${date} ${time}`)
  }
  const guess = Date.UTC(y!, m! - 1, d!, hh!, mm!)
  const first = guess - zoneOffsetMs(guess)
  const corrected = guess - zoneOffsetMs(first)
  return new Date(corrected).toISOString()
}
