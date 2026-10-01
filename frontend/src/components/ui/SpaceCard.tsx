import clsx from 'clsx'
import { MapPin } from 'lucide-react'
import type { ReactNode } from 'react'
import { PriceTag } from './PriceTag'
import { Rating } from './Rating'
import { SpacePhoto, type PhotoTone } from './SpacePhoto'

export interface SpaceCardProps {
  title: string
  /** Already formatted, for example "350 m del recinto". */
  distanceLabel: string
  priceCents: number
  rating: number
  reviewCount: number
  tags?: ReactNode
  photoTone?: PhotoTone
  /** `stacked` for grids and desktop lists, `row` inside the bottom sheet. */
  layout?: 'stacked' | 'row'
  selected?: boolean
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
  photoTone = 'day',
  layout = 'stacked',
  selected = false,
  onSelect,
  onHoverChange,
}: SpaceCardProps) {
  const row = layout === 'row'
  return (
    <article
      onMouseEnter={() => onHoverChange?.(true)}
      onMouseLeave={() => onHoverChange?.(false)}
      className={clsx(
        'relative overflow-hidden rounded-surface bg-surface transition-shadow',
        selected ? 'shadow-raised ring-2 ring-primary' : 'ring-1 ring-line hover:shadow-raised',
        row && 'flex',
      )}
    >
      <SpacePhoto
        tone={photoTone}
        className={clsx(row ? 'w-28 shrink-0 self-stretch' : 'aspect-[4/3] w-full')}
      />
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <h3 className="text-body font-semibold leading-snug">
          <button
            type="button"
            onClick={onSelect}
            aria-pressed={selected}
            className="text-left after:absolute after:inset-0 after:content-[''] focus-visible:outline-offset-[-3px]"
          >
            {title}
          </button>
        </h3>
        <p className="flex items-center gap-1.5 text-caption text-ink-muted">
          <MapPin aria-hidden className="size-4 shrink-0" />
          {distanceLabel}
        </p>
        {tags && <div className="flex flex-wrap gap-1.5">{tags}</div>}
        <div className="mt-auto flex flex-wrap items-end justify-between gap-x-3 gap-y-1 pt-1">
          <PriceTag cents={priceCents} />
          <Rating value={rating} count={reviewCount} />
        </div>
      </div>
    </article>
  )
}
