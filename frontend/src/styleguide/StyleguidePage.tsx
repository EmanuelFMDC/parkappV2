import { useTranslation } from 'react-i18next'
import { LanguageSwitch } from '../components/LanguageSwitch'
import { Logo } from '../components/ui'
import { CardsSection } from './sections/CardsSection'
import { ColorsSection } from './sections/ColorsSection'
import { ControlsSection } from './sections/ControlsSection'
import { NavigationSection } from './sections/NavigationSection'
import { PatternsSection } from './sections/PatternsSection'
import { TypographySection } from './sections/TypographySection'

const toc = ['colors', 'contrast', 'type', 'controls', 'cards', 'navigation', 'patterns'] as const

export function StyleguidePage() {
  const { t } = useTranslation()
  return (
    <div className="mx-auto max-w-6xl px-4 pb-16 pt-6 sm:px-6">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-line pb-6">
        <Logo />
        <LanguageSwitch />
      </header>

      <main>
        <div className="space-y-4 py-10">
          <h1 className="max-w-[18ch] text-display font-bold">{t('styleguide.title')}</h1>
          <p className="max-w-[58ch] text-lead text-ink-muted">{t('styleguide.intro')}</p>
          <nav aria-label={t('styleguide.tocLabel')}>
            <ul className="flex flex-wrap gap-2 pt-2">
              {toc.map((id) => (
                <li key={id}>
                  <a
                    href={`#${id}`}
                    className="inline-flex h-touch items-center rounded-full bg-surface px-4 text-[0.9375rem] font-medium text-primary ring-1 ring-inset ring-control hover:bg-primary-soft"
                  >
                    {t(`styleguide.toc.${id}`)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <ColorsSection />
        <TypographySection />
        <ControlsSection />
        <CardsSection />
        <NavigationSection />
        <PatternsSection />
      </main>
    </div>
  )
}
