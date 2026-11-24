import type { TFunction } from 'i18next'
import type { Availability } from '../../lib/availability'

const weekday = (lang: string, d: number) =>
  // 2024-01-01 was a Monday, so ISO weekday d is January d.
  new Intl.DateTimeFormat(lang, { weekday: 'short', timeZone: 'UTC' }).format(
    new Date(Date.UTC(2024, 0, d)),
  )

const hour = (t: TFunction, lang: string, h: number) =>
  h === 24
    ? t('host.availability.midnight')
    : new Intl.DateTimeFormat(lang, { hour: 'numeric', timeZone: 'UTC' }).format(
        new Date(Date.UTC(2000, 0, 1, h)),
      )

/** "vie., sáb., dom., de 4 p.m. a Medianoche", or "Disponible siempre". */
export function scheduleText(t: TFunction, lang: string, a: Availability | null): string {
  if (!a) return t('host.availability.summaryAlways')
  return t('host.availability.summary', {
    days: a.days.map((d) => weekday(lang, d)).join(', '),
    from: hour(t, lang, a.fromHour),
    to: hour(t, lang, a.toHour),
  })
}
