import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { languages, toSupportedLanguage } from '../i18n'

export function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  const id = useId()
  return (
    <div className="flex items-center gap-2">
      <label htmlFor={id} className="text-caption font-semibold text-ink-muted">
        {t('language.label')}
      </label>
      <select
        id={id}
        className="h-touch rounded-control bg-surface px-3 text-body text-ink ring-1 ring-inset ring-control focus-visible:outline-primary"
        value={toSupportedLanguage(i18n.resolvedLanguage ?? '')}
        onChange={(e) => void i18n.changeLanguage(e.target.value)}
      >
        {languages.map((l) => (
          <option key={l} value={l} lang={l}>
            {t(`language.${l}`)}
          </option>
        ))}
      </select>
    </div>
  )
}
