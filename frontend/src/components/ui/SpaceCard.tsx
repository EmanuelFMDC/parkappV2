import clsx from 'clsx'
import { MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import { Badge } from './Badge'
import { PriceTag } from './PriceTag'
import { Rating } from './Rating'
import { SpaceImage } from './SpaceImage'

export interface SpaceCardProps {
  title: string
  /** Already formatted, for example "A 350 m de Estadio Akron". */
  distanceLabel: string
  priceCents: number
  rating: number
  reviewCount: number
  tags?: ReactNode
  /** `photoUrls[0]` from the API; a `placeholder://tone` URL renders the illustration. */
  photoUrl?: string | null
  /** `stacked` for grids and desktop lists, `row` inside the bottom sheet. */
  layout?: 'stacked' | 'row'
  selected?: boolean
  /** When set, the card is shown dimmed and cannot be opened (for example "No disponible"). */
  unavailableLabel?: string
  onSelect: () => void
  onHoverChange?: (hovering: boolean) => void
}

/** Airbnb-style card: big photo first, price and reviews always visible. The whole card is one button. */
export function SpaceCard({
  title,
  distanceLabel,
  priceCents,
  rating,
  reviewCount,
  tags,
  photoUrl,
  layout = 'stacked',
  selected = false,
  unavailableLabel,
  onSelect,
  onHoverChange,
}: SpaceCardProps) {
  const row = layout === 'row'
  const unavailable = Boolean(unavailableLabel)
  return (
    <article
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className={clsx(
        'relative overflow-hidden rounded-surface bg-surface transition-shadow',
        selected ? 'shadow-raised ring-2 ring-primary' : 'ring-1 ring-line',
        !unavailable && !selected && 'hover:shadow-raised',
        row && 'flex',
      )}
    >
      <SpaceImage
        url={photoUrl}
        className={clsx(
          row ? 'w-28 shrink-0 self-stretch' : 'aspect-[4/3] w-full',
          unavailable && 'grayscale',
        )}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <h3 className="text-body font-semibold leading-snug">
          <button
            type="button"
            onClick={onSelect}
            disabled={unavailable}
            aria-pressed={unavailable ? undefined : selected}
            className={clsx(
              "text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-offset-[-3px]",
              unavailable && 'cursor-not-allowed text-ink-muted',
            )}
          >
            {title}
          </button>
        </h3>
        <p className="flex items-center gap-1.5 text-caption text-ink-muted">
          <MapPin aria-hidden className="size-4 shrink-0" />
          {distanceLabel}
        </p>
        {(tags || unavailable) && (
          <div className="flex flex-wrap gap-1.5">
            {unavailable && <Badge tone="danger">{unavailableLabel}</Badge>}
            {tags}
          </div>
        )}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-1 pt-1">
          <PriceTag cents={priceCents} />
          <Rating value={rating} count={reviewCount} />
        </div>
      </div>
    </article>
  )
}
