import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

export type ButtonVariant = 'action' | 'brand' | 'secondary' | 'ghost' | 'danger'
export type ButtonSize = 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  block?: boolean
}

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

/** One `action` button per screen: it is the thing the person came to do (reserve, pay, publish). */
export function Button({
  variant = 'action',
  size = 'lg',
  loading = false,
  block = false,
  className,
  disabled,
  children,
  ...rest
}: ButtonProps) {
  return (
    <button
      type="button"
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={clsx(
        'inline-flex select-none items-center justify-center gap-2 rounded-control font-semibold transition-colors duration-150',
        'disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-subtle disabled:ring-0',
        variants[variant],
        sizes[size],
        block && 'w-full',
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="size-5 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
