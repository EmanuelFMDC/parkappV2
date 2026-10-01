import { Clock } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatDuration } from '../../lib/duration'
import { formatDateTime } from '../../lib/time'
import type { TimeWindow } from '../spaces/hooks'

const FORMAT: Intl.DateTimeFormatOptions = {
  weekday: 'short',
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
}

/** Arrival, departure and duration, in Mexico City time. */
export function WindowSummary({ window }: { window: TimeWindow }) {
  const { t, i18n } = useTranslation()
  const minutes = Math.round((Date.parse(window.endsAt) - Date.parse(window.startsAt)) / 60_000)
  return (
    <div className="space-y-2">
      <dl className="space-y-2 text-body">
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">{t('driver.time.arrival')}</dt>
          <dd className="text-right font-semibold">
            {formatDateTime(window.startsAt, i18n.language, FORMAT)}
          </dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt className="text-ink-muted">{t('driver.time.departure')}</dt>
          <dd className="text-right font-semibold">
            {formatDateTime(window.endsAt, i18n.language, FORMAT)}
          </dd>
        </div>
      </dl>
      <p className="flex items-center gap-1.5 text-caption text-ink-muted">
        <Clock aria-hidden className="size-4" />
        {t('driver.time.duration', {
          value: formatDuration(minutes, t('common.hoursShort'), t('common.minutesShort')),
        })}
      </p>
    </div>
  )
}
