import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import { StickyBar } from '../../components/layout/StickyBar'
import { WizardHeader } from '../../components/layout/WizardHeader'
import { Button, DateTimeField, Input } from '../../components/ui'
import { usePlateDraft } from '../../features/bookings/plateDraft'
import { WindowSummary } from '../../features/bookings/WindowSummary'
import { useQuote, useSpaces } from '../../features/spaces/hooks'
import { tripSearch, useTrip } from '../../features/trip/useTrip'
import { errorMessage } from '../../lib/errors'
import { formatCents } from '../../lib/money'

/** Step 3 of 4: arrival, departure and license plate, with the exact price as it changes. */
export default function TimePage() {
  const { spaceId } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { search } = useLocation()
  const trip = useTrip()
  const [plate, setPlate] = usePlateDraft()
  const [plateError, setPlateError] = useState<string>()
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
  const taken = live.data?.find((s) => s.id === spaceId)?.available === false
  const windowError = !validWindow
    ? t('errors.code.invalid_window')
    : quote.isError
      ? errorMessage(t, quote.error)
      : undefined

  const next = () => {
    if (plate.trim().length < 5) {
      setPlateError(t('driver.time.plateError'))
      return
    }
    setPlateError(undefined)
    navigate(
      `/book/${spaceId}/pay${tripSearch({ venueId: trip.venueId, ...(validWindow as { startsAt: string; endsAt: string }) })}`,
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

        <Input
          label={t('driver.time.plate')}
          hint={t('driver.time.plateHint')}
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={10}
          placeholder="JAL-482-A"
          error={plateError}
        />

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
        <Button disabled={!quote.data || taken} onClick={next}>
          {t('driver.time.continue')}
        </Button>
      </StickyBar>
    </>
  )
}
