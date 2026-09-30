import { SearchX, Search } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { LotCard } from '../components/LotCard'
import { LotMap } from '../components/LotMap'
import { Button, Chip, EmptyState, Input } from '../components/ui'
import { lots, type LotFeature } from '../data/lots'

type Filter = 'all' | LotFeature | 'cheap'
const filters: Filter[] = ['all', 'covered', 'ev', 'secure', 'cheap']

export default function Explore() {
  const { t } = useTranslation()
  const [filter, setFilter] = useState<Filter>('all')
  const [query, setQuery] = useState('')

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase()
    let list = lots.filter((l) => !q || `${l.name} ${l.address}`.toLowerCase().includes(q))
    if (filter === 'cheap') list = [...list].sort((a, b) => a.pricePerHour - b.pricePerHour)
    else if (filter !== 'all') list = list.filter((l) => l.features.includes(filter))
    return list
  }, [filter, query])

  const reset = () => {
    setFilter('all')
    setQuery('')
  }

  return (
    <>
      <header className="px-4 pb-2 pt-6">
        <h1 className="text-headline font-bold">{t('explore.greeting')}</h1>
        <Input
          className="mt-4"
          label={t('explore.searchPlaceholder')}
          hideLabel
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t('explore.searchPlaceholder')}
          icon={<Search className="size-5" aria-hidden />}
        />
      </header>

      <div
        role="group"
        aria-label={t('explore.filtersLabel')}
        className="flex gap-2 overflow-x-auto px-4 py-3 [scrollbar-width:none]"
      >
        {filters.map((f) => (
          <Chip key={f} selected={filter === f} onClick={() => setFilter(f)}>
            {t(`explore.filters.${f}`)}
          </Chip>
        ))}
      </div>

      <div className="px-4">
        <LotMap lots={visible} />
      </div>

      <section className="px-4 pt-6" aria-labelledby="nearby">
        <h2 id="nearby" className="mb-3 text-title font-semibold">
          {t('explore.nearby')}
        </h2>
        {visible.length > 0 ? (
          <ul className="space-y-3">
            {visible.map((lot) => (
              <li key={lot.id}>
                <LotCard lot={lot} />
              </li>
            ))}
          </ul>
        ) : (
          <EmptyState
            icon={<SearchX className="size-6" aria-hidden />}
            title={t('explore.emptyTitle')}
            body={t('explore.emptyBody')}
            action={
              <Button variant="secondary" size="md" onClick={reset}>
                {t('explore.clearFilters')}
              </Button>
            }
          />
        )}
      </section>
    </>
  )
}
