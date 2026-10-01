import clsx from 'clsx'
import { useId } from 'react'

export interface SegmentedOption<T extends string> {
  value: T
  label: string
  /** BCP 47 code when the label is in another language than the page (WCAG 3.1.2). */
  lang?: string
}

interface SegmentedProps<T extends string> {
  label: string
  options: SegmentedOption<T>[]
  value: T
  onChange: (value: T) => void
  hideLabel?: boolean
}

/** Single choice among 2 to 4 short options. Native radios: arrow keys and screen readers just work. */
export function Segmented<T extends string>({
  label,
  options,
  value,
  onChange,
  hideLabel,
}: SegmentedProps<T>) {
  const name = useId()
  return (
    <fieldset>
      <legend
        className={clsx('mb-1.5 text-caption font-semibold text-ink', hideLabel && 'sr-only')}
      >
        {label}
      </legend>
      <div className="flex gap-1 rounded-control bg-canvas p-1 ring-1 ring-inset ring-control">
        {options.map((o) => (
          <label
            key={o.value}
            className={clsx(
              'relative flex h-touch flex-1 cursor-pointer items-center justify-center rounded-[0.5rem] px-2 text-center text-[0.9375rem] font-semibold transition-colors',
              'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
              value === o.value
                ? 'bg-surface text-ink shadow-raised'
                : 'text-ink-muted hover:text-ink',
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
            <span lang={o.lang}>{o.label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
