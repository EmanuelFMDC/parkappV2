import { useTranslation } from 'react-i18next'
import type { BookingStatus, SpaceStatus } from '../../api/types'
import { Badge, PriceTag, Rating, SpaceCard, SpaceImage } from '../../components/ui'
import { StatusBadge } from '../../features/bookings/StatusBadge'
import { SpaceStatusBadge } from '../../features/host/SpaceStatusBadge'
import { formatDistance } from '../../lib/distance'
import { Section, Subsection } from '../Section'
import { sampleSpaces } from '../samples'

const bookingStatuses: BookingStatus[] = [
  'pending_payment',
  'confirmed',
  'completed',
  'cancelled',
  'expired',
]
const spaceStatuses: SpaceStatus[] = ['pending_review', 'active', 'paused', 'rejected']
const tones = ['day', 'dusk', 'night'] as const

export function StatesSection() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const corner = sampleSpaces.find((s) => s.id === 'corner')
  const suv = sampleSpaces.find((s) => s.id === 'suv')
  if (!corner || !suv) return null

  const distance = (m: number) =>
    t('samples.distance', { distance: formatDistance(m, lang), venue: t('samples.venue') })

  return (
    <Section id="states" title={t('styleguide.states.title')} intro={t('styleguide.states.intro')}>
      <div className="grid gap-8 lg:grid-cols-2">
        <Subsection title={t('styleguide.states.cardStates')}>
          <ul className="grid gap-4 sm:grid-cols-2">
            <li>
              <p className="mb-2 text-caption font-semibold">
                {t('styleguide.states.unavailable')}
              </p>
              <SpaceCard
                title={t(`samples.spaces.${suv.id}`)}
                distanceLabel={distance(suv.distanceM)}
                priceCents={suv.priceCents}
                rating={suv.rating}
                reviewCount={suv.reviewCount}
                photoUrl={`placeholder://${suv.tone}`}
                unavailableLabel={t('styleguide.states.unavailableLabel')}
                onSelect={() => undefined}
              />
            </li>
            <li>
              <p className="mb-2 text-caption font-semibold">{t('styleguide.states.newListing')}</p>
              <SpaceCard
                title={t(`samples.spaces.${corner.id}`)}
                distanceLabel={distance(corner.distanceM)}
                priceCents={corner.priceCents}
                rating={0}
                reviewCount={0}
                photoUrl={null}
                onSelect={() => undefined}
              />
            </li>
          </ul>
        </Subsection>

        <div className="space-y-8">
          <Subsection title={t('styleguide.states.rating')}>
            <p className="text-caption text-ink-muted">{t('styleguide.states.ratingIntro')}</p>
            <div className="flex flex-wrap items-center gap-6">
              <Rating value={4.8} count={31} />
              <Rating value={0} count={0} />
            </div>
          </Subsection>

          <Subsection title={t('styleguide.states.price')}>
            <div className="flex flex-wrap items-baseline gap-6">
              <PriceTag cents={5000} />
              <PriceTag cents={7500} size="lg" />
            </div>
          </Subsection>

          <Subsection title={t('styleguide.states.image')}>
            <p className="text-caption text-ink-muted">{t('styleguide.states.imageIntro')}</p>
            <div className="grid grid-cols-4 gap-3">
              {tones.map((tone) => (
                <SpaceImage
                  key={tone}
                  url={`placeholder://${tone}`}
                  className="aspect-[4/3] w-full rounded-control"
                />
              ))}
              <SpaceImage url={null} className="aspect-[4/3] w-full rounded-control" />
            </div>
          </Subsection>
        </div>

        <Subsection title={t('styleguide.states.bookingStatus')}>
          <div className="flex flex-wrap gap-2">
            {bookingStatuses.map((s) => (
              <StatusBadge key={s} status={s} />
            ))}
          </div>
        </Subsection>

        <Subsection title={t('styleguide.states.spaceStatus')}>
          <div className="flex flex-wrap gap-2">
            {spaceStatuses.map((s) => (
              <SpaceStatusBadge key={s} status={s} />
            ))}
            <Badge tone="brand">{t('host.photos.cover')}</Badge>
          </div>
        </Subsection>
      </div>
    </Section>
  )
}
