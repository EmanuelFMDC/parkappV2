import clsx from 'clsx'
import { useTranslation } from 'react-i18next'
import { useNavigate } from 'react-router-dom'
import type { Lot } from '../data/lots'
import { formatMoney } from '../lib/format'

/** Stylised city map. Pins are real buttons so the map is keyboard and screen-reader reachable. */
export function LotMap({ lots }: { lots: Lot[] }) {
  const { t, i18n } = useTranslation()
  const navigate = useNavigate()

  return (
    <div
      role="group"
      aria-label={t('explore.mapLabel')}
      className="relative h-64 overflow-hidden rounded-surface bg-signal-50 ring-1 ring-line"
    >
      <svg className="absolute inset-0 size-full" viewBox="0 0 400 256" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <rect width="400" height="256" className="fill-signal-50" />
        <path d="M-10 190 C 90 170, 150 230, 260 200 S 380 150, 420 170 V 270 H -10Z" className="fill-signal-100" />
        <g className="fill-surface">
          <path d="M-10 92h420v16H-10z" />
          <path d="M150-10h16v280h-16z" />
          <path d="M-10 168 L 410 40 l 8 14 L -2 184z" />
          <path d="M270-10h12v280h-12z" />
        </g>
        <g className="fill-signal-200/60">
          <rect x="20" y="20" width="110" height="56" rx="8" />
          <rect x="182" y="18" width="70" height="60" rx="8" />
          <rect x="300" y="24" width="80" height="52" rx="8" />
          <rect x="20" y="126" width="110" height="40" rx="8" />
          <rect x="182" y="128" width="70" height="44" rx="8" />
          <rect x="300" y="134" width="80" height="46" rx="8" />
        </g>
      </svg>

      {/* Destination */}
      <span className="absolute left-[46%] top-[52%] -translate-x-1/2 -translate-y-1/2" aria-hidden>
        <span className="absolute inset-0 animate-pulse-ring rounded-full bg-primary/40" />
        <span className="relative block size-4 rounded-full border-[3px] border-white bg-primary shadow-raised" />
      </span>

      {lots.map((lot) => {
        const full = lot.free === 0
        return (
          <button
            key={lot.id}
            type="button"
            onClick={() => navigate(`/lot/${lot.id}`)}
            style={{ left: `${lot.map.x}%`, top: `${lot.map.y}%` }}
            aria-label={`${lot.name}, ${formatMoney(lot.pricePerHour, i18n.language)} ${t('common.perHour')}`}
            className={clsx(
              'absolute -translate-x-1/2 -translate-y-1/2 rounded-full px-3 py-1.5 text-[0.9375rem] font-bold tabular-nums shadow-raised transition-transform hover:scale-105',
              full ? 'bg-line text-ink-subtle line-through' : 'bg-ink text-white',
            )}
          >
            {formatMoney(lot.pricePerHour, i18n.language)}
          </button>
        )
      })}
    </div>
  )
}
