import { useTranslation } from 'react-i18next'
import type { Lot } from '../data/lots'
import { formatTime } from '../lib/format'
import type { ParkingSession } from '../lib/session'
import { PSign } from './ui'

/** Deterministic barcode-like stripes from the access code. Visual only; the code is printed below. */
function Stripes({ code }: { code: string }) {
  const bars = Array.from(code).flatMap((ch, i) => {
    const n = ch.charCodeAt(0)
    return [1 + (n % 3), 1 + ((n >> 2) % 2), i % 2 ? 2 : 1]
  })
  let x = 0
  return (
    <svg viewBox="0 0 160 40" className="h-12 w-full" preserveAspectRatio="none" aria-hidden>
      {bars.map((w, i) => {
        const rect = i % 2 === 0 ? <rect key={i} x={x} y="0" width={w * 1.4} height="40" className="fill-ink" /> : null
        x += w * 1.4
        return rect
      })}
    </svg>
  )
}

/** The brand's memorable object: a parking ticket with perforated sides. */
export function TicketStub({ session, lot }: { session: ParkingSession; lot: Lot }) {
  const { t, i18n } = useTranslation()
  const lang = i18n.language
  const levelLabel = t('ticket.level', { level: session.level, spot: session.spot })

  return (
    <article
      aria-label={lot.name}
      className="ticket-notch overflow-hidden rounded-surface bg-primary text-white shadow-raised [--notch:58%]"
    >
      <div className="flex items-start gap-3 p-5 pb-6">
        <PSign className="size-12 shrink-0" />
        <div className="min-w-0">
          <h2 className="truncate font-display text-title font-bold">{lot.name}</h2>
          <p className="text-caption text-signal-200">{lot.address}</p>
        </div>
      </div>

      <dl className="grid grid-cols-2 gap-x-4 gap-y-4 px-5 pb-7">
        <div>
          <dt className="text-caption text-signal-200">{t('ticket.entry')}</dt>
          <dd className="font-display text-headline font-bold tabular-nums">{formatTime(session.startsAt, lang)}</dd>
        </div>
        <div>
          <dt className="text-caption text-signal-200">{t('ticket.until')}</dt>
          <dd className="font-display text-headline font-bold tabular-nums">{formatTime(session.endsAt, lang)}</dd>
        </div>
        <div className="col-span-2">
          <dt className="text-caption text-signal-200">{t('booking.plate')}</dt>
          <dd className="font-semibold tabular-nums">
            {session.plate} · {levelLabel}
          </dd>
        </div>
      </dl>

      <div className="border-t-2 border-dashed border-white/30 bg-surface px-5 pb-5 pt-6 text-ink">
        <Stripes code={session.code} />
        <p className="mt-2 flex items-baseline justify-between">
          <span className="text-caption text-ink-muted">{t('ticket.code')}</span>
          <span className="font-display text-title font-bold tracking-[0.18em] tabular-nums">{session.code}</span>
        </p>
      </div>
    </article>
  )
}
