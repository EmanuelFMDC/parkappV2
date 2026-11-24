import { useTranslation } from 'react-i18next'
import type { Quote } from '../../api/types'
import { formatCents } from '../../lib/money'

type Breakdown = Pick<
  Quote,
  'rentCents' | 'zoneSurchargeCents' | 'commissionCents' | 'vatCents' | 'totalCents'
> &
  Partial<Pick<Quote, 'minutes' | 'hourlyCents'>>

/** The server's price, line by line: rent, venue-zone charge, commission, VAT and total. */
export function PriceBreakdown({ price }: { price: Breakdown }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const money = (cents: number) => formatCents(cents, lang)
  const rentDetail =
    price.minutes !== undefined && price.hourlyCents !== undefined
      ? t('driver.price.rentDetail', {
          count: price.minutes / 60,
          rate: money(price.hourlyCents),
        })
      : null

  return (
    <dl className="space-y-1.5 border-t border-line pt-3 text-ink-muted">
      <div className="flex justify-between gap-3">
        <dt>
          {t('driver.price.rent')}
          {rentDetail && <span className="block text-caption">{rentDetail}</span>}
        </dt>
        <dd className="tabular-nums">{money(price.rentCents)}</dd>
      </div>
      {price.zoneSurchargeCents > 0 && (
        <div className="flex justify-between gap-3">
          <dt>{t('driver.price.zone')}</dt>
          <dd className="tabular-nums">{money(price.zoneSurchargeCents)}</dd>
        </div>
      )}
      <div className="flex justify-between gap-3">
        <dt>{t('driver.price.commission')}</dt>
        <dd className="tabular-nums">{money(price.commissionCents)}</dd>
      </div>
      <div className="flex justify-between gap-3">
        <dt>{t('driver.price.vat')}</dt>
        <dd className="tabular-nums">{money(price.vatCents)}</dd>
      </div>
      <div className="flex items-baseline justify-between gap-3 text-ink">
        <dt className="font-semibold">{t('driver.time.total')}</dt>
        <dd className="font-display text-title font-bold tabular-nums">
          {money(price.totalCents)}
        </dd>
      </div>
    </dl>
  )
}
