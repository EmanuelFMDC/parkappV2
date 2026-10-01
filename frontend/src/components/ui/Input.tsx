import clsx from 'clsx'
import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  hint?: string
  error?: string
  icon?: ReactNode
  /** Keep the label for screen readers but do not show it. */
  hideLabel?: boolean
}

export function Input({ label, hint, error, icon, hideLabel, className, ...rest }: InputProps) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ')
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={clsx('mb-1.5 block text-caption font-semibold text-ink', hideLabel && 'sr-only')}
      >
        {label}
      </label>
      <div
        className={clsx(
          'flex h-touch-lg items-center gap-3 rounded-control bg-surface px-4 ring-1 ring-inset transition-shadow',
          'focus-within:ring-2 focus-within:ring-primary',
          rest.disabled && 'bg-canvas opacity-70',
          error ? 'ring-2 ring-danger-600' : 'ring-control',
        )}
      >
        {icon && (
          <span aria-hidden className="text-ink-muted">
            {icon}
          </span>
        )}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={describedBy || undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-subtle"
          {...rest}
        />
      </div>
      {hint && !error && (
        <p id={`${id}-hint`} className="mt-1.5 text-caption text-ink-muted">
          {hint}
        </p>
      )}
      {error && (
        <p
          id={`${id}-error`}
          role="alert"
          className="mt-1.5 text-caption font-medium text-danger-600"
        >
          {error}
        </p>
      )}
    </div>
  )
}
