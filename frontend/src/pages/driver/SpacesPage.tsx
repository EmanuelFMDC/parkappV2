import { SearchX } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate } from 'react-router-dom'
import type { SpaceFeature } from '../../api/types'
import { WizardHeader } from '../../components/layout/WizardHeader'
import {
  Badge,
  BottomSheet,
  Button,
  Chip,
  EmptyState,
  MapListLayout,
  MapPlaceholder,
  Skeleton,
  SpaceCard,
  type SheetState,
} from '../../components/ui'
import { useSpaces } from '../../features/spaces/hooks'
import { useTrip } from '../../features/trip/useTrip'
import { useVenues } from '../../features/venues/hooks'
import { formatDistance } from '../../lib/distance'
import { toMapPercent } from '../../lib/mapProjection'
import { formatDateTime } from '../../lib/time'

const FILTERS: SpaceFeature[] = ['covered', 'gate', 'camera', 'ev_charger']

/** Step 2 of 4: map and list of garages near the venue, with live availability. */
export default function SpacesPage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { search } = useLocation()
  const { venueId, window } = useTrip()
  const venues = useVenues()
  const spaces = useSpaces(venueId, window)
  const [filters, setFilters] = useState<SpaceFeature[]>([])
  const [sheet, setSheet] = useState<SheetState>('half')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [hoverId, setHoverId] = useState<string | null>(null)

  const venue = venues.data?.find((v) => v.id === venueId)

  const visible = useMemo(() => {
    const matching = (spaces.data ?? []).filter((s) => filters.every((f) => s.features.includes(f)))
    // Free garages first, taken ones after; each group keeps the nearest-first order from the server.
    return [...matching.filter((s) => s.available), ...matching.filter((s) => !s.available)]
  }, [spaces.data, filters])
  const availableCount = visible.filter((s) => s.available).length

  // A pin tap highlights its card and brings it into view.
  useEffect(() => {
    if (!selectedId) return
    document.getElementById(`space-${selectedId}`)?.scrollIntoView?.({ block: 'nearest' })
  }, [selectedId, sheet])

  if (!venueId || !window) return <Navigate to="/" replace />

  const pins = venue
    ? visible.map((s) => ({
        id: s.id,
        title: s.title,
        priceCents: s.priceCentsPerHour,
        unavailable: !s.available,
        ...toMapPercent(venue.location, s.location, venue.radiusM),
      }))
    : []
  const lang = i18n.language
  const range = t('driver.spaces.window', {
    from: formatDateTime(window.startsAt, lang, {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }),
    to: formatDateTime(window.endsAt, lang, {
      weekday: 'short',
      hour: 'numeric',
      minute: '2-digit',
    }),
  })

  const toggle = (f: SpaceFeature) =>
    setFilters((cur) => (cur.includes(f) ? cur.filter((x) => x !== f) : [...cur, f]))

  const open = (id: string) => navigate(`/spaces/${id}${search}`)

  const body = spaces.isPending ? (
    <div role="status" aria-label={t('driver.spaces.loading')} className="space-y-3 pt-2">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
  ) : spaces.isError ? (
    <EmptyState
      icon={<SearchX className="size-6" />}
      title={t('driver.spaces.error')}
      body={t('errors.code.unknown')}
      action={
        <Button variant="secondary" size="md" onClick={() => spaces.refetch()}>
          {t('common.retry')}
        </Button>
      }
    />
  ) : visible.length === 0 ? (
    <EmptyState
      icon={<SearchX className="size-6" />}
      title={t('driver.spaces.emptyTitle')}
      body={t('driver.spaces.emptyBody')}
      action={
        <Button variant="secondary" size="md" onClick={() => setFilters([])}>
          {t('driver.spaces.clearFilters')}
        </Button>
      }
    />
  ) : null

  return (
    <div className="flex h-dvh flex-col">
      <WizardHeader
        title={t('driver.spaces.title', { venue: venue?.name ?? '' })}
        step={2}
        wide
        onBack={() => navigate('/')}
      />
      <MapListLayout
        className="min-h-0 flex-1"
        map={
          <MapPlaceholder
            pins={pins}
            venue={{ x: 50, y: 50 }}
            activeId={selectedId ?? hoverId}
            onSelect={(id) => {
              setSelectedId(id)
              setSheet((s) => (s === 'peek' ? 'half' : s))
            }}
          />
        }
        sheet={
          <BottomSheet
            label={t('driver.spaces.sheet')}
            state={sheet}
            onStateChange={setSheet}
            summary={
              <div className="space-y-2 pb-1">
                <p className="font-display text-title font-semibold" role="status">
                  {spaces.data ? t('driver.spaces.summary', { count: availableCount }) : ' '}
                </p>
                <p className="text-caption text-ink-muted">{range}</p>
                <div
                  role="group"
                  aria-label={t('driver.spaces.filters')}
                  className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 [scrollbar-width:none]"
                >
                  {FILTERS.map((f) => (
                    <Chip key={f} selected={filters.includes(f)} onClick={() => toggle(f)}>
                      {t(`features.${f}`)}
                    </Chip>
                  ))}
                </div>
              </div>
            }
          >
            {(docked) =>
              body ?? (
                <ul className="space-y-3 pt-2">
                  {visible.map((s) => (
                    <li key={s.id} id={`space-${s.id}`}>
                      <SpaceCard
                        layout={docked ? 'stacked' : 'row'}
                        title={s.title}
                        distanceLabel={t('driver.spaces.distance', {
                          distance: formatDistance(s.distanceM, lang),
                        })}
                        priceCents={s.priceCentsPerHour}
                        rating={s.rating}
                        reviewCount={s.reviewCount}
                        photoUrl={s.photoUrls[0]}
                        selected={selectedId === s.id}
                        unavailableLabel={s.available ? undefined : t('driver.spaces.unavailable')}
                        onSelect={() => open(s.id)}
                        onHoverChange={(h) => setHoverId(h ? s.id : null)}
                        tags={s.features.slice(0, 3).map((f) => (
                          <Badge key={f}>{t(`features.${f}`)}</Badge>
                        ))}
                      />
                    </li>
                  ))}
                </ul>
              )
            }
          </BottomSheet>
        }
      />
    </div>
  )
}
