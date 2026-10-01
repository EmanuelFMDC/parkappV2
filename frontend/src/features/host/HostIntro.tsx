import { Warehouse } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button, EmptyState } from '../../components/ui'

/** What someone sees in host mode before they have a verified host account. */
export function HostIntro({ onStart }: { onStart: () => void }) {
  const { t } = useTranslation()
  return (
    <EmptyState
      icon={<Warehouse className="size-6" />}
      title={t('host.home.introTitle')}
      body={t('host.home.introBody')}
      action={<Button onClick={onStart}>{t('host.home.start')}</Button>}
    />
  )
}
