import { CalendarX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import { Button, EmptyState, Skeleton, SpaceImage, TopBar } from '../../components/ui'
import { useAuth } from '../../features/auth/context'
import { useBookings } from '../../features/bookings/hooks'
import { StatusBadge } from '../../features/bookings/StatusBadge'
import { formatCents } from '../../lib/money'
import { formatDateTime } from '../../lib/time'

/** The signed-in driver's bookings, newest first. */
export default function BookingsPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const bookings = useBookings()
  const lang = i18n.language

  return (
    <>
      <TopBar title={t('bookings.title')} />
      <Page className="space-y-4">
        {!user ? (
          <EmptyState
            icon={<CalendarX className="size-6" />}
            title={t('bookings.needAccountTitle')}
            body={t('bookings.needAccountBody')}
            action={
              <Button onClick={() => navigate('/account/new?next=%2Fbookings')}>
                {t('account.create')}
              </Button>
            }
          />
        ) : bookings.isPending ? (
          <div role="status" aria-label={t('common.loading')} className="space-y-3">
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
          </div>
        ) : bookings.isError ? (
          <EmptyState
            icon={<CalendarX className="size-6" />}
            title={t('bookings.loadError')}
            body={t('errors.code.unknown')}
            action={
              <Button variant="secondary" size="md" onClick={() => bookings.refetch()}>
                {t('common.retry')}
              </Button>
            }
          />
        ) : bookings.data.length === 0 ? (
          <EmptyState
            icon={<CalendarX className="size-6" />}
            title={t('bookings.emptyTitle')}
            body={t('bookings.emptyBody')}
            action={<Button onClick={() => navigate('/')}>{t('bookings.find')}</Button>}
          />
        ) : (
          <ul className="space-y-3">
            {bookings.data.map((b) => (
              <li key={b.id}>
                <Link
                  to={`/bookings/${b.id}`}
                  className="flex gap-4 rounded-surface bg-surface p-3 ring-1 ring-line hover:shadow-raised"
                >
                  <SpaceImage
                    url={b.space.photoUrl}
                    className="h-24 w-24 shrink-0 overflow-hidden rounded-control"
                  />
                  <div className="flex min-w-0 flex-1 flex-col gap-1.5">
                    <p className="truncate font-semibold">{b.space.title}</p>
                    <p className="truncate text-caption text-ink-muted">{b.venueName}</p>
                    <p className="text-caption text-ink-muted">
                      {formatDateTime(b.startsAt, lang, {
                        weekday: 'short',
                        day: 'numeric',
                        month: 'short',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </p>
                    <div className="mt-auto flex items-center justify-between gap-2">
                      <StatusBadge status={b.status} />
                      <span className="font-display font-bold tabular-nums">
                        {formatCents(b.totalCents, lang)}
                      </span>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Page>
    </>
  )
}
