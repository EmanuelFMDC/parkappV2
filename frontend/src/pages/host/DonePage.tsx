import { ShieldCheck } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import { Button, TopBar } from '../../components/ui'

/** After publishing: the space is waiting for back-office review. */
export default function DonePage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <>
      <TopBar title={t('host.done.title')} />
      <Page className="space-y-6 pt-4">
        <ShieldCheck aria-hidden className="size-12 text-success-600" />
        <p className="max-w-[52ch] text-lead text-ink-muted" role="status">
          {t('host.done.body')}
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button onClick={() => navigate('/host')}>{t('host.done.see')}</Button>
          <Button variant="secondary" onClick={() => navigate('/host/new/location')}>
            {t('host.done.another')}
          </Button>
        </div>
      </Page>
    </>
  )
}
