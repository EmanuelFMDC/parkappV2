import { Clock, MapPin, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { LotFeatures } from '../components/LotFeatures'
import { Badge, Button, EmptyState, PSign, TopBar } from '../components/ui'
import { getLot } from '../data/lots'
import { formatMoney } from '../lib/format'

export default function LotDetail() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const lot = getLot(id)

  if (!lot) {
    return (
      <>
        <TopBar title={t('app.name')} back />
        <div className="px-4">
          <EmptyState
            icon={<MapPin className="size-6" aria-hidden />}
            title={t('lot.notFound')}
            body={t('lot.notFoundBody')}
            action={
              <Link to="/" className="font-semibold text-primary underline underline-offset-4">
                {t('ticket.backToMap')}
              </Link>
            }
          />
        </div>
      </>
    )
  }

  const full = lot.free === 0
  const freePct = Math.round((lot.free / lot.total) * 100)

  return (
    <>
      <TopBar title={lot.name} back />

      <div className="space-y-6 px-4">
        <section className="rounded-surface bg-primary p-5 text-white">
          <div className="flex items-start gap-3">
            <PSign className="size-12 shrink-0" />
            <div>
              <p className="text-caption text-signal-200">{t('lot.from')}</p>
              <p className="font-display text-display font-bold leading-none tabular-nums">
                {formatMoney(lot.pricePerHour, i18n.language)}
                <span className="ml-1.5 text-body font-medium text-signal-200">{t('common.perHour')}</span>
              </p>
            </div>
          </div>
          <div className="mt-5">
            <div className="flex items-baseline justify-between text-caption">
              <span className="text-signal-200">{t('lot.spots')}</span>
              <span className="font-semibold tabular-nums">
                {lot.free} / {lot.total}
              </span>
            </div>
            <div
              className="mt-2 h-2 overflow-hidden rounded-full bg-white/20"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={freePct}
              aria-valuetext={`${lot.free} / ${lot.total}`}
              aria-label={t('lot.spots')}
            >
              <div className="h-full rounded-full bg-accent" style={{ width: `${freePct}%` }} />
            </div>
          </div>
        </section>

        <section className="flex flex-wrap items-center gap-2">
          {full ? (
            <Badge tone="danger">{t('common.full')}</Badge>
          ) : (
            <Badge tone="success">{t('common.available', { count: lot.free })}</Badge>
          )}
          <Badge tone="neutral" icon={<Star className="size-3.5 fill-accent text-accent" aria-hidden />}>
            <span aria-hidden>{lot.rating}</span>
            <span className="sr-only">{t('common.rating', { value: lot.rating })}</span>
          </Badge>
        </section>

        <section className="space-y-3">
          <h2 className="text-title font-semibold">{t('lot.about')}</h2>
          <LotFeatures features={lot.features} />
        </section>

        <dl className="divide-y divide-line rounded-surface bg-surface ring-1 ring-line">
          <div className="flex items-start gap-3 p-4">
            <Clock className="mt-0.5 size-5 text-primary" aria-hidden />
            <div>
              <dt className="text-caption text-ink-muted">{t('lot.hours')}</dt>
              <dd className="font-semibold">{lot.open24 ? t('common.open24') : '06:00 – 23:00'}</dd>
            </div>
          </div>
          <div className="flex items-start gap-3 p-4">
            <MapPin className="mt-0.5 size-5 text-primary" aria-hidden />
            <div>
              <dt className="text-caption text-ink-muted">{t('lot.address')}</dt>
              <dd className="font-semibold">{lot.address}</dd>
            </div>
          </div>
        </dl>

        <Button variant="accent" block disabled={full} onClick={() => navigate(`/lot/${lot.id}/book`)}>
          {t('lot.reserve')}
        </Button>
      </div>
    </>
  )
}
