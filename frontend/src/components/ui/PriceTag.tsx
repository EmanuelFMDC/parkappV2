import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { formatCents } from '../../lib/money'

interface PriceTagProps {
  /** Integer cents, always. */
  cents: number
  size?: 'md' | 'lg'
}

export function PriceTag({ cents, size = 'md' }: PriceTagProps) {
  const { t, i18n } = useTranslation()
  return (
    <span className="inline-flex items-baseline gap-1 whitespace-nowrap">
      <span
        className={clsx(
          'font-display font-bold tabular-nums text-ink',
          size === 'lg' ? 'text-headline' : 'text-title',
        )}
      >
        {formatCents(cents, i18n.language)}
      </span>
      <span className="text-caption text-ink-muted">{t('ui.perHour')}</span>
    </span>
  )
}
