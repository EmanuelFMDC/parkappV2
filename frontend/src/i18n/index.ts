import i18n from 'i18next'
import LanguageDetector from 'i18next-browser-languagedetector'
import { initReactI18next } from 'react-i18next'
import driverEn from './driver.en.json'
import driverEsMX from './driver.es-MX.json'
import en from './en.json'
import esMX from './es-MX.json'
import hostEn from './host.en.json'
import hostEsMX from './host.es-MX.json'

export const languages = ['es-MX', 'en'] as const
export type Language = (typeof languages)[number]

type Tree = { [key: string]: string | Tree }

/** Merges translation trees. Files stay small and per-feature; the app sees one dictionary. */
export function mergeTranslations(...trees: Tree[]): Tree {
  const out: Tree = {}
  for (const tree of trees) {
    for (const [key, value] of Object.entries(tree)) {
      const current = out[key]
      out[key] =
        typeof value === 'object' && typeof current === 'object'
          ? mergeTranslations(current, value)
          : typeof value === 'object'
            ? mergeTranslations(value)
            : value
    }
  }
  return out
}

/** Any Spanish locale becomes es-MX, any English locale becomes en; everything else falls back to es-MX. */
export function toSupportedLanguage(detected: string): Language {
  return detected.toLowerCase().startsWith('en') ? 'en' : 'es-MX'
}

export const dictionaries = {
  'es-MX': mergeTranslations(esMX, driverEsMX, hostEsMX),
  en: mergeTranslations(en, driverEn, hostEn),
}

void i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      'es-MX': { translation: dictionaries['es-MX'] },
      en: { translation: dictionaries.en },
    },
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
