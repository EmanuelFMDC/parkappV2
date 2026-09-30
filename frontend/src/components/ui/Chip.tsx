import clsx from 'clsx'
import type { ButtonHTMLAttributes } from 'react'

export interface ChipProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  selected?: boolean
}

/** Toggle chip for filters. Exposes state through aria-pressed. */
export function Chip({ selected = false, className, children, ...rest }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={selected}
      className={clsx(
        'h-10 shrink-0 rounded-full px-4 text-[0.9375rem] font-medium transition-colors duration-150',
        selected ? 'bg-ink text-white' : 'bg-surface text-ink ring-1 ring-inset ring-line hover:bg-canvas',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
