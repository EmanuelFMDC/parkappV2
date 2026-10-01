import { CalendarX, CheckCircle2 } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import {
  Button,
  ConfirmDialog,
  EmptyState,
  Skeleton,
  TicketStub,
  TopBar,
} from '../../components/ui'
import { useAuth } from '../../features/auth/context'
import { formatPlate } from '../../features/account/vehicleFit'
import { useBooking, useCancelBooking } from '../../features/bookings/hooks'
import { StatusBadge } from '../../features/bookings/StatusBadge'
import { WindowSummary } from '../../features/bookings/WindowSummary'
import { errorMessage } from '../../lib/errors'
import { formatCents } from '../../lib/money'
import { formatDateTime } from '../../lib/time'

/** One booking. Confirmed bookings show the event ticket; the others explain their state. */
export default function BookingPage() {
  const { bookingId } = useParams()
  const [params] = useSearchParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const booking = useBooking(bookingId)
  const cancel = useCancelBooking()
  const [confirming, setConfirming] = useState(false)
  const lang = i18n.language
  const b = booking.data
  const justBooked = params.get('new') === '1' && b?.status === 'confirmed'
  const backToList = () => navigate('/bookings')

  if (!user) {
    return (
      <>
        <TopBar title={t('bookings.title')} onBack={backToList} />
        <Page>
          <EmptyState
            icon={<CalendarX className="size-6" />}
            title={t('bookings.needAccountTitle')}
            body={t('bookings.needAccountBody')}
            action={
              <Button
                onClick={() =>
                  navigate(`/account/new?next=${encodeURIComponent(`/bookings/${bookingId}`)}`)
                }
              >
                {t('account.create')}
              </Button>
            }
          />
        </Page>
      </>
    )
  }

  if (booking.isError) {
    return (
      <>
        <TopBar title={t('bookings.detail.notFoundTitle')} onBack={backToList} />
        <Page>
          <EmptyState
            icon={<CalendarX className="size-6" />}
            title={t('bookings.detail.notFoundTitle')}
            body={t('bookings.detail.notFoundBody')}
            action={<Button onClick={backToList}>{t('bookings.detail.back')}</Button>}
          />
        </Page>
      </>
    )
  }

  const time = (iso: string) => formatDateTime(iso, lang, { hour: 'numeric', minute: '2-digit' })
  const canCancel = b && (b.status === 'confirmed' || b.status === 'pending_payment')

  return (
    <>
      <TopBar
        title={justBooked ? t('bookings.detail.newTitle') : (b?.space.title ?? t('common.loading'))}
        onBack={backToList}
      />
      <Page className="space-y-6">
        {!b ? (
          <div role="status" aria-label={t('common.loading')} className="space-y-3">
            <Skeleton className="h-64 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            {justBooked && (
              <p className="flex items-start gap-3 text-ink-muted" role="status">
                <CheckCircle2 aria-hidden className="mt-0.5 size-6 shrink-0 text-success-600" />
                {t('bookings.detail.newBody')}
              </p>
            )}

            <div className="flex items-center justify-between gap-3">
              <StatusBadge status={b.status} />
              <span className="font-display text-title font-bold tabular-nums">
                {formatCents(b.totalCents, lang)}
              </span>
            </div>

            {b.status === 'confirmed' || b.status === 'completed' ? (
              <TicketStub
                title={b.space.title}
                address={b.space.address ?? b.space.neighborhood}
                dateLabel={formatDateTime(b.startsAt, lang, {
                  weekday: 'long',
                  day: 'numeric',
                  month: 'long',
                })}
                startLabel={time(b.startsAt)}
                endLabel={time(b.endsAt)}
                plate={formatPlate(b.vehicle.plate)}
                spotLabel={b.space.spotLabel ?? '—'}
                code={b.accessCode ?? '—'}
              />
            ) : (
              <section className="space-y-4 rounded-surface bg-surface p-5 ring-1 ring-line">
                <p className="font-semibold">{b.space.title}</p>
                <WindowSummary window={{ startsAt: b.startsAt, endsAt: b.endsAt }} />
                <p className="rounded-control bg-canvas p-3 text-ink-muted">
                  {b.status === 'pending_payment' && b.expiresAt
                    ? t('bookings.detail.pending', { time: time(b.expiresAt) })
                    : b.status === 'expired'
                      ? t('bookings.detail.expired')
                      : t('bookings.detail.cancelledNote')}
                </p>
              </section>
            )}

            {b.space.address && (
              <section aria-labelledby="where-title" className="space-y-1">
                <h2 id="where-title" className="text-title font-semibold">
                  {t('bookings.detail.where')}
                </h2>
                <p>{b.space.address}</p>
                <p className="text-ink-muted">{b.space.spotLabel}</p>
              </section>
            )}

            {cancel.error && (
              <p
                role="alert"
                className="rounded-control bg-danger-50 p-4 font-medium text-danger-600"
              >
                {errorMessage(t, cancel.error)}
              </p>
            )}

            {canCancel && (
              <Button variant="danger" block onClick={() => setConfirming(true)}>
                {t('bookings.detail.cancel')}
              </Button>
            )}
          </>
        )}
      </Page>

      <ConfirmDialog
        open={confirming}
        danger
        busy={cancel.isPending}
        title={t('bookings.detail.cancelTitle')}
        body={t('bookings.detail.cancelBody')}
        confirmLabel={t('bookings.detail.cancelConfirm')}
        cancelLabel={t('bookings.detail.cancelKeep')}
        onCancel={() => setConfirming(false)}
        onConfirm={() => b && cancel.mutate(b.id, { onSettled: () => setConfirming(false) })}
      />
    </>
  )
}
