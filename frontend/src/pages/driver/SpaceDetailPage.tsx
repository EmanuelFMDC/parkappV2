import { BadgeCheck, MapPin, Ruler, Star } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import { StickyBar } from '../../components/layout/StickyBar'
import { WizardHeader } from '../../components/layout/WizardHeader'
import {
  Badge,
  Button,
  EmptyState,
  PriceTag,
  Rating,
  Skeleton,
  SpaceImage,
} from '../../components/ui'
import { useAccount } from '../../features/account/hooks'
import { fits } from '../../features/account/vehicleFit'
import { useQuote, useReviews, useSpace, useSpaces } from '../../features/spaces/hooks'
import { useTrip } from '../../features/trip/useTrip'
import { formatCents } from '../../lib/money'
import { formatDateTime } from '../../lib/time'

/** Step 2 of 4, continued: everything a driver needs to trust a garage before booking it. */
export default function SpaceDetailPage() {
  const { spaceId } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { search } = useLocation()
  const { venueId, window } = useTrip()
  const space = useSpace(spaceId)
  const reviews = useReviews(spaceId)
  const quote = useQuote(spaceId, window)
  const live = useSpaces(venueId, window)
  const account = useAccount()

  if (!venueId || !window) return <Navigate to="/" replace />

  const backToList = () => navigate(`/venues/${venueId}/spaces${search}`)
  const lang = i18n.language
  const data = space.data
  const taken = live.data?.find((s) => s.id === spaceId)?.available === false
  const ready = account.stage === 'ready'
  // Only worth warning once we know the driver's cars: none of them fits this garage.
  const noneFits =
    ready && Boolean(data) && !account.me!.vehicles.some((v) => fits(v, data!.vehicleTypes))
  const timeUrl = `/book/${spaceId}/time${search}`
  // Step 3 needs an account: anyone without one is sent to create it, then returns to step 3.
  const goNext = () =>
    navigate(ready ? timeUrl : `/account/new?next=${encodeURIComponent(timeUrl)}`)

  if (space.isError) {
    return (
      <>
        <WizardHeader title={t('driver.detail.notFoundTitle')} step={2} onBack={backToList} />
        <Page>
          <EmptyState
            icon={<MapPin className="size-6" />}
            title={t('driver.detail.notFoundTitle')}
            body={t('driver.detail.notFoundBody')}
            action={<Button onClick={backToList}>{t('driver.detail.backToList')}</Button>}
          />
        </Page>
      </>
    )
  }

  return (
    <>
      <WizardHeader title={data?.title ?? t('common.loading')} step={2} onBack={backToList} />
      <Page withBar className="space-y-6">
        {!data ? (
          <div role="status" aria-label={t('common.loading')} className="space-y-4">
            <Skeleton className="aspect-[4/3] w-full" />
            <Skeleton className="h-6 w-2/3" />
            <Skeleton className="h-24 w-full" />
          </div>
        ) : (
          <>
            <SpaceImage
              url={data.photoUrls[0]}
              alt={data.title}
              className="aspect-[4/3] w-full overflow-hidden rounded-surface sm:aspect-[16/9]"
            />

            <div className="flex flex-wrap items-center justify-between gap-3">
              <PriceTag cents={data.priceCentsPerHour} size="lg" />
              <Rating value={data.rating} count={data.reviewCount} />
            </div>

            {taken && (
              <p
                role="alert"
                className="rounded-control bg-danger-50 p-4 font-medium text-danger-600"
              >
                {t('driver.detail.unavailable')}
              </p>
            )}

            {noneFits && (
              <p
                role="alert"
                className="rounded-control bg-danger-50 p-4 font-medium text-danger-600"
              >
                {t('driver.detail.vehicleNoFit')}
              </p>
            )}

            <section
              aria-label={t('driver.detail.host', { name: data.host.displayName })}
              className="space-y-2"
            >
              <p className="flex flex-wrap items-center gap-2 font-semibold">
                {t('driver.detail.host', { name: data.host.displayName })}
                {data.host.verified && (
                  <Badge tone="brand" icon={<BadgeCheck className="size-3.5" />}>
                    {t('driver.detail.verified')}
                  </Badge>
                )}
              </p>
              <p className="text-caption text-ink-muted">
                {t('driver.detail.memberSince', {
                  date: formatDateTime(`${data.host.memberSince}T12:00:00Z`, lang, {
                    month: 'long',
                    year: 'numeric',
                  }),
                })}
              </p>
            </section>

            <ul className="flex flex-wrap gap-2">
              {data.features.map((f) => (
                <li key={f}>
                  <Badge>{t(`features.${f}`)}</Badge>
                </li>
              ))}
            </ul>

            <section aria-labelledby="about-title" className="space-y-2">
              <h2 id="about-title" className="text-title font-semibold">
                {t('driver.detail.about')}
              </h2>
              <p className="max-w-[62ch] text-ink-muted">{data.description}</p>
            </section>

            <section aria-labelledby="size-title" className="space-y-2">
              <h2 id="size-title" className="text-title font-semibold">
                {t('driver.detail.size')}
              </h2>
              <p className="flex items-center gap-2">
                <Ruler aria-hidden className="size-5 text-primary" />
                {t('driver.detail.sizeValue', {
                  length: data.dimensions.lengthCm,
                  width: data.dimensions.widthCm,
                  height: data.dimensions.heightCm,
                })}
              </p>
              <p className="text-ink-muted">
                {t('driver.detail.fits')}:{' '}
                {data.vehicleTypes.map((v) => t(`vehicles.${v}`)).join(', ')}
              </p>
              <p className="text-caption text-ink-muted">{t('driver.detail.addressNote')}</p>
            </section>

            <section aria-labelledby="reviews-title" className="space-y-3">
              <h2 id="reviews-title" className="text-title font-semibold">
                {t('driver.detail.reviews')}
              </h2>
              {reviews.data && reviews.data.length === 0 && (
                <p className="text-ink-muted">{t('driver.detail.reviewsEmpty')}</p>
              )}
              <ul className="space-y-3">
                {reviews.data?.map((r) => (
                  <li key={r.id} className="rounded-surface bg-surface p-4 ring-1 ring-line">
                    <p className="flex items-center gap-2 text-caption font-semibold">
                      <Star aria-hidden className="size-4 fill-action text-action" />
                      <span className="sr-only">
                        {t('ui.rating', { value: r.rating, count: 1 })}
                      </span>
                      <span aria-hidden>{r.rating}</span>
                      <span className="font-normal text-ink-muted">
                        {r.authorName} ·{' '}
                        {formatDateTime(r.createdAt, lang, { month: 'short', year: 'numeric' })}
                      </span>
                    </p>
                    <p className="mt-1.5">{r.comment}</p>
                  </li>
                ))}
              </ul>
            </section>
          </>
        )}
      </Page>

      <StickyBar>
        <div className="min-w-0">
          <p className="text-caption text-ink-muted">{t('driver.detail.total')}</p>
          <p className="font-display text-title font-bold tabular-nums">
            {quote.data ? formatCents(quote.data.totalCents, lang) : '—'}
          </p>
        </div>
        <Button disabled={!data || taken || noneFits || account.loading} onClick={goNext}>
          {ready || account.loading
            ? t('driver.detail.continue')
            : t('driver.detail.createAccount')}
        </Button>
      </StickyBar>
    </>
  )
}
