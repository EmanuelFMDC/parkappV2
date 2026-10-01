import { Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface RatingProps {
  value: number
  /** Number of reviews. Reviews are always visible next to the score (trust signal). */
  count: number
}

export function Rating({ value, count }: RatingProps) {
  const { t, i18n } = useTranslation()
  const number = new Intl.NumberFormat(i18n.language, { minimumFractionDigits: 1 })

  // A listing nobody has reviewed yet says so, instead of showing a misleading 0.0.
  if (count === 0) {
    return (
      <span className="inline-flex items-center gap-1 whitespace-nowrap text-caption font-semibold text-primary">
        {t('ui.newListing')}
      </span>
    )
  }

  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap text-caption font-semibold text-ink">
      <Star aria-hidden className="size-4 fill-action text-action" />
      <span aria-hidden>
        {number.format(value)} <span className="font-normal text-ink-muted">({count})</span>
      </span>
      <span className="sr-only">{t('ui.rating', { value: number.format(value), count })}</span>
    </span>
  )
}
