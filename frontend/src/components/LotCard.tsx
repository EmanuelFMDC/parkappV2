import { Footprints, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import type { Lot } from '../data/lots'
import { formatDistance, formatMoney } from '../lib/format'
import { LotFeatures } from './LotFeatures'
import { Badge } from './ui'

export function LotCard({ lot }: { lot: Lot }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const isFull = lot.free === 0
  const lowSpots = !isFull && lot.free <= 10

  return (
    <Link
      to={`/lot/${lot.id}`}
      className="block rounded-surface bg-surface p-4 shadow-raised transition-transform active:scale-[0.99]"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-title font-semibold">{lot.name}</h3>
          <p className="mt-0.5 flex items-center gap-1.5 text-caption text-ink-muted">
            <Footprints className="size-4" aria-hidden />
            {t('common.walk', { count: lot.walkMin })} · {formatDistance(lot.distanceM, lang)}
          </p>
        </div>
        <div className="text-right">
          <p className="font-display text-headline font-bold leading-none tabular-nums">
            {formatMoney(lot.pricePerHour, lang)}
          </p>
          <p className="mt-1 text-caption text-ink-muted">{t('common.perHour')}</p>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2">
        {isFull ? (
          <Badge tone="danger">{t('common.full')}</Badge>
        ) : (
          <Badge tone={lowSpots ? 'accent' : 'success'}>{t('common.available', { count: lot.free })}</Badge>
        )}
        <span className="flex items-center gap-1 text-caption font-semibold text-ink-muted">
          <Star className="size-4 fill-accent text-accent" aria-hidden />
          <span aria-hidden>{lot.rating}</span>
          <span className="sr-only">{t('common.rating', { value: lot.rating })}</span>
        </span>
      </div>

      {lot.features.length > 0 && (
        <div className="mt-3 border-t border-line pt-3">
          <LotFeatures features={lot.features} />
        </div>
      )}
    </Link>
  )
}
