import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { contrastRatio, MIN_RATIO } from '../../lib/contrast'
import { Section, Subsection } from '../Section'
import { colorGroups, contrastPairs, palette } from '../tokens'

function textOn(hex: string): string {
  return contrastRatio('#ffffff', hex) >= contrastRatio(palette.ink, hex) ? '#ffffff' : palette.ink
}

export function ColorsSection() {
  const { t } = useTranslation()
  return (
    <>
      <Section
        id="colors"
        title={t('styleguide.colors.title')}
        intro={t('styleguide.colors.intro')}
      >
        <div className="space-y-8">
          {colorGroups.map((group) => (
            <Subsection key={group.key} title={t(`styleguide.colors.groups.${group.key}`)}>
              <p className="max-w-[62ch] text-caption text-ink-muted">
                {t(`styleguide.colors.usage.${group.key}`)}
              </p>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                {group.tokens.map((token) => (
                  <li
                    key={token}
                    className="rounded-control p-3 ring-1 ring-inset ring-line"
                    style={{ backgroundColor: palette[token], color: textOn(palette[token]) }}
                  >
                    <p className="text-caption font-semibold">{token}</p>
                    <p className="text-caption tabular-nums">{palette[token]}</p>
                  </li>
                ))}
              </ul>
            </Subsection>
          ))}
        </div>
      </Section>

      <Section
        id="contrast"
        title={t('styleguide.contrast.title')}
        intro={t('styleguide.contrast.intro')}
      >
        <div
          role="region"
          tabIndex={0}
          aria-label={t('styleguide.contrast.title')}
          className="overflow-x-auto rounded-surface bg-surface ring-1 ring-line"
        >
          <table className="w-full min-w-[34rem] text-left text-caption">
            <caption className="sr-only">{t('styleguide.contrast.title')}</caption>
            <thead>
              <tr className="border-b border-line text-ink-muted">
                <th scope="col" className="p-3 font-semibold">
                  {t('styleguide.contrast.pair')}
                </th>
                <th scope="col" className="p-3 font-semibold">
                  {t('styleguide.contrast.sample')}
                </th>
                <th scope="col" className="p-3 text-right font-semibold">
                  {t('styleguide.contrast.ratio')}
                </th>
                <th scope="col" className="p-3 text-right font-semibold">
                  {t('styleguide.contrast.min')}
                </th>
                <th scope="col" className="p-3 font-semibold">
                  {t('styleguide.contrast.result')}
                </th>
              </tr>
            </thead>
            <tbody>
              {contrastPairs.map(({ id, fg, bg, level }) => {
                const ratio = contrastRatio(palette[fg], palette[bg])
                return (
                  <tr key={id} className="border-b border-line last:border-0">
                    <th scope="row" className="p-3 font-medium">
                      {t(`styleguide.contrast.pairs.${id}`)}
                    </th>
                    <td className="p-3">
                      {level === 'ui' ? (
                        <span
                          aria-hidden
                          className="inline-block h-7 w-12 rounded-md border-[3px]"
                          style={{ borderColor: palette[fg], backgroundColor: palette[bg] }}
                        />
                      ) : (
                        <span
                          className="inline-block rounded-md px-2.5 py-1 font-semibold ring-1 ring-inset ring-line"
                          style={{ color: palette[fg], backgroundColor: palette[bg] }}
                        >
                          Aa
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-right tabular-nums">{ratio.toFixed(2)}:1</td>
                    <td className="p-3 text-right tabular-nums">{MIN_RATIO[level]}:1</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 font-semibold text-success-600">
                        <Check aria-hidden className="size-4" />
                        {t('styleguide.contrast.pass')}
                      </span>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </Section>
    </>
  )
}
