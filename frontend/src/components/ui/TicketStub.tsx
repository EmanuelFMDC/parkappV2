import { useTranslation } from 'react-i18next'
import { LogoMark } from './Logo'

interface TicketStubProps {
  title: string
  address: string
  /** Already formatted, for example "sáb 17 oct". Shown above the times when set. */
  dateLabel?: string
  /** Already formatted in Mexico City time. */
  startLabel: string
  endLabel: string
  plate: string
  spotLabel: string
  code: string
}

/** Deterministic barcode-like bars from the code. Visual only; the code is printed as text below. */
function Bars({ code }: { code: string }) {
  const widths = Array.from(code).flatMap((ch) => {
    const n = ch.charCodeAt(0)
    return [1 + (n % 3), 1 + ((n >> 2) % 2), 1 + ((n >> 1) % 3), 1 + ((n >> 3) % 2)]
  })
  const unit = 1.4
  let x = 0
  const rects = widths.map((w, i) => {
    const rect = i % 2 === 0 ? { x, w: w * unit } : null
    x += w * unit
    return rect
  })
  // The viewBox is as wide as the bars, so they always span the whole width of the stub.
  return (
    <svg
      viewBox={`0 0 ${x} 40`}
      className="h-12 w-full max-w-[18rem]"
      preserveAspectRatio="none"
      aria-hidden
    >
      {rects.map((r, i) =>
        r ? <rect key={i} x={r.x} y="0" width={r.w} height="40" className="fill-ink" /> : null,
      )}
    </svg>
  )
}

/**
 * The brand's signature object: a reservation as an event ticket with a perforated stub.
 * Each half cuts its own corners, so the notches always sit exactly on the tear line.
 */
export function TicketStub({
  title,
  address,
  dateLabel,
  startLabel,
  endLabel,
  plate,
  spotLabel,
  code,
}: TicketStubProps) {
  const { t } = useTranslation()
  return (
    <article aria-label={title} className="drop-shadow-[0_4px_16px_rgb(8_18_48_/_0.12)]">
      <div className="ticket-top rounded-t-surface bg-primary text-white">
        <div className="flex items-start gap-3 p-5 pb-5">
          <LogoMark className="size-12 shrink-0" />
          <div className="min-w-0">
            <h3 className="line-clamp-2 font-display text-title font-bold leading-tight">
              {title}
            </h3>
            <p className="text-caption text-signal-200">{address}</p>
          </div>
        </div>

        {dateLabel && (
          <p className="px-5 pb-3 text-caption font-semibold text-signal-200">{dateLabel}</p>
        )}
        <dl className="grid grid-cols-2 gap-x-4 gap-y-4 px-5 pb-8">
          <div>
            <dt className="text-caption text-signal-200">{t('ticket.entry')}</dt>
            <dd className="font-display text-headline font-bold tabular-nums">{startLabel}</dd>
          </div>
          <div>
            <dt className="text-caption text-signal-200">{t('ticket.until')}</dt>
            <dd className="font-display text-headline font-bold tabular-nums">{endLabel}</dd>
          </div>
          <div>
            <dt className="text-caption text-signal-200">{t('ticket.plate')}</dt>
            <dd className="font-semibold tabular-nums">{plate}</dd>
          </div>
          <div>
            <dt className="text-caption text-signal-200">{t('ticket.spot')}</dt>
            <dd className="font-semibold">{spotLabel}</dd>
          </div>
        </dl>
      </div>

      <div className="ticket-bottom relative rounded-b-surface bg-surface px-5 pb-5 pt-7 text-ink">
        <span
          aria-hidden
          className="absolute inset-x-6 top-0 border-t-2 border-dashed border-control"
        />
        <Bars code={code} />
        <p className="mt-2 flex items-baseline justify-between">
          <span className="text-caption text-ink-muted">{t('ticket.code')}</span>
          <span className="font-display text-title font-bold tracking-[0.18em] tabular-nums">
            {code}
          </span>
        </p>
      </div>
    </article>
  )
}
