import { useTranslation } from 'react-i18next'
import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import { Skeleton } from '../../components/ui'
import { useAccount } from './hooks'
import type { Role } from './stage'

/**
 * Routes inside this guard need a complete, verified account. Anyone else is sent to create one
 * and comes back to exactly where they were, with the same venue and time window.
 */
export function RequireAccount({ role = 'driver' }: { role?: Role }) {
  const { t } = useTranslation()
  const { pathname, search } = useLocation()
  const { stage, loading } = useAccount(role)

  if (loading) {
    return (
      <Page>
        <div role="status" aria-label={t('common.loading')} className="space-y-3 pt-8">
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </Page>
    )
  }
  if (stage !== 'ready') {
    const as = role === 'host' ? '&as=host' : ''
    return (
      <Navigate to={`/account/new?next=${encodeURIComponent(pathname + search)}${as}`} replace />
    )
  }
  return <Outlet />
}
