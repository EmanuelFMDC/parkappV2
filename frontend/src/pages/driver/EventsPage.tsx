import { CalendarDays, ChevronRight } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import { EmptyState, Skeleton, StepIndicator, TopBar } from '../../components/ui'
import { tripSearch } from '../../features/trip/useTrip'
import { useVenueEvents, useVenues } from '../../features/venues/hooks'
import { ceilToHour, floorToHour, formatDateTime } from '../../lib/time'

/** Arrive two hours before the event starts and stay up to one hour after it ends. */
const LEAD_MS = 2 * 3_600_000
const TAIL_MS = 3_600_000

/** Step 1 of 4, second screen: the venue's upcoming events. Tapping one shows its garages. */
export default function EventsPage() {
  const { venueId } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const venues = useVenues()
  const events = useVenueEvents(venueId)
  const venue = venues.data?.find((v) => v.id === venueId)
  const steps = (['venue', 'space', 'time', 'pay'] as const).map((k) => t(`wizard.steps.${k}`))

  const spacesFor = (event: { startsAt: string; endsAt: string }) =>
    `/venues/${venueId}/spaces${tripSearch({
      venueId: venueId!,
      // Bookings are whole hours: widen the window to the hour on both ends.
      startsAt: floorToHour(new Date(Date.parse(event.startsAt) - LEAD_MS).toISOString()),
      endsAt: ceilToHour(new Date(Date.parse(event.endsAt) + TAIL_MS).toISOString()),
    })}`

  return (
    <>
      <TopBar title={venue?.name ?? t('common.loading')} as="p" onBack={() => navigate('/')} />
      <Page className="space-y-6">
        <header className="space-y-4">
          <StepIndicator steps={steps} current={1} />
          <div className="space-y-2">
            <h1 className="text-headline font-bold">{t('driver.venue.eventsTitle')}</h1>
            <p className="max-w-[52ch] text-ink-muted">{t('driver.venue.arrive')}</p>
          </div>
        </header>

        {events.isPending ? (
          <div role="status" aria-label={t('common.loading')} className="space-y-3">
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-20 w-full" />
          </div>
        ) : events.isError || events.data.length === 0 ? (
          <EmptyState
            icon={<CalendarDays className="size-6" />}
            title={t('driver.venue.eventsEmpty')}
            body={t('driver.venue.eventsEmptyBody')}
          />
        ) : (
          <ul className="space-y-3">
            {events.data.map((e) => (
              <li key={e.id}>
                <Link
                  to={spacesFor(e)}
                  className="flex min-h-touch-lg items-center gap-4 rounded-surface bg-surface p-4 ring-1 ring-line transition-colors hover:bg-canvas active:bg-primary-soft"
                >
                  <CalendarDays aria-hidden className="size-6 shrink-0 text-primary" />
                  <span className="min-w-0 flex-1">
                    <span className="block font-semibold">{e.title}</span>
                    <span className="block text-caption text-ink-muted">
                      {formatDateTime(e.startsAt, i18n.language, {
                        weekday: 'long',
                        day: 'numeric',
                        month: 'long',
                        hour: 'numeric',
                        minute: '2-digit',
                      })}
                    </span>
                  </span>
                  <ChevronRight aria-hidden className="size-5 shrink-0 text-ink-muted" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Page>
    </>
  )
}
