import { CarFront } from 'lucide-react'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import { StickyBar } from '../../components/layout/StickyBar'
import { WizardHeader } from '../../components/layout/WizardHeader'
import { Badge, Button, DateTimeField, RadioCard } from '../../components/ui'
import { useAccount } from '../../features/account/hooks'
import { describeVehicle, fits, pickVehicle } from '../../features/account/vehicleFit'
import { WindowSummary } from '../../features/bookings/WindowSummary'
import { useQuote, useSpace, useSpaces } from '../../features/spaces/hooks'
import { tripSearch, useTrip } from '../../features/trip/useTrip'
import { errorMessage } from '../../lib/errors'
import { formatCents } from '../../lib/money'

/** Step 3 of 4: arrival, departure and which of the driver's registered cars, with the exact price. */
export default function TimePage() {
  const { spaceId } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { search } = useLocation()
  const trip = useTrip()
  const { me } = useAccount()
  const space = useSpace(spaceId)
  const [chosenId, setChosenId] = useState<string>()
  const [edited, setEdited] = useState<{ startsAt?: string; endsAt?: string }>({})

  const base = trip.window
  const window = base && {
    startsAt: edited.startsAt ?? base.startsAt,
    endsAt: edited.endsAt ?? base.endsAt,
  }
  const validWindow =
    window && Date.parse(window.endsAt) > Date.parse(window.startsAt) ? window : null

  const quote = useQuote(spaceId, validWindow)
  const live = useSpaces(trip.venueId, validWindow)

  if (!trip.venueId || !base || !window) return <Navigate to="/" replace />

  const lang = i18n.language
  const vehicles = me?.vehicles ?? []
  const allowed = space.data?.vehicleTypes
  const vehicle = allowed ? pickVehicle(vehicles, allowed, chosenId ?? trip.vehicleId) : undefined
  const noneFits = Boolean(allowed) && !vehicle
  const taken = live.data?.find((s) => s.id === spaceId)?.available === false
  const windowError = !validWindow
    ? t('errors.code.invalid_window')
    : quote.isError
      ? errorMessage(t, quote.error)
      : undefined

  const next = () => {
    if (!vehicle || !validWindow) return
    navigate(
      `/book/${spaceId}/pay${tripSearch({ venueId: trip.venueId, vehicleId: vehicle.id, ...validWindow })}`,
    )
  }

  return (
    <>
      <WizardHeader
        title={t('driver.time.title')}
        step={3}
        onBack={() => navigate(`/spaces/${spaceId}${search}`)}
      />
      <Page withBar className="space-y-6">
        <DateTimeField
          label={t('driver.time.arrival')}
          valueUtc={window.startsAt}
          onChange={(startsAt) => setEdited((e) => ({ ...e, startsAt }))}
        />
        <DateTimeField
          label={t('driver.time.departure')}
          valueUtc={window.endsAt}
          onChange={(endsAt) => setEdited((e) => ({ ...e, endsAt }))}
        />

        {windowError && (
          <p role="alert" className="rounded-control bg-danger-50 p-4 font-medium text-danger-600">
            {windowError}
          </p>
        )}
        {taken && (
          <p role="alert" className="rounded-control bg-danger-50 p-4 font-medium text-danger-600">
            {t('driver.time.unavailable')}
          </p>
        )}

        <section aria-labelledby="vehicle-title" className="space-y-3">
          <h2 id="vehicle-title" className="text-title font-semibold">
            {t('driver.time.vehicle')}
          </h2>
          {vehicles.length > 1 ? (
            <div role="radiogroup" aria-labelledby="vehicle-title" className="space-y-3">
              {vehicles.map((v) => {
                const ok = !allowed || fits(v, allowed)
                return (
                  <RadioCard
                    key={v.id}
                    name="vehicle"
                    value={v.id}
                    checked={vehicle?.id === v.id}
                    onChange={ok ? setChosenId : () => undefined}
                  >
                    <span className="block font-semibold">{describeVehicle(v)}</span>
                    {!ok && (
                      <span className="mt-1 block">
                        <Badge tone="danger">{t('driver.time.vehicleNoFit')}</Badge>
                      </span>
                    )}
                  </RadioCard>
                )
              })}
            </div>
          ) : vehicles[0] ? (
            <div className="flex items-center gap-3 rounded-surface bg-surface p-4 ring-1 ring-line">
              <CarFront aria-hidden className="size-6 shrink-0 text-primary" />
              <p className="font-semibold">{describeVehicle(vehicles[0])}</p>
            </div>
          ) : null}
          {noneFits && (
            <p
              role="alert"
              className="rounded-control bg-danger-50 p-4 font-medium text-danger-600"
            >
              {t('driver.detail.vehicleNoFit')}
            </p>
          )}
        </section>

        {validWindow && (
          <section
            aria-label={t('driver.pay.summary')}
            className="space-y-3 rounded-surface bg-surface p-5 ring-1 ring-line"
          >
            <WindowSummary window={validWindow} />
            {quote.data && (
              <dl className="space-y-1.5 border-t border-line pt-3 text-ink-muted">
                <div className="flex justify-between">
                  <dt>{t('driver.time.subtotal')}</dt>
                  <dd className="tabular-nums">{formatCents(quote.data.subtotalCents, lang)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt>{t('driver.time.fee')}</dt>
                  <dd className="tabular-nums">{formatCents(quote.data.serviceFeeCents, lang)}</dd>
                </div>
                <div className="flex items-baseline justify-between text-ink">
                  <dt className="font-semibold">{t('driver.time.total')}</dt>
                  <dd className="font-display text-title font-bold tabular-nums">
                    {formatCents(quote.data.totalCents, lang)}
                  </dd>
                </div>
              </dl>
            )}
          </section>
        )}
      </Page>

      <StickyBar>
        <div className="min-w-0">
          <p className="text-caption text-ink-muted">{t('driver.time.total')}</p>
          <p className="font-display text-title font-bold tabular-nums">
            {quote.data ? formatCents(quote.data.totalCents, lang) : '—'}
          </p>
        </div>
        <Button disabled={!quote.data || taken || !vehicle} onClick={next}>
          {t('driver.time.continue')}
        </Button>
      </StickyBar>
    </>
  )
}
