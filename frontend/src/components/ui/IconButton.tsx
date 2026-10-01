import clsx from 'clsx'
import type { ButtonHTMLAttributes, ReactNode } from 'react'

export interface IconButtonProps extends Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  'aria-label'
> {
  /** Required: an icon alone has no accessible name. */
  label: string
  icon: ReactNode
  tone?: 'plain' | 'raised'
}

export function IconButton({ label, icon, tone = 'plain', className, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      className={clsx(
        'grid size-touch shrink-0 place-items-center rounded-full text-ink transition-colors',
        tone === 'raised' ? 'bg-surface shadow-raised hover:bg-canvas' : 'hover:bg-line/60',
        className,
      )}
      {...rest}
    >
      <span aria-hidden className="grid place-items-center [&>svg]:size-6">
        {icon}
      </span>
    </button>
  )
}
