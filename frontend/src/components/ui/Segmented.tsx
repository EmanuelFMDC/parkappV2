import clsx from 'clsx'
import { useId } from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
}

interface SegmentedProps<T extends string> {
  label: string
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  hideLabel?: boolean
}

/** Single-choice control built on native radios: arrow keys and screen readers work for free. */
export function Segmented<T extends string>({ label, options, value, onChange, hideLabel }: SegmentedProps<T>) {
  const name = useId()
  return (
    <fieldset>
      <legend className={clsx('mb-1.5 text-caption font-semibold text-ink-muted', hideLabel && 'sr-only')}>{label}</legend>
      <div className="flex gap-1 rounded-control bg-canvas p-1 ring-1 ring-inset ring-line">
        {options.map((o) => (
          <label
            key={o.value}
            className={clsx(
              'relative flex h-11 flex-1 cursor-pointer items-center justify-center rounded-[0.5rem] px-2 text-center text-[0.9375rem] font-semibold transition-colors',
              'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-accent',
              value === o.value ? 'bg-surface text-ink shadow-raised' : 'text-ink-muted hover:text-ink',
            )}
          >
            <input
              type="radio"
              name={name}
              value={o.value}
              checked={value === o.value}
              onChange={() => onChange(o.value)}
              className="sr-only"
            />
            {o.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
