import { useId, type TextareaHTMLAttributes } from 'react'

interface TextareaProps extends Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> {
  label: string
  hint?: string
  error?: string
  /** Shows "12 / 500" so people see the limit before they hit it. */
  counter?: { current: number; max: number }
}

export function Textarea({ label, hint, error, counter, className, ...rest }: TextareaProps) {
  const id = useId()
  const describedBy = [hint && `${id}-hint`, error && `${id}-error`].filter(Boolean).join(' ')
  return (
    <div className={className}>
      <label htmlFor={id} className="mb-1.5 block text-caption font-semibold text-ink">
        {label}
      </label>
      <textarea
        id={id}
        rows={4}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy || undefined}
        className={`w-full resize-y rounded-control bg-surface p-4 text-body text-ink ring-1 ring-inset placeholder:text-ink-subtle ${
          error ? 'ring-2 ring-danger-600' : 'ring-control'
        } focus-visible:outline-primary`}
        {...rest}
      />
      <div className="mt-1.5 flex justify-between gap-4">
        <div className="text-caption">
          {hint && !error && (
            <p id={`${id}-hint`} className="text-ink-muted">
              {hint}
            </p>
          )}
          {error && (
            <p id={`${id}-error`} role="alert" className="font-medium text-danger-600">
              {error}
            </p>
          )}
        </div>
        {counter && (
          <p className="shrink-0 text-caption tabular-nums text-ink-muted">
            {counter.current} / {counter.max}
          </p>
        )}
      </div>
    </div>
  )
}
