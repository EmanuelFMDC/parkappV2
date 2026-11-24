import { ChevronRight, MapPin } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import { Logo, Skeleton, StepIndicator } from '../../components/ui'
import { HostPitch } from '../../features/host/HostPitch'
import { useVenues } from '../../features/venues/hooks'

/** Step 1 of 4, first screen: choose the venue. Tapping one opens its events on a new screen. */
export default function VenuePage() {
  const { t } = useTranslation()
  const venues = useVenues()
  const steps = (['venue', 'space', 'time', 'pay'] as const).map((k) => t(`wizard.steps.${k}`))

  return (
    <Page className="@container space-y-8 pt-6">
      <header className="space-y-4">
        <Logo />
        <StepIndicator steps={steps} current={1} />
        <div className="space-y-2">
          <h1 className="text-headline font-bold">{t('driver.venue.title')}</h1>
          <p className="max-w-[52ch] text-ink-muted">{t('driver.venue.intro')}</p>
        </div>
      </header>

      <section aria-labelledby="venues-title" className="space-y-3">
        <h2 id="venues-title" className="text-title font-semibold">
          {t('driver.venue.venues')}
        </h2>
        {venues.isPending ? (
          <div role="status" aria-label={t('common.loading')} className="space-y-3">
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </div>
        ) : venues.isError ? (
          <p role="alert" className="text-danger-600">
            {t('errors.code.unknown')}{' '}
            <button
              type="button"
              className="font-semibold underline"
              onClick={() => venues.refetch()}
            >
              {t('common.retry')}
            </button>
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {venues.data.map((v) => (
              <li key={v.id}>
                <Link
                  to={`/venues/${v.id}`}
                  className="flex min-h-touch-lg items-center gap-4 rounded-surface bg-surface p-4 ring-1 ring-line transition-colors hover:bg-canvas active:bg-primary-soft"
                >
                  <MapPin aria-hidden className="size-6 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{v.name}</span>
                    <span className="block text-caption text-ink-muted">{v.area}</span>
                  </span>
                  <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <HostPitch />
    </Page>
  )
}
