import clsx from 'clsx'
import { useId, type InputHTMLAttributes, type ReactNode } from 'react'

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'id'> {
  label: ReactNode
  error?: string
}

/** A native checkbox in a tappable row. The whole label is the target (44px+). */
export function Checkbox({ label, error, className, ...rest }: CheckboxProps) {
  const id = useId()
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className={clsx(
          'flex min-h-touch cursor-pointer items-start gap-3 rounded-control py-2',
          error && 'text-danger-600',
        )}
      >
        <input
          id={id}
          type="checkbox"
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : undefined}
          className="mt-0.5 size-6 shrink-0 cursor-pointer accent-primary"
          {...rest}
        />
        <span className="text-body">{label}</span>
      </label>
      {error && (
        <p id={`${id}-error`} role="alert" className="text-caption font-medium text-danger-600">
          {error}
        </p>
      )}
    </div>
  )
}
