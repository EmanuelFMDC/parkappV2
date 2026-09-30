import clsx from 'clsx'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={clsx(
        'relative h-8 w-14 shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-primary' : 'bg-line',
      )}
    >
      <span
        className={clsx(
          'absolute left-1 top-1 size-6 rounded-full bg-white shadow-raised transition-transform duration-200',
          checked && 'translate-x-6',
        )}
      />
    </button>
  )
}
