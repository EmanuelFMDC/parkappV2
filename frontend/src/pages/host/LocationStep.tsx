import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { Input, Select } from '../../components/ui'
import { HostStepFrame } from '../../features/host/HostStepFrame'
import { stepPath } from '../../features/host/steps'
import { useHostDraft } from '../../features/host/draft'
import { PinPicker } from '../../features/host/PinPicker'
import { defaultPin } from '../../features/host/pin'
import { validateLocation, type FieldProblem } from '../../features/host/validate'
import { useVenues } from '../../features/venues/hooks'
import { MUNICIPALITIES } from '../../lib/hostRules'

/** Step 1 of 4 for hosts: where the space is. */
export default function LocationStep() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { draft, patch } = useHostDraft()
  const venues = useVenues()
  const [problem, setProblem] = useState<FieldProblem | null>(null)
  const venue = venues.data?.find((v) => v.id === draft.venueId)
  const err = (field: string) =>
    problem?.field === field ? t(`errors.code.${problem.code}`) : undefined

  const change = (changes: Parameters<typeof patch>[0]) => {
    setProblem(null)
    patch(changes)
  }

  const next = () => {
    const found = validateLocation(draft, venue)
    setProblem(found)
    if (!found) navigate(stepPath('size'))
  }

  return (
    <HostStepFrame
      step="location"
      title={t('host.location.title')}
      intro={t('host.location.intro')}
      onNext={next}
      nextLabel={t('host.next')}
    >
      <Select
        label={t('host.location.venue')}
        value={draft.venueId}
        error={err('venue')}
        onChange={(e) => {
          const chosen = venues.data?.find((v) => v.id === e.target.value)
          // A new venue means a new map: start the pin near it.
          change({ venueId: e.target.value, location: chosen ? defaultPin(chosen) : null })
        }}
      >
        <option value="">{t('host.location.venuePlaceholder')}</option>
        {venues.data?.map((v) => (
          <option key={v.id} value={v.id}>
            {v.name}
          </option>
        ))}
      </Select>

      <Input
        label={t('host.location.street')}
        autoComplete="street-address"
        value={draft.street}
        error={err('street')}
        onChange={(e) => change({ street: e.target.value })}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label={t('host.location.neighborhood')}
          value={draft.neighborhood}
          error={err('neighborhood')}
          onChange={(e) => change({ neighborhood: e.target.value })}
        />
        <Select
          label={t('host.location.municipality')}
          value={draft.municipality}
          error={err('municipality')}
          onChange={(e) =>
            change({ municipality: e.target.value as (typeof MUNICIPALITIES)[number] })
          }
        >
          <option value="">{t('host.location.municipalityPlaceholder')}</option>
          {MUNICIPALITIES.map((m) => (
            <option key={m} value={m}>
              {m}
            </option>
          ))}
        </Select>
      </div>
      <Input
        label={t('host.location.references')}
        hint={t('host.location.referencesHint')}
        value={draft.references}
        onChange={(e) => change({ references: e.target.value })}
      />

      <section aria-labelledby="pin-title" className="space-y-3">
        <h2 id="pin-title" className="text-title font-semibold">
          {t('host.location.pinTitle')}
        </h2>
        <PinPicker
          venue={venue}
          value={draft.location}
          onChange={(location) => change({ location })}
          error={err('location')}
        />
        <p className="text-caption text-ink-muted">{t('host.location.privacy')}</p>
      </section>
    </HostStepFrame>
  )
}
