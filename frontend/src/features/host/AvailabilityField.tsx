import { useId } from 'react'
import { useTranslation } from 'react-i18next'
import { Chip, Select, Switch } from '../../components/ui'
import { WEEKDAYS, type Availability } from '../../lib/availability'

/** Weekends in the evening: when most events happen. A starting point the host edits. */
const SUGGESTED: Availability = { days: [5, 6, 7], fromHour: 16, toHour: 24 }
const START_HOURS = Array.from({ length: 24 }, (_, h) => h)
const END_HOURS = Array.from({ length: 24 }, (_, h) => h + 1)

interface AvailabilityFieldProps {
  value: Availability | null
  onChange: (value: Availability | null) => void
  error?: string
}

/** When the host rents the space: always, or some days between two hours (overnight allowed). */
export function AvailabilityField({ value, onChange, error }: AvailabilityFieldProps) {
  const { t, i18n } = useTranslation()
  const titleId = useId()
  const hourLabel = (h: number) =>
    h === 24
      ? t('host.availability.midnight')
      : new Intl.DateTimeFormat(i18n.language, { hour: 'numeric', timeZone: 'UTC' }).format(
          new Date(Date.UTC(2000, 0, 1, h)),
        )
  const dayLabel = (d: number) =>
    // 2024-01-01 was a Monday, so day d is January d.
    new Intl.DateTimeFormat(i18n.language, { weekday: 'short', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2024, 0, d)),
    )
  const dayName = (d: number) =>
    new Intl.DateTimeFormat(i18n.language, { weekday: 'long', timeZone: 'UTC' }).format(
      new Date(Date.UTC(2024, 0, d)),
    )

  return (
    <section aria-labelledby={titleId} className="space-y-3">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h2 id={titleId} className="text-title font-semibold">
            {t('host.availability.title')}
          </h2>
          <p className="text-caption text-ink-muted">
            {value ? t('host.availability.someHint') : t('host.availability.alwaysHint')}
          </p>
        </div>
        <Switch
          label={t('host.availability.always')}
          checked={value === null}
          onChange={(always) => onChange(always ? null : SUGGESTED)}
        />
      </div>

      {value && (
        <>
          <div
            role="group"
            aria-label={t('host.availability.days')}
            className="flex flex-wrap gap-2"
          >
            {WEEKDAYS.map((d) => {
              const on = value.days.includes(d)
              return (
                <Chip
                  key={d}
                  selected={on}
                  aria-label={dayName(d)}
                  onClick={() =>
                    onChange({
                      ...value,
                      days: on
                        ? value.days.filter((x) => x !== d)
                        : [...value.days, d].sort((a, b) => a - b),
                    })
                  }
                >
                  {dayLabel(d)}
                </Chip>
              )
            })}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Select
              label={t('host.availability.from')}
              value={value.fromHour}
              onChange={(e) => onChange({ ...value, fromHour: Number(e.target.value) })}
            >
              {START_HOURS.map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </Select>
            <Select
              label={t('host.availability.to')}
              value={value.toHour}
              onChange={(e) => onChange({ ...value, toHour: Number(e.target.value) })}
            >
              {END_HOURS.map((h) => (
                <option key={h} value={h}>
                  {hourLabel(h)}
                </option>
              ))}
            </Select>
          </div>
          {value.toHour <= value.fromHour && (
            <p className="text-caption text-ink-muted">{t('host.availability.overnight')}</p>
          )}
        </>
      )}
      {error && (
        <p role="alert" className="text-caption font-medium text-danger-600">
          {error}
        </p>
      )}
    </section>
  )
}
