import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Link, Navigate } from 'react-router-dom'
import { Checkbox, Input } from '../../components/ui'
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
import { ApiProblem } from '../../api/unwrap'
import { errorMessage } from '../../lib/errors'
import { PRICE_MAX_CENTS, PRICE_MIN_CENTS } from '../../lib/hostRules'
import { formatCents, parsePesosToCents } from '../../lib/money'

/** Step 4 of 4 for hosts: the price, a last look, and publishing. */
export default function PriceStep() {
  const { t, i18n } = useTranslation()
  const { draft, patch, clear } = useHostDraft()
  const guard = useStepGuard('price', draft)
  const create = useCreateHostSpace()
  // Once published the draft is cleared, and the step guard would bounce the host back to step 1.
  const [published, setPublished] = useState(false)
  const [problem, setProblem] = useState<FieldProblem | null>(null)
  const err = (field: string) =>
    problem?.field === field ? t(`errors.code.${problem.code}`) : undefined

  if (published) return <Navigate to="/host/new/done" replace />
  if (guard) return <>{guard}</>

  const lang = i18n.language
  const cents = parsePesosToCents(draft.price)
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
      <Input
        label={t('host.price.label')}
        hint={t('host.price.hint', {
          min: formatCents(PRICE_MIN_CENTS, lang),
          max: formatCents(PRICE_MAX_CENTS, lang),
        })}
        inputMode="decimal"
        value={draft.price}
        error={err('price')}
        onChange={(e) => change({ price: e.target.value })}
      />
      {cents !== null && cents >= PRICE_MIN_CENTS && cents <= PRICE_MAX_CENTS && (
        <p className="-mt-2 text-ink-muted">
          {t('host.price.example', { total: formatCents(cents * 4, lang) })}
        </p>
      )}
      <p className="text-caption text-ink-muted">{t('host.price.feeNote')}</p>

      <section
        aria-labelledby="summary-title"
        className="space-y-2 rounded-surface bg-surface p-5 ring-1 ring-line"
      >
        <h2 id="summary-title" className="text-title font-semibold">
          {t('host.price.summary')}
        </h2>
        <p className="font-semibold">{draft.title}</p>
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

      <Checkbox
        label={t('host.price.terms')}
        checked={draft.acceptTerms}
        error={err('terms')}
        onChange={(e) => change({ acceptTerms: e.target.checked })}
      />

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
