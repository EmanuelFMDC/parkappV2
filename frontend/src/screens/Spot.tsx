import { CarFront, Navigation, TimerReset } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import { TicketStub } from '../components/TicketStub'
import { Badge, Button, EmptyState, TopBar } from '../components/ui'
import { getLot } from '../data/lots'
import { formatCountdown, formatMoney } from '../lib/format'
import { useSession } from '../lib/session'

const extensions = [30, 60] as const

export default function Spot() {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()
  const { session, extend } = useSession()
  const [now, setNow] = useState(() => Date.now())
  const [notice, setNotice] = useState('')

  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [])

  const lot = getLot(session?.lotId)

  if (!session || !lot) {
    return (
      <>
        <TopBar title={t('session.title')} />
        <div className="px-4">
          <EmptyState
            icon={<CarFront className="size-6" aria-hidden />}
            title={t('session.emptyTitle')}
            body={t('session.emptyBody')}
            action={<Button onClick={() => navigate('/')}>{t('session.findParking')}</Button>}
          />
        </div>
      </>
    )
  }

  const waiting = now < session.startsAt
  const remaining = session.endsAt - now
  const almostDone = !waiting && remaining < 15 * 60_000
  const lang = i18n.language

  const add = (minutes: number) => {
    const cost = Math.round((lot.pricePerHour * minutes) / 60)
    extend(minutes, cost)
    setNotice(t('session.extended'))
  }

  return (
    <>
      <TopBar title={t('session.title')} trailing={<Badge tone="success">{t('session.active')}</Badge>} />
      <div className="space-y-6 px-4">
        <section
          className={
            almostDone
              ? 'rounded-surface bg-ticket-50 p-5 ring-1 ring-ticket-200'
              : 'rounded-surface bg-surface p-5 ring-1 ring-line'
          }
        >
          <p className="text-caption text-ink-muted">{t('session.remaining')}</p>
          <p
            className="font-display text-display font-bold tabular-nums"
            role="timer"
            aria-live="off"
            aria-label={`${t('session.remaining')} ${formatCountdown(remaining)}`}
          >
            {formatCountdown(remaining)}
          </p>
          {almostDone && <p className="mt-1 font-medium text-ticket-700">{t('session.almostDone')}</p>}
        </section>

        <TicketStub session={session} lot={lot} />

        <section className="space-y-3">
          <h2 className="text-title font-semibold">{t('session.extend')}</h2>
          <div className="grid grid-cols-2 gap-3">
            {extensions.map((m) => (
              <Button key={m} variant="secondary" onClick={() => add(m)}>
                <TimerReset className="size-5" aria-hidden />
                <span>
                  {t('session.extendBy', { time: t('common.minutes', { count: m }) })}
                  <span className="ml-1 text-ink-muted tabular-nums">
                    {formatMoney(Math.round((lot.pricePerHour * m) / 60), lang)}
                  </span>
                </span>
              </Button>
            ))}
          </div>
          <p role="status" className="min-h-5 text-caption font-medium text-success-600">
            {notice}
          </p>
        </section>

        <Button
          variant="primary"
          block
          onClick={() => window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(lot.address)}`, '_blank', 'noopener')}
        >
          <Navigation className="size-5" aria-hidden />
          {t('session.navigate')}
        </Button>
      </div>
    </>
  )
}
