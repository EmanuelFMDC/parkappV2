import { ChevronDown, ChevronLeft, ChevronRight, ChevronUp, MapPin } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useTranslation } from 'react-i18next'
import type { LatLng, Venue } from '../../api/types'
import { Button, MapPlaceholder } from '../../components/ui'
import { formatDistance } from '../../lib/distance'
import { distanceM, offsetPoint } from '../../lib/geo'
import { fromMapPercent, toMapPercent } from '../../lib/mapProjection'
import { defaultPin } from './pin'

const STEP_M = 50

interface PinPickerProps {
  venue: Venue | undefined
  value: LatLng | null
  onChange: (point: LatLng) => void
  error?: string
}

/**
 * Lets the host mark the entrance on the illustrated map. A tap places the pin; four buttons nudge
 * it 50 m, so it also works with a keyboard or a screen reader. Replaced by the real map later.
 */
export function PinPicker({ venue, value, onChange, error }: PinPickerProps) {
  const { t, i18n } = useTranslation()
  if (!venue) {
    return (
      <p className="rounded-control bg-canvas p-4 text-ink-muted">{t('host.location.noVenue')}</p>
    )
  }

  const lang = i18n.language
  const radius = formatDistance(venue.radiusM, lang)
  const distance = value ? distanceM(value, venue.location) : null
  const tooFar = distance !== null && distance > venue.radiusM
  const pin = value ? toMapPercent(venue.location, value, venue.radiusM) : null

  const place = (e: MouseEvent<HTMLDivElement>) => {
    const box = e.currentTarget.getBoundingClientRect()
    const x = ((e.clientX - box.left) / box.width) * 100
    const y = ((e.clientY - box.top) / box.height) * 100
    onChange(fromMapPercent(venue.location, { x, y }, venue.radiusM))
  }
  const nudge = (bearing: number) =>
    onChange(offsetPoint(value ?? defaultPin(venue), STEP_M, bearing))

  const arrows = [
    { label: 'north', bearing: 0, icon: <ChevronUp />, area: 'col-start-2 row-start-1' },
    { label: 'west', bearing: 270, icon: <ChevronLeft />, area: 'col-start-1 row-start-2' },
    { label: 'east', bearing: 90, icon: <ChevronRight />, area: 'col-start-3 row-start-2' },
    { label: 'south', bearing: 180, icon: <ChevronDown />, area: 'col-start-2 row-start-3' },
  ] as const

  return (
    <div className="space-y-3">
      <p className="text-caption text-ink-muted">{t('host.location.pinHelp', { radius })}</p>

      <div
        onClick={place}
        className="relative aspect-[4/3] cursor-crosshair overflow-hidden rounded-surface ring-1 ring-control"
      >
        <MapPlaceholder pins={[]} venue={{ x: 50, y: 50 }} onSelect={() => undefined} />
        {pin && (
          <span
            aria-hidden
            className="pointer-events-none absolute z-30 -translate-x-1/2 -translate-y-full"
            style={{ left: `${pin.x}%`, top: `${pin.y}%` }}
          >
            <MapPin
              className={`size-10 drop-shadow ${tooFar ? 'fill-danger-600 text-white' : 'fill-primary text-white'}`}
            />
          </span>
        )}
      </div>

      <div
        className="grid grid-cols-[auto_auto_auto] justify-center gap-2"
        role="group"
        aria-label={t('host.location.nudge')}
      >
        {arrows.map(({ label, bearing, icon, area }) => (
          <Button
            key={label}
            variant="secondary"
            size="md"
            className={`${area} min-w-24`}
            onClick={() => nudge(bearing)}
            aria-label={t(`host.location.${label}`)}
          >
            {icon}
            <span className="sr-only">{t(`host.location.${label}`)}</span>
          </Button>
        ))}
      </div>

      <p
        role="status"
        className={`text-center font-semibold ${tooFar ? 'text-danger-600' : 'text-ink'}`}
      >
        {distance === null
          ? t('host.location.noPin')
          : t(tooFar ? 'host.location.tooFar' : 'host.location.distance', {
              distance: formatDistance(distance, lang),
              venue: venue.name,
              radius,
            })}
      </p>
      {error && (
        <p role="alert" className="text-center text-caption font-medium text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
}
