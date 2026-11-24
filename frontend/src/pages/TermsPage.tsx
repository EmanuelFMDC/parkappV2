import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Page } from '../components/layout/Page'
import { TopBar } from '../components/ui'

const SECTIONS = [
  'object',
  'registration',
  'host',
  'driver',
  'payments',
  'cancellation',
  'liability',
  'data',
  'suspension',
  'law',
] as const

/** Terms and conditions. PROVISIONAL: a lawyer must review them before launch. */
export default function TermsPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  return (
    <>
      <TopBar title={t('terms.title')} onBack={() => navigate(-1)} />
      <Page className="space-y-6">
        <p role="note" className="rounded-control bg-warning-50 p-4 font-medium text-warning-700">
          {t('terms.provisional')}
        </p>
        <ol className="space-y-5">
          {SECTIONS.map((key, i) => (
            <li key={key} className="space-y-1">
              <h2 className="text-title font-semibold">
                {i + 1}. {t(`terms.sections.${key}.title`)}
              </h2>
              <p className="text-ink-muted">{t(`terms.sections.${key}.body`)}</p>
            </li>
          ))}
        </ol>
      </Page>
    </>
  )
}
