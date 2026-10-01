import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, SpaceCard, TicketStub } from '../../components/ui'
import { formatDistance } from '../../lib/distance'
import { formatDateTime, localToUtcIso } from '../../lib/time'
import { Section, Subsection } from '../Section'
import { sampleSpaces } from '../samples'

export function CardsSection() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const [selected, setSelected] = useState<string | null>('gate')

  const hour = { hour: '2-digit', minute: '2-digit', hourCycle: 'h23' } as const

  return (
    <Section id="cards" title={t('styleguide.cards.title')} intro={t('styleguide.cards.intro')}>
      <div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
        <Subsection title={t('styleguide.cards.spaces')}>
          <ul className="grid gap-4 sm:grid-cols-2">
            {sampleSpaces.slice(0, 2).map((s) => (
              <li key={s.id}>
                <SpaceCard
                  title={t(`samples.spaces.${s.id}`)}
                  distanceLabel={t('samples.distance', {
                    distance: formatDistance(s.distanceM, lang),
                    venue: t('samples.venue'),
                  })}
                  priceCents={s.priceCents}
                  rating={s.rating}
                  reviewCount={s.reviewCount}
                  photoTone={s.tone}
                  selected={selected === s.id}
                  onSelect={() => setSelected(s.id)}
                  tags={s.tags.map((tag) => (
                    <Badge key={tag}>{t(`samples.tags.${tag}`)}</Badge>
                  ))}
                />
              </li>
            ))}
          </ul>
        </Subsection>

        <Subsection title={t('styleguide.cards.ticket')}>
          <p className="text-caption text-ink-muted">{t('styleguide.cards.ticketIntro')}</p>
          <TicketStub
            title={t('samples.spaces.gate')}
            address={t('samples.address')}
            startLabel={formatDateTime(localToUtcIso('2026-10-17', '17:30'), lang, hour)}
            endLabel={formatDateTime(localToUtcIso('2026-10-17', '23:30'), lang, hour)}
            plate="JAL-482-A"
            spotLabel={t('samples.spot')}
            code="K7M4QX"
          />
        </Subsection>
      </div>
    </Section>
  )
}
