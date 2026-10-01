import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import esMX from './es-MX.json'

export const languages = ['es-MX', 'en'] as const
export type Language = (typeof languages)[number]

/** Any Spanish locale becomes es-MX, any English locale becomes en; everything else falls back to es-MX. */
export function toSupportedLanguage(detected: string): Language {
  return detected.toLowerCase().startsWith('en') ? 'en' : 'es-MX'
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { 'es-MX': { translation: esMX }, en: { translation: en } },
    fallbackLng: 'es-MX',
    supportedLngs: languages,
    interpolation: { escapeValue: false },
    detection: {
      // The saved preference wins; otherwise browser/phone language (profile sync comes with the backend).
      order: ['localStorage', 'navigator'],
      lookupLocalStorage: 'parkapp.lang',
      caches: ['localStorage'],
      convertDetectedLanguage: toSupportedLanguage,
    },
  })

const syncHtmlLang = () => {
  document.documentElement.lang = i18n.resolvedLanguage ?? 'es-MX'
}
i18n.on('initialized', syncHtmlLang)
i18n.on('languageChanged', syncHtmlLang)
syncHtmlLang()

export default i18n
