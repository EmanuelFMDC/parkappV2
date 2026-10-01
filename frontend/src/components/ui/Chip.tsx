import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

/** Toggle filter. State is exposed through aria-pressed, never by color alone (selected also inverts). */
export function Chip({ selected = false, className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={clsx(
        'h-touch shrink-0 rounded-full px-4 text-[0.9375rem] font-medium transition-colors duration-150',
        selected
          ? 'bg-ink text-white'
          : 'bg-surface text-ink ring-1 ring-inset ring-control hover:bg-canvas',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
