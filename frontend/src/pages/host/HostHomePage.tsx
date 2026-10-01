import { CalendarX, Warehouse } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import { Button, EmptyState, Segmented, Skeleton, TopBar } from '../../components/ui'
import { useAccount } from '../../features/account/hooks'
import { HostBookingCard } from '../../features/host/HostBookingCard'
import { HostSpaceCard } from '../../features/host/HostSpaceCard'
import { useHostBookings, useHostSpaces } from '../../features/host/hooks'

type Tab = 'spaces' | 'bookings'

/** The host's home: their spaces and the bookings drivers made on them. */
export default function HostHomePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const tab: Tab = params.get('tab') === 'bookings' ? 'bookings' : 'spaces'
  const { stage, loading } = useAccount('host')
  const ready = stage === 'ready'
  const spaces = useHostSpaces()
  const bookings = useHostBookings()

  const startPublishing = () =>
    navigate(ready ? '/host/new/location' : '/account/new?next=%2Fhost%2Fnew%2Flocation&as=host')

  return (
    <>
      <TopBar title={t('host.home.title')} />
      <Page className="space-y-6">
        {loading ? (
          <div role="status" aria-label={t('common.loading')}>
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !ready ? (
          <EmptyState
            icon={<Warehouse className="size-6" />}
            title={t('host.home.introTitle')}
            body={t('host.home.introBody')}
            action={<Button onClick={startPublishing}>{t('host.home.start')}</Button>}
          />
        ) : (
          <>
            <Segmented
              label={t('host.home.tabs.label')}
              hideLabel
              value={tab}
              onChange={(next) => setParams(next === 'spaces' ? {} : { tab: next })}
              options={[
                { value: 'spaces', label: t('host.home.tabs.spaces') },
                { value: 'bookings', label: t('host.home.tabs.bookings') },
              ]}
            />

            {tab === 'spaces' && (
              <section aria-label={t('host.home.tabs.spaces')} className="space-y-4">
                <Button onClick={startPublishing}>{t('host.home.publish')}</Button>
                {spaces.isPending ? (
                  <Skeleton className="h-40 w-full" />
                ) : spaces.isError ? (
                  <p role="alert" className="text-danger-600">
                    {t('host.home.loadError')}{' '}
                    <button
                      type="button"
                      className="font-semibold underline"
                      onClick={() => spaces.refetch()}
                    >
                      {t('common.retry')}
                    </button>
                  </p>
                ) : spaces.data.length === 0 ? (
                  <EmptyState
                    icon={<Warehouse className="size-6" />}
                    title={t('host.home.emptySpacesTitle')}
                    body={t('host.home.emptySpacesBody')}
                  />
                ) : (
                  <ul className="space-y-4">
                    {spaces.data.map((space) => (
                      <li key={space.id}>
                        <HostSpaceCard space={space} />
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}

            {tab === 'bookings' && (
              <section aria-label={t('host.home.tabs.bookings')} className="space-y-4">
                {bookings.isPending ? (
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
              </section>
            )}
          </>
        )}
      </Page>
    </>
  )
}
