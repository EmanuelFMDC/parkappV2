import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { SpaceFeature } from '../../api/types'
import { Checkbox, Input } from '../../components/ui'
import { HostStepFrame } from '../../features/host/HostStepFrame'
import { stepPath, useStepGuard } from '../../features/host/steps'
import { useHostDraft } from '../../features/host/draft'
import { dimensionsOf, validateSize, type FieldProblem } from '../../features/host/validate'
import {
  DIMENSION_LIMITS,
  QUANTITY_MAX,
  QUANTITY_MIN,
  suggestVehicleTypes,
} from '../../lib/hostRules'

const FEATURES: SpaceFeature[] = ['covered', 'gate', 'camera', 'ev_charger', 'lit']

/** Step 2 of 4 for hosts: how big the space is, how many identical spots, and what it offers. */
export default function SizeStep() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { draft, patch } = useHostDraft()
  const guard = useStepGuard('size', draft)
  const [problem, setProblem] = useState<FieldProblem | null>(null)
  const err = (field: string) =>
    problem?.field === field ? t(`errors.code.${problem.code}`) : undefined

  if (guard) return <>{guard}</>

  const range = (key: keyof typeof DIMENSION_LIMITS) =>
    t('host.size.range', { min: DIMENSION_LIMITS[key].min, max: DIMENSION_LIMITS[key].max })

  const setDimension = (key: 'lengthCm' | 'widthCm' | 'heightCm', value: string) => {
    setProblem(null)
    patch({ [key]: value })
  }

  const toggle = <T extends string>(list: T[], item: T) =>
    list.includes(item) ? list.filter((x) => x !== item) : [...list, item]

  const next = () => {
    const found = validateSize(draft)
    setProblem(found)
    if (!found) navigate(stepPath('photos'))
  }

  const d = dimensionsOf(draft)
  const measured = [d.lengthCm, d.widthCm, d.heightCm].every(Number.isFinite)
  const fits = measured ? suggestVehicleTypes(d) : []
  const nothingFits = measured && fits.length === 0

  return (
    <HostStepFrame
      step="size"
      title={t('host.size.title')}
      intro={t('host.size.intro')}
      onNext={next}
      nextLabel={t('host.next')}
    >
      <div className="grid gap-5 sm:grid-cols-3">
        <Input
          label={t('host.size.length')}
          hint={range('lengthCm')}
          inputMode="numeric"
          value={draft.lengthCm}
          error={err('length')}
          onChange={(e) => setDimension('lengthCm', e.target.value)}
        />
        <Input
          label={t('host.size.width')}
          hint={range('widthCm')}
          inputMode="numeric"
          value={draft.widthCm}
          error={err('width')}
          onChange={(e) => setDimension('widthCm', e.target.value)}
        />
        <Input
          label={t('host.size.height')}
          hint={range('heightCm')}
          inputMode="numeric"
          value={draft.heightCm}
          error={err('height')}
          onChange={(e) => setDimension('heightCm', e.target.value)}
        />
      </div>
      {nothingFits && (
        <p className="rounded-control bg-warning-50 p-4 font-medium text-warning-700">
          {t('errors.code.fits_no_car')}
        </p>
      )}

      {fits.length > 0 && (
        <p className="rounded-control bg-primary-soft p-4">
          <span className="font-semibold">{t('host.size.fitsTitle')}</span>{' '}
          {fits.map((type) => t(`vehicles.${type}`)).join(', ')}.{' '}
          <span className="text-ink-muted">{t('host.size.fitsHint')}</span>
        </p>
      )}

      <Input
        label={t('host.size.quantity')}
        hint={t('host.size.quantityHint', { min: QUANTITY_MIN, max: QUANTITY_MAX })}
        inputMode="numeric"
        value={draft.quantity}
        error={err('quantity')}
        onChange={(e) => {
          setProblem(null)
          patch({ quantity: e.target.value })
        }}
      />

      <fieldset className="space-y-1">
        <legend className="pb-2 text-title font-semibold">{t('host.size.features')}</legend>
        {FEATURES.map((feature) => (
          <Checkbox
            key={feature}
            label={t(`features.${feature}`)}
            checked={draft.features.includes(feature)}
            onChange={() => patch({ features: toggle(draft.features, feature) })}
          />
        ))}
      </fieldset>
    </HostStepFrame>
  )
}
