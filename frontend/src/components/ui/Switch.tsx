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
      className="grid h-11 w-14 shrink-0 place-items-center rounded-full"
    >
      <span
        className={clsx(
          'relative block h-8 w-14 rounded-full transition-colors duration-200',
          checked ? 'bg-primary' : 'bg-control',
        )}
      >
        <span
          className={clsx(
            'absolute left-1 top-1 size-6 rounded-full bg-white shadow-raised transition-transform duration-200',
            checked && 'translate-x-6',
          )}
        />
      </span>
    </button>
  )
}
