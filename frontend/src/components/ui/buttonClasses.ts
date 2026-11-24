import clsx from 'clsx'

export type ButtonVariant = 'action' | 'brand' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'lg'

const variants: Record<ButtonVariant, string> = {
  action: 'bg-action text-ink hover:bg-action-hover active:bg-ticket-500',
  brand: 'bg-primary text-white hover:bg-primary-hover active:bg-signal-900',
  secondary: 'bg-surface text-ink ring-1 ring-inset ring-control hover:bg-canvas',
  ghost: 'bg-transparent text-primary hover:bg-primary-soft',
  danger: 'bg-surface text-danger-600 ring-1 ring-inset ring-danger-600 hover:bg-danger-50',
}

const sizes: Record<ButtonSize, string> = {
  md: 'h-touch px-4 text-[0.9375rem]',
  lg: 'h-touch-lg px-6 text-body',
}

/** The button look. `Button` uses it; so does a link that should read as one (e.g. directions). */
export function buttonClasses({
  variant = 'action',
  size = 'lg',
  block = false,
}: { variant?: ButtonVariant; size?: ButtonSize; block?: boolean } = {}): string {
  return clsx(
    'inline-flex select-none items-center justify-center gap-2 rounded-control font-semibold transition-colors duration-150',
    variants[variant],
    sizes[size],
    block && 'w-full',
  )
}
