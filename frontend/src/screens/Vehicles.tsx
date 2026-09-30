import { CarFront, Trash2 } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Badge, Button, EmptyState, Input, TopBar } from '../components/ui'
import { useVehicles } from '../lib/vehicles'

export default function Vehicles() {
  const { t } = useTranslation()
  const { vehicles, add, remove } = useVehicles()
  const [plate, setPlate] = useState('')
  const [nickname, setNickname] = useState('')
  const [error, setError] = useState<string>()

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (plate.trim().length < 5) {
      setError(t('booking.plateError'))
      return
    }
    setError(undefined)
    add({ plate: plate.trim(), nickname: nickname.trim() || undefined })
    setPlate('')
    setNickname('')
  }

  return (
    <>
      <TopBar title={t('vehicles.title')} back />
      <div className="space-y-6 px-4">
        {vehicles.length === 0 ? (
          <EmptyState
            icon={<CarFront className="size-6" aria-hidden />}
            title={t('vehicles.emptyTitle')}
            body={t('vehicles.emptyBody')}
          />
        ) : (
          <ul className="divide-y divide-line rounded-surface bg-surface ring-1 ring-line">
            {vehicles.map((v, i) => (
              <li key={v.plate} className="flex items-center gap-3 p-4">
                <CarFront className="size-6 shrink-0 text-primary" aria-hidden />
                <div className="min-w-0 flex-1">
                  <p className="font-display font-bold tabular-nums">{v.plate}</p>
                  {v.nickname && <p className="truncate text-caption text-ink-muted">{v.nickname}</p>}
                </div>
                {i === 0 && <Badge tone="primary">{t('vehicles.default')}</Badge>}
                <button
                  type="button"
                  onClick={() => remove(v.plate)}
                  aria-label={t('vehicles.remove', { plate: v.plate })}
                  className="grid size-11 place-items-center rounded-full text-ink-muted hover:bg-danger-50 hover:text-danger-600"
                >
                  <Trash2 className="size-5" aria-hidden />
                </button>
              </li>
            ))}
          </ul>
        )}

        <form onSubmit={submit} noValidate className="space-y-4">
          <Input
            label={t('vehicles.plate')}
            value={plate}
            onChange={(e) => setPlate(e.target.value.toUpperCase())}
            placeholder={t('booking.platePlaceholder')}
            autoCapitalize="characters"
            autoComplete="off"
            maxLength={10}
            error={error}
          />
          <Input
            label={t('vehicles.nickname')}
            value={nickname}
            onChange={(e) => setNickname(e.target.value)}
            placeholder={t('vehicles.nicknamePlaceholder')}
            maxLength={30}
          />
          <Button type="submit" block>
            {t('vehicles.add')}
          </Button>
        </form>
      </div>
    </>
  )
}
