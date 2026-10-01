import { BadgeCheck, CarFront } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import type { HostBooking } from '../../api/types'
import { Badge } from '../../components/ui'
import { formatCents } from '../../lib/money'
import { formatDateTime } from '../../lib/time'
import { describeVehicle } from '../account/vehicleFit'
import { StatusBadge } from '../bookings/StatusBadge'

/** A booking on one of the host's spaces. Shows who is coming, never how to reach them. */
export function HostBookingCard({ booking }: { booking: HostBooking }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const when: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }
  return (
    <article className="space-y-3 rounded-surface bg-surface p-4 ring-1 ring-line">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h3 className="text-body font-semibold">{booking.space.title}</h3>
        <StatusBadge status={booking.status} />
      </div>
      <p className="text-ink-muted">
        {formatDateTime(booking.startsAt, lang, when)} –{' '}
        {formatDateTime(booking.endsAt, lang, { hour: 'numeric', minute: '2-digit' })}
      </p>
      <div className="flex flex-wrap items-center gap-2">
        <p className="font-semibold">{booking.driver.firstName}</p>
        {booking.driver.identityVerified && (
          <Badge tone="success" icon={<BadgeCheck className="size-3.5" />}>
            {t('host.booking.verified')}
          </Badge>
        )}
      </div>
      <p className="flex items-center gap-2 text-ink-muted">
        <CarFront aria-hidden className="size-5 shrink-0 text-primary" />
        {describeVehicle(booking.driver.vehicle)}
      </p>
      <p className="flex items-baseline justify-between border-t border-line pt-3">
        <span className="text-caption text-ink-muted">{t('host.booking.price')}</span>
        <span className="font-display text-title font-bold tabular-nums">
          {formatCents(booking.subtotalCents, lang)}
        </span>
      </p>
    </article>
  )
}
