import clsx from 'clsx'
import { Loader2 } from 'lucide-react'
import type { ButtonHTMLAttributes } from 'react'
import { buttonClasses, type ButtonSize, type ButtonVariant } from './buttonClasses'

export type { ButtonSize, ButtonVariant }

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  loading?: boolean
  block?: boolean
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
        buttonClasses({ variant, size, block }),
        'disabled:cursor-not-allowed disabled:bg-line disabled:text-ink-subtle disabled:ring-0',
        className,
      )}
      {...rest}
    >
      {loading && <Loader2 className="size-5 animate-spin" aria-hidden />}
      {children}
    </button>
  )
}
