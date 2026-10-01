import { useTranslation } from 'react-i18next'
import { Section, Subsection } from '../Section'
import { spacingScale, typeScale } from '../tokens'

export function TypographySection() {
  const { t } = useTranslation()
  return (
    <Section id="type" title={t('styleguide.type.title')} intro={t('styleguide.type.intro')}>
      <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr]">
        <Subsection title={t('styleguide.type.scale')}>
          <ul className="divide-y divide-line rounded-surface bg-surface ring-1 ring-line">
            {typeScale.map(({ token, className }) => (
              <li
                key={token}
                className="flex flex-col gap-1 p-4 sm:flex-row sm:items-baseline sm:gap-6"
              >
                <span className="w-24 shrink-0 text-caption font-semibold text-ink-muted">
                  {token}
                </span>
                <span className={className}>{t(`styleguide.type.samples.${token}`)}</span>
              </li>
            ))}
          </ul>
          <p className="text-caption text-ink-muted">{t('styleguide.type.families')}</p>
        </Subsection>

        <div className="space-y-8">
          <Subsection title={t('styleguide.shape.title')}>
            <ul className="grid grid-cols-3 gap-3">
              {(
                [
                  ['control', 'rounded-control'],
                  ['surface', 'rounded-surface'],
                  ['sheet', 'rounded-t-sheet'],
                ] as const
              ).map(([name, cls]) => (
                <li key={name} className="space-y-2">
                  <div
                    className={`h-16 bg-primary-soft ring-1 ring-inset ring-signal-200 ${cls}`}
                  />
                  <p className="text-caption text-ink-muted">{t(`styleguide.shape.${name}`)}</p>
                </li>
              ))}
            </ul>
          </Subsection>

          <Subsection title={t('styleguide.spacing.title')}>
            <ul className="space-y-1.5">
              {spacingScale.map((n) => (
                <li key={n} className="flex items-center gap-3">
                  <span className="w-16 text-caption tabular-nums text-ink-muted">{n * 4} px</span>
                  <span className="h-3 rounded-sm bg-primary" style={{ width: `${n * 4}px` }} />
                </li>
              ))}
            </ul>
          </Subsection>
        </div>
      </div>
    </Section>
  )
}
