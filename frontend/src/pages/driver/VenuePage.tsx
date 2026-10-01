import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import { StickyBar } from '../../components/layout/StickyBar'
import { Button, Logo, RadioCard, Skeleton, StepIndicator } from '../../components/ui'
import { HostPitch } from '../../features/host/HostPitch'
import { tripSearch } from '../../features/trip/useTrip'
import { useVenueEvents, useVenues } from '../../features/venues/hooks'
import { formatDateTime } from '../../lib/time'

/** Arrive two hours before the event starts and stay up to one hour after it ends. */
const LEAD_MS = 2 * 3_600_000
const TAIL_MS = 3_600_000

/** Step 1 of 4: choose the venue and the event. */
export default function VenuePage() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const venues = useVenues()
  const [venueId, setVenueId] = useState<string>()
  const [eventId, setEventId] = useState<string>()
  const events = useVenueEvents(venueId)
  const venue = venues.data?.find((v) => v.id === venueId)
  const event = events.data?.find((e) => e.id === eventId)
  const steps = (['venue', 'space', 'time', 'pay'] as const).map((k) => t(`wizard.steps.${k}`))

  const continueToSpaces = () => {
    if (!venue || !event) return
    navigate(
      `/venues/${venue.id}/spaces${tripSearch({
        venueId: venue.id,
        startsAt: new Date(Date.parse(event.startsAt) - LEAD_MS).toISOString(),
        endsAt: new Date(Date.parse(event.endsAt) + TAIL_MS).toISOString(),
      })}`,
    )
  }

  return (
    <>
      <Page withBar className="@container space-y-8 pt-6">
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
            <div
              role="radiogroup"
              aria-labelledby="venues-title"
              className="grid gap-3 sm:grid-cols-2"
            >
              {venues.data.map((v) => (
                <RadioCard
                  key={v.id}
                  name="venue"
                  value={v.id}
                  checked={venueId === v.id}
                  onChange={(id) => {
                    setVenueId(id)
                    setEventId(undefined)
                  }}
                >
                  <span className="block font-semibold">{v.name}</span>
                  <span className="block text-caption text-ink-muted">{v.area}</span>
                </RadioCard>
              ))}
            </div>
          )}
        </section>

        <section aria-labelledby="events-title" aria-live="polite" className="space-y-3">
          <h2 id="events-title" className="text-title font-semibold">
            {venue ? t('driver.venue.events', { venue: venue.name }) : t('driver.venue.pickVenue')}
          </h2>
          {venue && events.isPending && <Skeleton className="h-16 w-full" />}
          {venue && events.data?.length === 0 && (
            <p className="text-ink-muted">{t('driver.venue.eventsEmpty')}</p>
          )}
          {venue && events.data && events.data.length > 0 && (
            <div role="radiogroup" aria-labelledby="events-title" className="space-y-3">
              {events.data.map((e) => (
                <RadioCard
                  key={e.id}
                  name="event"
                  value={e.id}
                  checked={eventId === e.id}
                  onChange={setEventId}
                >
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
                </RadioCard>
              ))}
            </div>
          )}
          {event && <p className="text-caption text-ink-muted">{t('driver.venue.arrive')}</p>}
        </section>

        <HostPitch />
      </Page>

      <StickyBar aboveNav>
        <p className="min-w-0 flex-1 truncate text-caption text-ink-muted">
          {event ? `${venue?.name} · ${event.title}` : t('driver.venue.ctaHint')}
        </p>
        <Button disabled={!event} onClick={continueToSpaces}>
          {t('driver.venue.cta')}
        </Button>
      </StickyBar>
    </>
  )
}
