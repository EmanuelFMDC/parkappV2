import { Warehouse } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, useSearchParams } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import { Button, EmptyState, Skeleton, TopBar } from '../../components/ui'
import { HostIntro } from '../../features/host/HostIntro'
import { HostSpaceCard } from '../../features/host/HostSpaceCard'
import { useHostSpaces } from '../../features/host/hooks'
import { useStartPublishing } from '../../features/host/useStartPublishing'

/** Host mode, first tab: the host's own garages. */
export default function HostSpacesPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const { ready, loading, start } = useStartPublishing()
  const spaces = useHostSpaces()

  // The bookings used to be a tab inside this page; keep old links working.
  if (params.get('tab') === 'bookings') return <Navigate to="/host/bookings" replace />

  return (
    <>
      <TopBar title={ready ? t('host.home.tabs.spaces') : t('host.home.title')} />
      <Page className="space-y-6">
        {loading ? (
          <div role="status" aria-label={t('common.loading')}>
            <Skeleton className="h-40 w-full" />
          </div>
        ) : !ready ? (
          <HostIntro onStart={start} />
        ) : (
          <>
            <Button onClick={start}>{t('host.home.publish')}</Button>
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
          </>
        )}
      </Page>
    </>
  )
}
