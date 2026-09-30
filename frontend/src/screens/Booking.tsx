import { CreditCard } from 'lucide-react'
import { useState, type FormEvent } from 'react'
import { useTranslation } from 'react-i18next'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button, Input, Segmented, TopBar } from '../components/ui'
import { SERVICE_FEE, getLot } from '../data/lots'
import { formatMoney } from '../lib/format'
import { useSession } from '../lib/session'

type Arrival = 'now' | 'in30' | 'in60'
const arrivalMinutes: Record<Arrival, number> = { now: 0, in30: 30, in60: 60 }
const durations = ['1', '2', '3', '4'] as const

function makeCode() {
  return Array.from({ length: 6 }, () => 'ABCDEFGHJKMNPQRSTUVWXYZ23456789'[Math.floor(Math.random() * 31)]).join('')
}

export default function Booking() {
  const { id } = useParams()
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { start } = useSession()
  const lot = getLot(id)

  const [plate, setPlate] = useState('')
  const [arrival, setArrival] = useState<Arrival>('now')
  const [hours, setHours] = useState<(typeof durations)[number]>('2')
  const [error, setError] = useState<string>()
  const [busy, setBusy] = useState(false)

  if (!lot) return <Navigate to="/" replace />

  const lang = i18n.language
  const subtotal = lot.pricePerHour * Number(hours)
  const total = subtotal + SERVICE_FEE

  const submit = (e: FormEvent) => {
    e.preventDefault()
    if (plate.trim().length < 5) {
      setError(t('booking.plateError'))
      return
    }
    setError(undefined)
    setBusy(true)
    window.setTimeout(() => {
      const startsAt = Date.now() + arrivalMinutes[arrival] * 60_000
      start({
        lotId: lot.id,
        plate: plate.trim().toUpperCase(),
        startsAt,
        endsAt: startsAt + Number(hours) * 3_600_000,
        total,
        code: makeCode(),
        level: String(1 + Math.floor(Math.random() * 3)),
        spot: 10 + Math.floor(Math.random() * 80),
      })
      navigate('/ticket', { replace: true })
    }, 900)
  }

  return (
    <>
      <TopBar title={t('booking.title')} back />
      <form onSubmit={submit} noValidate className="space-y-6 px-4">
        <p className="font-display text-title font-semibold">{lot.name}</p>

        <Input
          label={t('booking.plate')}
          value={plate}
          onChange={(e) => setPlate(e.target.value.toUpperCase())}
          placeholder={t('booking.platePlaceholder')}
          autoCapitalize="characters"
          autoComplete="off"
          maxLength={10}
          error={error}
        />

        <Segmented
          label={t('booking.arrival')}
          value={arrival}
          onChange={setArrival}
          options={(['now', 'in30', 'in60'] as const).map((a) => ({ value: a, label: t(`booking.${a}`) }))}
        />

        <Segmented
          label={t('booking.duration')}
          value={hours}
          onChange={setHours}
          options={durations.map((d) => ({ value: d, label: `${d} h` }))}
        />

        <div className="flex items-center gap-3 rounded-control bg-surface p-4 ring-1 ring-line">
          <CreditCard className="size-6 text-primary" aria-hidden />
          <div>
            <p className="text-caption text-ink-muted">{t('booking.payment')}</p>
            <p className="font-semibold">{t('booking.card', { last: '4242' })}</p>
          </div>
        </div>

        <dl className="space-y-2 rounded-surface bg-surface p-4 ring-1 ring-line">
          <div className="flex justify-between text-ink-muted">
            <dt>{t('booking.subtotal')}</dt>
            <dd className="tabular-nums">{formatMoney(subtotal, lang)}</dd>
          </div>
          <div className="flex justify-between text-ink-muted">
            <dt>{t('booking.fee')}</dt>
            <dd className="tabular-nums">{formatMoney(SERVICE_FEE, lang)}</dd>
          </div>
          <div className="flex items-baseline justify-between border-t border-line pt-3">
            <dt className="font-semibold">{t('booking.total')}</dt>
            <dd className="font-display text-headline font-bold tabular-nums">{formatMoney(total, lang)}</dd>
          </div>
        </dl>

        <Button type="submit" variant="accent" block loading={busy}>
          {busy ? t('booking.confirming') : `${t('booking.confirm')} · ${formatMoney(total, lang)}`}
        </Button>
        <p className="text-center text-caption text-ink-muted">{t('booking.cancelFree')}</p>
      </form>
    </>
  )
}
