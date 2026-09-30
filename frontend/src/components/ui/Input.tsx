import clsx from 'clsx'
import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

export interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> {
  label: string
  error?: string
  icon?: ReactNode
  /** Hide the visible label but keep it for screen readers. */
  hideLabel?: boolean
}

export function Input({ label, error, icon, hideLabel, className, ...rest }: InputProps) {
  const id = useId()
  const errorId = `${id}-error`
  return (
    <div className={className}>
      <label htmlFor={id} className={clsx('mb-1.5 block text-caption font-semibold text-ink-muted', hideLabel && 'sr-only')}>
        {label}
      </label>
      <div
        className={clsx(
          'flex h-touch items-center gap-3 rounded-control bg-surface px-4 ring-1 ring-inset transition-shadow',
          'focus-within:ring-2 focus-within:ring-primary',
          error ? 'ring-2 ring-danger-600' : 'ring-control',
        )}
      >
        {icon && <span className="text-ink-subtle">{icon}</span>}
        <input
          id={id}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? errorId : undefined}
          className="h-full min-w-0 flex-1 bg-transparent text-body text-ink outline-none placeholder:text-ink-subtle"
          {...rest}
        />
      </div>
      {error && (
        <p id={errorId} role="alert" className="mt-1.5 text-caption font-medium text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
}
