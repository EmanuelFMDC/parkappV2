import { CarFront, CreditCard } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate, useLocation, useNavigate, useParams } from 'react-router-dom'
import { Page } from '../../components/layout/Page'
import { StickyBar } from '../../components/layout/StickyBar'
import { WizardHeader } from '../../components/layout/WizardHeader'
import { Button, SpaceImage } from '../../components/ui'
import { useAccount } from '../../features/account/hooks'
import { describeVehicle, pickVehicle } from '../../features/account/vehicleFit'
import { PaymentFailed, usePayAndReserve } from '../../features/bookings/usePayAndReserve'
import { WindowSummary } from '../../features/bookings/WindowSummary'
import { useQuote, useSpace } from '../../features/spaces/hooks'
import { useTrip } from '../../features/trip/useTrip'
import { errorCode, errorMessage } from '../../lib/errors'
import { formatCents } from '../../lib/money'

/** Step 4 of 4: review and pay. The only place a booking is created. */
export default function PayPage() {
  const { spaceId } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { search } = useLocation()
  const { venueId, window, vehicleId } = useTrip()
  const { me } = useAccount()
  const space = useSpace(spaceId)
  const quote = useQuote(spaceId, window)
  const pay = usePayAndReserve()

  if (!venueId || !window) return <Navigate to="/" replace />

  const lang = i18n.language
  const vehicle = space.data
    ? pickVehicle(me?.vehicles ?? [], space.data.vehicleTypes, vehicleId)
    : undefined
  // The space is known and none of the driver's cars was chosen or fits: choose again in step 3.
  if (space.data && !vehicle) return <Navigate to={`/book/${spaceId}/time${search}`} replace />

  const total = quote.data?.totalCents
  const failure = pay.error
  const failureMessage =
    failure instanceof PaymentFailed
      ? t('errors.code.payment_failed')
      : failure
        ? errorMessage(t, failure)
        : null
  const needsAnotherGarage = ['space_unavailable', 'booking_expired'].includes(
    errorCode(failure) ?? '',
  )

  const submit = () => {
    if (!vehicle) return
    pay.mutate(
      {
        spaceId: spaceId!,
        startsAt: window.startsAt,
        endsAt: window.endsAt,
        vehicleId: vehicle.id,
      },
      { onSuccess: (booking) => navigate(`/bookings/${booking.id}?new=1`, { replace: true }) },
    )
  }

  return (
    <>
      <WizardHeader
        title={t('driver.pay.title')}
        step={4}
        onBack={() => navigate(`/book/${spaceId}/time${search}`)}
      />
      <Page withBar className="space-y-6">
        <section
          aria-label={t('driver.pay.summary')}
          className="space-y-4 rounded-surface bg-surface p-5 ring-1 ring-line"
        >
          <div className="flex items-center gap-4">
            <SpaceImage
              url={space.data?.photoUrls[0]}
              className="h-16 w-20 shrink-0 overflow-hidden rounded-control"
            />
            <div className="min-w-0">
              <h2 className="truncate text-title font-semibold">{space.data?.title ?? '…'}</h2>
              <p className="text-caption text-ink-muted">{space.data?.neighborhood}</p>
            </div>
          </div>
          <WindowSummary window={window} />
          {vehicle && (
            <p className="flex items-center gap-2 text-ink-muted">
              <CarFront aria-hidden className="size-5 shrink-0 text-primary" />
              {describeVehicle(vehicle)}
            </p>
          )}
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
          <p className="text-caption text-ink-muted">{t('driver.pay.addressNote')}</p>
        </section>

        <section aria-labelledby="method-title" className="space-y-3">
          <h2 id="method-title" className="text-title font-semibold">
            {t('driver.pay.method')}
          </h2>
          <div className="flex items-center gap-3 rounded-control bg-surface p-4 ring-1 ring-control">
            <CreditCard aria-hidden className="size-6 text-primary" />
            <div>
              <p className="font-semibold">{t('driver.pay.card')}</p>
              <p className="text-caption text-ink-muted">{t('driver.pay.note')}</p>
            </div>
          </div>
          <p className="text-caption text-ink-muted">{t('driver.pay.freeCancel')}</p>
        </section>

        {failureMessage && (
          <div role="alert" className="space-y-2 rounded-control bg-danger-50 p-4 text-danger-600">
            <p className="font-medium">{failureMessage}</p>
            {needsAnotherGarage && (
              <Link
                to={`/venues/${venueId}/spaces${search}`}
                className="inline-flex h-touch items-center font-semibold underline underline-offset-4"
              >
                {t('driver.pay.pickAnother')}
              </Link>
            )}
          </div>
        )}
      </Page>

      <StickyBar>
        <p className="min-w-0 flex-1 truncate text-caption text-ink-muted">
          {t('driver.pay.freeCancel')}
        </p>
        <Button disabled={!vehicle || total === undefined} loading={pay.isPending} onClick={submit}>
          {pay.isPending
            ? t('driver.pay.paying')
            : t('driver.pay.cta', { total: total === undefined ? '' : formatCents(total, lang) })}
        </Button>
      </StickyBar>
    </>
  )
}
