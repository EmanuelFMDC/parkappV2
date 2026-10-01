import clsx from 'clsx'
import type { ReactNode } from 'react'

interface MapListLayoutProps {
  map: ReactNode
  /** A `BottomSheet`. It floats over the map on narrow containers and docks as a list on wide ones. */
  sheet: ReactNode
  className?: string
}

/** Full-bleed map with a sheet (Uber) that becomes list-beside-map (Airbnb) on wide containers. */
export function MapListLayout({ map, sheet, className }: MapListLayoutProps) {
  return (
    <div className={clsx('@container', className)}>
      <div className="relative h-full overflow-hidden @3xl:flex">
        <div className="absolute inset-0 @3xl:static @3xl:flex-1">{map}</div>
        {sheet}
      </div>
    </div>
  )
}
