import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Badge,
  BottomSheet,
  MapListLayout,
  MapPlaceholder,
  SpaceCard,
  type SheetState,
} from '../../components/ui'
import { formatDistance } from '../../lib/distance'
import { Section, Subsection } from '../Section'
import { sampleSpaces, VENUE_POSITION } from '../samples'

/** The core pattern: the same component is a sheet over the map on phones and a list beside it on desktop. */
function MapAndList({ className, initial }: { className: string; initial: SheetState }) {
  const { t, i18n } = useTranslation()
  const [sheet, setSheet] = useState<SheetState>(initial)
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)
  const activeId = selectedId ?? hoverId

  const pins = sampleSpaces.map((s) => ({
    id: s.id,
    title: t(`samples.spaces.${s.id}`),
    priceCents: s.priceCents,
    x: s.x,
    y: s.y,
  }))

  return (
    <MapListLayout
      className={className}
      map={
        <MapPlaceholder
          pins={pins}
          venue={VENUE_POSITION}
          activeId={activeId}
          onSelect={(id) => {
            setSelectedId(id)
            setSheet((s) => (s === 'peek' ? 'half' : s))
          }}
        />
      }
      sheet={
        <BottomSheet
          label={t('styleguide.patterns.sheetLabel')}
          state={sheet}
          onStateChange={setSheet}
          summary={
            <p className="font-display text-title font-semibold" role="status">
              {t('styleguide.patterns.summary', {
                count: sampleSpaces.length,
                venue: t('samples.venue'),
              })}
            </p>
          }
        >
          {(docked) => (
            <ul className="space-y-3 pt-2">
              {sampleSpaces.map((s) => (
                <li key={s.id}>
                  <SpaceCard
                    layout={docked ? 'stacked' : 'row'}
                    title={t(`samples.spaces.${s.id}`)}
                    distanceLabel={t('samples.distance', {
                      distance: formatDistance(s.distanceM, i18n.language),
                      venue: t('samples.venue'),
                    })}
                    priceCents={s.priceCents}
                    rating={s.rating}
                    reviewCount={s.reviewCount}
                    photoTone={s.tone}
                    selected={selectedId === s.id}
                    onSelect={() => setSelectedId(s.id)}
                    onHoverChange={(h) => setHoverId(h ? s.id : null)}
                    tags={s.tags.map((tag) => (
                      <Badge key={tag}>{t(`samples.tags.${tag}`)}</Badge>
                    ))}
                  />
                </li>
              ))}
            </ul>
          )}
        </BottomSheet>
      }
    />
  )
}

export function PatternsSection() {
  const { t } = useTranslation()
  return (
    <Section
      id="patterns"
      title={t('styleguide.patterns.title')}
      intro={t('styleguide.patterns.intro')}
    >
      <div className="space-y-10">
        <Subsection title={t('styleguide.patterns.mobile')}>
          <div
            data-testid="phone-frame"
            className="mx-auto w-[22.5rem] max-w-full overflow-hidden rounded-[2.25rem] border-[10px] border-ink bg-canvas"
          >
            <MapAndList className="h-[42rem]" initial="half" />
          </div>
        </Subsection>
        <Subsection title={t('styleguide.patterns.desktop')}>
          <div
            data-testid="desktop-frame"
            className="overflow-hidden rounded-surface ring-1 ring-line"
          >
            <MapAndList className="h-[42rem]" initial="half" />
          </div>
        </Subsection>
      </div>
    </Section>
  )
}
