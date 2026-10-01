import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { localToUtcIso, utcToLocalParts } from '../../lib/time'
import { Input } from './Input'

const HALF_HOURS = Array.from({ length: 48 }, (_, i) => {
  const h = String(Math.floor(i / 2)).padStart(2, '0')
  return `${h}:${i % 2 ? '30' : '00'}`
})

interface DateTimeFieldProps {
  label: string
  /** A UTC instant. The field shows and edits it in Mexico City time. */
  valueUtc: string
  onChange: (utcIso: string) => void
}

/** Date + half-hour time, edited in Mexico City wall time and reported as a UTC instant. */
export function DateTimeField({ label, valueUtc, onChange }: DateTimeFieldProps) {
  const { t, i18n } = useTranslation()
  const timeId = useId()
  const { date, time } = utcToLocalParts(valueUtc)
  const options = HALF_HOURS.includes(time) ? HALF_HOURS : [...HALF_HOURS, time].sort()

  const label12 = (hhmm: string) =>
    new Intl.DateTimeFormat(i18n.language, {
      timeZone: 'UTC',
      hour: 'numeric',
      minute: '2-digit',
    }).format(new Date(`2000-01-01T${hhmm}:00Z`))

  return (
    <fieldset>
      <legend className="mb-1.5 text-caption font-semibold text-ink">{label}</legend>
      <div className="grid grid-cols-[1fr_auto] gap-3">
        <Input
          label={t('fields.date')}
          hideLabel
          type="date"
          value={date}
          onChange={(e) => e.target.value && onChange(localToUtcIso(e.target.value, time))}
        />
        <div>
          <label htmlFor={timeId} className="sr-only">
            {t('fields.time')}
          </label>
          <select
            id={timeId}
            value={time}
            onChange={(e) => onChange(localToUtcIso(date, e.target.value))}
            className="h-touch-lg rounded-control bg-surface px-3 text-body text-ink ring-1 ring-inset ring-control focus-visible:outline-primary"
          >
            {options.map((o) => (
              <option key={o} value={o}>
                {label12(o)}
              </option>
            ))}
          </select>
        </div>
      </div>
    </fieldset>
  )
}
