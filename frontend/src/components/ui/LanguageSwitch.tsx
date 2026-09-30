import { useTranslation } from 'react-i18next'
import { languages, type Language } from '../../i18n'
import { Segmented } from './Segmented'

const names: Record<Language, string> = { es: 'Español', en: 'English' }

export function LanguageSwitch({ hideLabel }: { hideLabel?: boolean }) {
  const { t, i18n } = useTranslation()
  const current = (languages.find((l) => i18n.resolvedLanguage?.startsWith(l)) ?? 'es') as Language
  return (
    <Segmented
      label={t('profile.language')}
      hideLabel={hideLabel}
      value={current}
      onChange={(l) => void i18n.changeLanguage(l)}
      options={languages.map((l) => ({ value: l, label: names[l] }))}
    />
  )
}
