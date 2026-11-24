import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'
import { Checkbox } from '../../components/ui'
import { AvailabilityField } from '../../features/host/AvailabilityField'
import { HostStepFrame } from '../../features/host/HostStepFrame'
import { stepPath, useStepGuard } from '../../features/host/steps'
import { useHostDraft } from '../../features/host/draft'
import { useCreateHostSpace } from '../../features/host/hooks'
import {
  buildCreateInput,
  stepForErrorCode,
  validatePrice,
  type FieldProblem,
} from '../../features/host/validate'
import { useVenues } from '../../features/venues/hooks'
import { ApiProblem } from '../../api/unwrap'
import { errorMessage } from '../../lib/errors'
import { distanceM } from '../../lib/geo'
import { formatCents } from '../../lib/money'
import { tariffFor, type Tariff } from '../../lib/tariffs'

const EXAMPLE_HOURS = 4

/** Step 4 of 4 for hosts: what they earn (ParkApp sets the price), when they rent it, and publishing. */
export default function PriceStep() {
  const { t, i18n } = useTranslation()
  const { draft, patch, clear } = useHostDraft()
  const guard = useStepGuard('price', draft)
  const create = useCreateHostSpace()
  const venues = useVenues()
  // Once published the draft is cleared, and the step guard would bounce the host back to step 1.
  const [published, setPublished] = useState(false)
  const [problem, setProblem] = useState<FieldProblem | null>(null)
  const err = (field: string) =>
    problem?.field === field ? t(`errors.code.${problem.code}`) : undefined

  if (published) return <Navigate to="/host/new/done" replace />
  if (guard) return <>{guard}</>

  const lang = i18n.language
  const venue = venues.data?.find((v) => v.id === draft.venueId)
  const tariff: Tariff | null =
    venue && draft.location && draft.municipality
      ? tariffFor({
          venueId: venue.id,
          distanceM: distanceM(draft.location, venue.location),
          radiusM: venue.radiusM,
          municipality: draft.municipality,
        })
      : null

  const change = (changes: Parameters<typeof patch>[0]) => {
    setProblem(null)
    create.reset()
    patch(changes)
  }

  const publish = () => {
    const found = validatePrice(draft)
    setProblem(found)
    const input = buildCreateInput(draft)
    if (found || !input) return
    create.mutate(input, {
      onSuccess: () => {
        setPublished(true)
        clear()
      },
    })
  }

  const failedStep = create.error instanceof ApiProblem ? stepForErrorCode(create.error.code) : null

  return (
    <HostStepFrame
      step="price"
      title={t('host.price.title')}
      intro={t('host.price.intro')}
      onNext={publish}
      nextLabel={create.isPending ? t('host.price.publishing') : t('host.price.publish')}
      nextLoading={create.isPending}
    >
      {tariff && (
        <section
          aria-labelledby="earn-title"
          className="space-y-2 rounded-surface bg-primary-soft p-5"
        >
          <h2 id="earn-title" className="text-caption font-semibold text-ink-muted">
            {t('host.price.earnTitle')}
          </h2>
          <p className="font-display text-headline font-bold tabular-nums">
            {t('host.price.perHour', { amount: formatCents(tariff.hourlyCents, lang) })}
          </p>
          <p className="text-ink-muted">
            {tariff.zone === 'venue'
              ? t('host.price.zoneVenue', {
                  venue: venue!.name,
                  surcharge: formatCents(tariff.zoneSurchargeCents, lang),
                })
              : t('host.price.zoneMunicipality', { municipality: draft.municipality })}
          </p>
          <p>
            {t('host.price.example', {
              total: formatCents(
                tariff.hourlyCents * EXAMPLE_HOURS + tariff.zoneSurchargeCents,
                lang,
              ),
            })}
          </p>
          <p className="text-caption text-ink-muted">{t('host.price.feeNote')}</p>
          <p className="text-caption text-ink-muted">{t('host.price.provisional')}</p>
        </section>
      )}

      <section
        aria-labelledby="summary-title"
        className="space-y-2 rounded-surface bg-surface p-5 ring-1 ring-line"
      >
        <h2 id="summary-title" className="text-title font-semibold">
          {t('host.price.summary')}
        </h2>
        <p className="font-semibold">
          {t('host.price.spotsLine', { count: Number(draft.quantity) || 1 })}
        </p>
        <p className="text-ink-muted">
          {draft.street}, {draft.neighborhood}, {draft.municipality}
        </p>
        <p className="text-ink-muted">
          {t('host.price.sizeLine', {
            length: draft.lengthCm,
            width: draft.widthCm,
            height: draft.heightCm,
          })}
        </p>
        <p className="text-ink-muted">
          {t('host.price.photosLine', { count: draft.photos.length })}
        </p>
      </section>

      <AvailabilityField
        value={draft.availability}
        onChange={(availability) => change({ availability })}
        error={err('availability')}
      />

      <Checkbox
        label={t('host.price.terms')}
        checked={draft.acceptTerms}
        error={err('terms')}
        onChange={(e) => change({ acceptTerms: e.target.checked })}
      />

      <Link
        to="/terms"
        className="-mt-2 inline-flex h-touch items-center text-caption font-semibold text-primary underline underline-offset-4"
      >
        {t('terms.link')}
      </Link>

      {create.error && (
        <div role="alert" className="space-y-2 rounded-control bg-danger-50 p-4 text-danger-600">
          <p className="font-medium">{errorMessage(t, create.error)}</p>
          {failedStep && (
            <Link
              to={stepPath(failedStep)}
              className="inline-flex h-touch items-center font-semibold underline underline-offset-4"
            >
              {t('host.price.fix')}
            </Link>
          )}
        </div>
      )}
    </HostStepFrame>
  )
}
