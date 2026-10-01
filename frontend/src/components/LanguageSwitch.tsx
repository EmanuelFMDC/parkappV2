import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { languages, toSupportedLanguage } from '../i18n'

export function LanguageSwitch() {
  const { t, i18n } = useTranslation()
  const id = useId()
  return (
    <div>
      <label htmlFor={id}>{t('language.label')}</label>
      <select
        id={id}
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
