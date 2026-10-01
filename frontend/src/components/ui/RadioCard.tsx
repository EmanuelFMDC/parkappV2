import clsx from 'clsx'
import type { ReactNode } from 'react'

interface RadioCardProps {
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  children: ReactNode
}

/** A big, tappable single-choice option. A native radio underneath: arrows, Space and screen readers just work. */
export function RadioCard({ name, value, checked, onChange, children }: RadioCardProps) {
  return (
    <label
      className={clsx(
        'relative flex min-h-touch-lg cursor-pointer items-center gap-3 rounded-surface bg-surface p-4 transition-shadow',
        'has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-primary',
        checked ? 'shadow-raised ring-2 ring-primary' : 'ring-1 ring-control hover:shadow-raised',
      )}
    >
      <input
        type="radio"
        name={name}
        value={value}
        checked={checked}
        onChange={() => onChange(value)}
        className="sr-only"
      />
      <span
        aria-hidden
        className={clsx(
          'grid size-5 shrink-0 place-items-center rounded-full ring-2 ring-inset',
          checked ? 'ring-primary' : 'ring-control',
        )}
      >
        {checked && <span className="size-2.5 rounded-full bg-primary" />}
      </span>
      <span className="min-w-0 flex-1">{children}</span>
    </label>
  )
}
