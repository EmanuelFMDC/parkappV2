import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import en from './en.json'
import es from './es.json'

export const languages = ['es', 'en'] as const
export type Language = (typeof languages)[number]

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: { es: { translation: es }, en: { translation: en } },
    fallbackLng: 'es',
    supportedLngs: languages,
    nonExplicitSupportedLngs: true,
    interpolation: { escapeValue: false },
    detection: { order: ['localStorage', 'navigator'], caches: ['localStorage'] },
  })

const syncHtmlLang = () => {
  document.documentElement.lang = (i18n.resolvedLanguage ?? i18n.language ?? 'es').slice(0, 2)
}
i18n.on('initialized', syncHtmlLang)
i18n.on('languageChanged', syncHtmlLang)
syncHtmlLang()

export default i18n
