import clsx from 'clsx'
import type { ReactNode } from 'react'

type Tone = 'neutral' | 'success' | 'danger' | 'accent' | 'primary'

const tones: Record<Tone, string> = {
  neutral: 'bg-canvas text-ink-muted',
  success: 'bg-success-50 text-success-600',
  danger: 'bg-danger-50 text-danger-600',
  accent: 'bg-ticket-50 text-ticket-700',
  primary: 'bg-primary-soft text-primary',
}

export function Badge({ tone = 'neutral', icon, children }: { tone?: Tone; icon?: ReactNode; children: ReactNode }) {
  return (
    <span className={clsx('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-caption font-semibold', tones[tone])}>
      {icon}
      {children}
    </span>
  )
}
