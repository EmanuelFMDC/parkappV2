import { useTranslation } from 'react-i18next'
import { useHealth } from '../api/health'
import { LanguageSwitch } from '../components/LanguageSwitch'

/** Foundation placeholder. Real screens come after the design system is approved (Phase 2). */
export function HomePage() {
  const { t } = useTranslation()
  const health = useHealth()

  const status = health.isPending
    ? t('home.status.loading')
    : health.isError
      ? t('home.status.error')
      : t('home.status.ok', { version: health.data.version })

  return (
    <main>
      <h1>{t('home.title')}</h1>
      <p>{t('home.intro')}</p>
      <p>
        {t('home.status.label')}: <span role="status">{status}</span>
      </p>
      <LanguageSwitch />
    </main>
  )
}
