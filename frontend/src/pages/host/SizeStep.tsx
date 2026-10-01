import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { SpaceFeature, VehicleType } from '../../api/types'
import { Checkbox, Input } from '../../components/ui'
import { HostStepFrame } from '../../features/host/HostStepFrame'
import { stepPath, useStepGuard } from '../../features/host/steps'
import { useHostDraft } from '../../features/host/draft'
import { dimensionsOf, validateSize, type FieldProblem } from '../../features/host/validate'
import { DIMENSION_LIMITS, VEHICLE_TYPES, suggestVehicleTypes } from '../../lib/hostRules'

const FEATURES: SpaceFeature[] = ['covered', 'gate', 'camera', 'ev_charger', 'lit']

/** Step 2 of 4 for hosts: how big the space is and what it offers. */
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
    const next = { ...draft, [key]: value }
    // Until the host picks car types by hand, they follow the measurements.
    const d = dimensionsOf(next)
    const suggested = [d.lengthCm, d.widthCm, d.heightCm].every(Number.isFinite)
      ? suggestVehicleTypes(d)
      : []
    patch({ [key]: value, ...(draft.typesTouched ? {} : { vehicleTypes: suggested }) })
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
  const nothingFits = measured && suggestVehicleTypes(d).length === 0

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
          {t('host.size.noSuggestion')}
        </p>
      )}

      <fieldset className="space-y-1">
        <legend className="text-title font-semibold">{t('host.size.types')}</legend>
        <p className="pb-2 text-caption text-ink-muted">{t('host.size.typesHint')}</p>
        {VEHICLE_TYPES.map((type: VehicleType) => (
          <Checkbox
            key={type}
            label={t(`vehicles.${type}`)}
            checked={draft.vehicleTypes.includes(type)}
            onChange={() => {
              setProblem(null)
              patch({ vehicleTypes: toggle(draft.vehicleTypes, type), typesTouched: true })
            }}
          />
        ))}
        {err('types') && (
          <p role="alert" className="text-caption font-medium text-danger-600">
            {err('types')}
          </p>
        )}
      </fieldset>

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
