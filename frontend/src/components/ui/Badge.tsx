import clsx from 'clsx'
import type { ReactNode } from 'react'

export type BadgeTone = 'neutral' | 'success' | 'danger' | 'warning' | 'brand'

const tones: Record<BadgeTone, string> = {
  neutral: 'bg-canvas text-ink-muted ring-1 ring-inset ring-line',
  success: 'bg-success-50 text-success-600',
  danger: 'bg-danger-50 text-danger-600',
  warning: 'bg-warning-50 text-warning-700',
  brand: 'bg-primary-soft text-primary',
}

/** Short status. The text always carries the meaning; color only reinforces it. */
export function Badge({
  tone = 'neutral',
  icon,
  children,
}: {
  tone?: BadgeTone
  icon?: ReactNode
  children: ReactNode
}) {
  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-semibold',
        tones[tone],
      )}
    >
      {icon && <span aria-hidden>{icon}</span>}
      {children}
    </span>
  )
}
