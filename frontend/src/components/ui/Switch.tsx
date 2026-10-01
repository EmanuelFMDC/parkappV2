import clsx from 'clsx'

interface SwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  disabled?: boolean
}

/** On/off setting that applies immediately. 44px hit area around a 32px track. */
export function Switch({ checked, onChange, label, disabled }: SwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className="grid h-touch w-14 shrink-0 place-items-center rounded-full disabled:opacity-50"
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
