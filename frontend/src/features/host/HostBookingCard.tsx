import { BadgeCheck, CarFront } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import type { HostBooking } from '../../api/types'
import { Badge, Button, ConfirmDialog } from '../../components/ui'
import { errorMessage } from '../../lib/errors'
import { formatCents } from '../../lib/money'
import { formatDateTime } from '../../lib/time'
import { useNow } from '../../lib/useNow'
import { describeVehicle } from '../account/vehicleFit'
import { StatusBadge } from '../bookings/StatusBadge'
import { useCancelHostBooking } from './hooks'

/** A booking on one of the host's spaces. Shows who is coming, never how to reach them. */
export function HostBookingCard({ booking }: { booking: HostBooking }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const cancel = useCancelHostBooking()
  const [confirming, setConfirming] = useState(false)
  const now = useNow()
  const when: Intl.DateTimeFormatOptions = {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: 'numeric',
    minute: '2-digit',
  }
  const canCancel = booking.status === 'confirmed' && now < Date.parse(booking.startsAt)

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
      {(booking.checkedInAt || booking.checkedOutAt) && (
        <ul className="space-y-0.5 text-caption text-ink-muted">
          {booking.checkedInAt && (
            <li>
              {t('host.booking.arrived', { time: formatDateTime(booking.checkedInAt, lang, when) })}
            </li>
          )}
          {booking.checkedOutAt && (
            <li>
              {t('host.booking.left', { time: formatDateTime(booking.checkedOutAt, lang, when) })}
            </li>
          )}
          {(booking.overtimeHours ?? 0) > 0 && (
            <li className="font-medium text-ink">
              {t('host.booking.overtime', { count: booking.overtimeHours ?? 0 })}
            </li>
          )}
        </ul>
      )}
      {booking.cancelledBy && (
        <p className="rounded-control bg-canvas p-3 text-caption text-ink-muted">
          {booking.cancelledBy === 'host'
            ? t('host.booking.cancelledByHost')
            : t('host.booking.cancelledByDriver')}
        </p>
      )}
      <p className="flex items-baseline justify-between border-t border-line pt-3">
        <span className="text-caption text-ink-muted">{t('host.booking.price')}</span>
        <span className="font-display text-title font-bold tabular-nums">
          {formatCents(booking.subtotalCents, lang)}
        </span>
      </p>
      {canCancel && (
        <Button variant="ghost" size="md" onClick={() => setConfirming(true)}>
          {t('host.booking.cancel')}
        </Button>
      )}
      {cancel.error && (
        <p role="alert" className="text-caption font-medium text-danger-600">
          {errorMessage(t, cancel.error)}
        </p>
      )}

      <ConfirmDialog
        open={confirming}
        danger
        busy={cancel.isPending}
        title={t('host.booking.cancelTitle', { name: booking.driver.firstName })}
        body={t('host.booking.cancelBody')}
        confirmLabel={t('host.booking.cancelConfirm')}
        cancelLabel={t('host.booking.cancelKeep')}
        onCancel={() => setConfirming(false)}
        onConfirm={() => cancel.mutate(booking.id, { onSettled: () => setConfirming(false) })}
      />
    </article>
  )
}
