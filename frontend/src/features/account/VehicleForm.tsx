import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { VehicleType } from '../../api/types'
import { Button, Input, Segmented } from '../../components/ui'
import { toFormError } from './fieldErrors'
import { useAddVehicle } from './hooks'

const TYPES: VehicleType[] = ['compact', 'sedan', 'suv', 'pickup']

/** Registers a vehicle. The type decides which garages it fits, so it is not optional. */
export function VehicleForm({
  submitLabel,
  onSaved,
}: {
  submitLabel?: string
  onSaved?: () => void
}) {
  const { t } = useTranslation()
  const add = useAddVehicle()
  const [plate, setPlate] = useState('')
  const [make, setMake] = useState('')
  const [model, setModel] = useState('')
  const [color, setColor] = useState('')
  const [type, setType] = useState<VehicleType>('sedan')
  const error = toFormError(t, add.error)
  const formLevel = error && error.field !== 'plate' ? error.message : undefined

  const submit = (e: FormEvent) => {
    e.preventDefault()
    add.mutate(
      { plate, make, model, color, type },
      {
        onSuccess: () => {
          setPlate('')
          setMake('')
          setModel('')
          setColor('')
          onSaved?.()
        },
      },
    )
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5">
      <Input
        label={t('account.vehicle.plate')}
        hint={t('account.vehicle.plateHint')}
        value={plate}
        onChange={(e) => setPlate(e.target.value.toUpperCase())}
        autoCapitalize="characters"
        autoComplete="off"
        maxLength={10}
        placeholder="JAL-482-A"
        error={error?.field === 'plate' ? error.message : undefined}
      />
      <div className="grid gap-5 sm:grid-cols-2">
        <Input
          label={t('account.vehicle.make')}
          autoComplete="off"
          value={make}
          onChange={(e) => setMake(e.target.value)}
        />
        <Input
          label={t('account.vehicle.model')}
          autoComplete="off"
          value={model}
          onChange={(e) => setModel(e.target.value)}
        />
      </div>
      <Input
        label={t('account.vehicle.color')}
        autoComplete="off"
        value={color}
        onChange={(e) => setColor(e.target.value)}
      />
      <Segmented
        label={t('account.vehicle.type')}
        value={type}
        onChange={setType}
        options={TYPES.map((v) => ({ value: v, label: t(`vehicles.${v}`) }))}
      />
      {formLevel && (
        <p role="alert" className="rounded-control bg-danger-50 p-4 font-medium text-danger-600">
          {formLevel}
        </p>
      )}
      <Button type="submit" block loading={add.isPending}>
        {submitLabel ?? t('account.vehicle.save')}
      </Button>
    </form>
  )
}
