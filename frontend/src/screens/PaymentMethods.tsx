import { CreditCard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge, TopBar } from '../components/ui'

export default function PaymentMethods() {
  const { t } = useTranslation()
  return (
    <>
      <TopBar title={t('payments.title')} back />
      <div className="space-y-4 px-4">
        <ul className="rounded-surface bg-surface ring-1 ring-line">
          <li className="flex items-center gap-3 p-4">
            <CreditCard className="size-6 shrink-0 text-primary" aria-hidden />
            <div className="min-w-0 flex-1">
              <p className="font-semibold">{t('payments.card', { last: '4242' })}</p>
              <p className="text-caption text-ink-muted">{t('payments.expires', { date: '08/28' })}</p>
            </div>
            <Badge tone="primary">{t('payments.default')}</Badge>
          </li>
        </ul>
        <p className="text-caption text-ink-muted">{t('payments.note')}</p>
      </div>
    </>
  )
}
