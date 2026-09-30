import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'accent' | 'secondary' | 'ghost'
type Size = 'md' | 'lg'

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  block?: boolean
}

const variants: Record<Variant, string> = {
  primary: 'bg-primary text-white hover:bg-primary-hover active:bg-signal-900',
  accent: 'bg-accent text-ink hover:bg-accent-hover active:bg-ticket-500',
  secondary: 'bg-surface text-ink ring-1 ring-inset ring-line hover:bg-canvas',
  ghost: 'bg-transparent text-primary hover:bg-primary-soft',
}

const sizes: Record<Size, string> = {
  md: 'h-11 px-4 text-[0.9375rem]',
  lg: 'h-touch px-6 text-body',
}

export function Button({
  variant = 'primary',
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
