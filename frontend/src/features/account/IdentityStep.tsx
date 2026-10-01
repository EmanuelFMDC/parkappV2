import { BadgeCheck, FileText, Loader2, ScanFace } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '../../components/ui'
import { errorMessage } from '../../lib/errors'
import { useMe, useStartIdentity } from './hooks'

/**
 * Identity verification (INE and selfie). The provider decides asynchronously, so after starting
 * this screen just watches the account until it becomes verified or rejected.
 */
export function IdentityStep() {
  const { t } = useTranslation()
  const me = useMe()
  const start = useStartIdentity()
  const status = me.data?.identityStatus ?? 'not_started'

  return (
    <section className="space-y-5">
      <p className="text-ink-muted">{t('account.identity.intro')}</p>

      <ul className="space-y-3 rounded-surface bg-surface p-4 ring-1 ring-line">
        <li className="flex items-center gap-3">
          <FileText aria-hidden className="size-6 shrink-0 text-primary" />
          {t('account.identity.docIne')}
        </li>
        <li className="flex items-center gap-3">
          <ScanFace aria-hidden className="size-6 shrink-0 text-primary" />
          {t('account.identity.docSelfie')}
        </li>
      </ul>

      {status === 'pending' && (
        <p
          role="status"
          className="flex items-center gap-3 rounded-control bg-surface p-4 font-medium ring-1 ring-line"
        >
          <Loader2 aria-hidden className="size-5 animate-spin text-primary" />
          {t('account.identity.pending')}
        </p>
      )}
      {status === 'verified' && (
        <p
          role="status"
          className="flex items-center gap-3 rounded-control bg-success-50 p-4 font-medium text-success-600"
        >
          <BadgeCheck aria-hidden className="size-5" />
          {t('account.identity.verified')}
        </p>
      )}
      {status === 'rejected' && (
        <p role="alert" className="rounded-control bg-danger-50 p-4 font-medium text-danger-600">
          {t('account.identity.rejected')}
        </p>
      )}
      {start.error && (
        <p role="alert" className="rounded-control bg-danger-50 p-4 font-medium text-danger-600">
          {errorMessage(t, start.error)}
        </p>
      )}

      {(status === 'not_started' || status === 'rejected') && (
        <Button block loading={start.isPending} onClick={() => start.mutate()}>
          {status === 'rejected' ? t('account.identity.retry') : t('account.identity.start')}
        </Button>
      )}

      <p className="text-caption text-ink-muted">{t('account.identity.simulation')}</p>
    </section>
  )
}
