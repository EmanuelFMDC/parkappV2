import { Receipt } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Badge, EmptyState, TopBar } from '../components/ui'
import { visits } from '../data/history'
import { formatDay, formatMoney } from '../lib/format'

export default function History() {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const completed = visits.filter((v) => v.status === 'completed')
  const spent = completed.reduce((sum, v) => sum + v.total, 0)

  return (
    <>
      <TopBar title={t('history.title')} />
      <div className="space-y-5 px-4">
        {visits.length === 0 ? (
          <EmptyState
            icon={<Receipt className="size-6" aria-hidden />}
            title={t('history.emptyTitle')}
            body={t('history.emptyBody')}
          />
        ) : (
          <>
            <p className="rounded-surface bg-primary-soft p-4 font-medium text-signal-800">
              {t('history.spent', { amount: formatMoney(spent, lang), count: completed.length })}
            </p>
            <ul className="divide-y divide-line rounded-surface bg-surface ring-1 ring-line">
              {visits.map((v) => (
                <li key={v.id} className="flex items-center justify-between gap-3 p-4">
                  <div className="min-w-0">
                    <p className="truncate font-semibold">{v.lotName}</p>
                    <p className="text-caption text-ink-muted">
                      {formatDay(v.date, lang)}
                      {v.minutes > 0 && ` · ${t('common.minutes', { count: v.minutes })}`}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    <p className="font-display font-bold tabular-nums">{formatMoney(v.total, lang)}</p>
                    <Badge tone={v.status === 'completed' ? 'success' : 'neutral'}>{t(`history.${v.status}`)}</Badge>
                  </div>
                </li>
              ))}
            </ul>
          </>
        )}
      </div>
    </>
  )
}
