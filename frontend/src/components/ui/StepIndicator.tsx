import clsx from 'clsx'
import { Check } from 'lucide-react'
import { useTranslation } from 'react-i18next'

interface StepIndicatorProps {
  /** Step names, in order. Numbers are used because this really is a sequence (reserve in 4 steps, publish in 4). */
  steps: string[]
  /** 1-based. */
  current: number
}

export function StepIndicator({ steps, current }: StepIndicatorProps) {
  const { t } = useTranslation()
  const total = steps.length
  return (
    <div>
      <p className="mb-2 text-caption font-semibold text-ink-muted">
        {t('steps.progress', { current, total })}
        <span className="sr-only">: {steps[current - 1]}</span>
      </p>
      <ol aria-label={t('steps.label')} className="flex gap-1.5">
        {steps.map((name, i) => {
          const n = i + 1
          const done = n < current
          const active = n === current
          return (
            <li
              key={name}
              aria-current={active ? 'step' : undefined}
              className="flex min-w-0 flex-1 flex-col gap-1.5"
            >
              <span
                aria-hidden
                className={clsx('h-1.5 rounded-full', done || active ? 'bg-primary' : 'bg-line')}
              />
              <span
                className={clsx(
                  'flex items-center gap-1 truncate text-caption',
                  active ? 'font-semibold text-ink' : 'hidden text-ink-muted @md:flex',
                )}
              >
                {done && <Check aria-hidden className="size-3.5 shrink-0 text-success-600" />}
                <span className="truncate">{name}</span>
                {done && <span className="sr-only">{t('steps.done')}</span>}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
