import { CalendarX } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Page } from '../../components/layout/Page'
import { EmptyState, Skeleton, TopBar } from '../../components/ui'
import { HostBookingCard } from '../../features/host/HostBookingCard'
import { HostIntro } from '../../features/host/HostIntro'
import { useHostBookings } from '../../features/host/hooks'
import { useStartPublishing } from '../../features/host/useStartPublishing'

/** Host mode, second tab: the bookings drivers made on the host's garages. */
export default function HostBookingsPage() {
  const { t } = useTranslation()
  const { ready, loading, start } = useStartPublishing()
  const bookings = useHostBookings()

  return (
    <>
      <TopBar title={ready ? t('host.home.tabs.bookings') : t('host.home.title')} />
      <Page className="space-y-6">
        {loading ? (
          <div role="status" aria-label={t('common.loading')}>
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !ready ? (
          <HostIntro onStart={start} />
        ) : bookings.isPending ? (
          <Skeleton className="h-40 w-full" />
        ) : bookings.isError ? (
          <p role="alert" className="text-danger-600">
            {t('host.home.loadError')}
          </p>
        ) : bookings.data.length === 0 ? (
          <EmptyState
            icon={<CalendarX className="size-6" />}
            title={t('host.home.emptyBookingsTitle')}
            body={t('host.home.emptyBookingsBody')}
          />
        ) : (
          <ul className="space-y-4">
            {bookings.data.map((booking) => (
              <li key={booking.id}>
                <HostBookingCard booking={booking} />
              </li>
            ))}
          </ul>
        )}
      </Page>
    </>
  )
}
