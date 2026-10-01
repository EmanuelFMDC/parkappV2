import clsx from 'clsx'
import { Ticket } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { formatCents } from '../../lib/money'

export interface MapPin {
  id: string
  title: string
  priceCents: number
  /** Position in percent. */
  x: number
  y: number
}

interface MapPlaceholderProps {
  pins: MapPin[]
  activeId?: string | null
  onSelect: (id: string) => void
  /** The event venue everything is measured from. */
  venue: { x: number; y: number }
}

/**
 * Stylised map until Google Maps is connected behind MapService.
 * Pins are real buttons so the map is reachable by keyboard and screen readers.
 */
export function MapPlaceholder({ pins, activeId, onSelect, venue }: MapPlaceholderProps) {
  const { t, i18n } = useTranslation()
  return (
    <div
      role="group"
      aria-label={t('map.label')}
      className="relative size-full overflow-hidden bg-signal-50"
    >
      <svg
        className="absolute inset-0 size-full"
        viewBox="0 0 400 400"
        preserveAspectRatio="xMidYMid slice"
        aria-hidden
      >
        <rect width="400" height="400" className="fill-signal-50" />
        <path
          d="M-10 300 C 90 270, 150 340, 260 305 S 380 250, 420 270 V 420 H -10Z"
          className="fill-signal-100"
        />
        <g className="fill-signal-200/60">
          {[
            [16, 16, 120, 70],
            [180, 14, 80, 76],
            [310, 20, 76, 66],
            [16, 150, 120, 60],
            [180, 150, 80, 64],
            [310, 150, 76, 70],
            [16, 270, 120, 56],
            [310, 280, 76, 56],
          ].map(([x, y, w, h]) => (
            <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="10" />
          ))}
        </g>
        <g className="fill-surface">
          <path d="M-10 108h420v22H-10z" />
          <path d="M150-10h20v420h-20z" />
          <path d="M280-10h14v420h-14z" />
          <path d="M-10 236h420v16H-10z" />
        </g>
      </svg>

      <span
        className="absolute z-10 grid size-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-ink text-action shadow-pin ring-4 ring-white"
        style={{ left: `${venue.x}%`, top: `${venue.y}%` }}
      >
        <Ticket aria-hidden className="size-5" />
        <span className="sr-only">{t('map.venue')}</span>
      </span>

      {pins.map((pin) => {
        const active = pin.id === activeId
        const price = formatCents(pin.priceCents, i18n.language)
        return (
          <button
            key={pin.id}
            type="button"
            onClick={() => onSelect(pin.id)}
            aria-pressed={active}
            aria-label={t('map.pin', { title: pin.title, price })}
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
            className={clsx(
              'absolute z-20 grid min-h-touch min-w-touch -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full px-3 text-[0.9375rem] font-bold tabular-nums shadow-pin transition-transform duration-150',
              active ? 'scale-110 bg-primary text-white' : 'bg-surface text-ink hover:scale-105',
            )}
          >
            {price}
          </button>
        )
      })}
    </div>
  )
}
