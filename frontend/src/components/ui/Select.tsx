import { useId, type ReactNode, type SelectHTMLAttributes } from 'react'

interface SelectProps extends Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}

/** A native select with the same label, hint and error behavior as Input. */
export function Select({ label, hint, error, className, children, ...rest }: SelectProps) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ')
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-caption font-semibold text-ink">
        {label}
      </label>
      <select
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`h-touch-lg w-full rounded-control bg-surface px-4 text-body text-ink ring-1 ring-inset ${
          error ? 'ring-2 ring-danger-600' : 'ring-control'
        } focus-visible:outline-primary`}
        {...rest}
      >
        {children}
      </select>
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
