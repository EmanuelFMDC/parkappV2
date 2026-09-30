import type { ReactNode } from 'react'

interface EmptyStateProps {
  icon: ReactNode
  title: string
  body: string
  action?: ReactNode
}

export function EmptyState({ icon, title, body, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-surface bg-surface p-6 ring-1 ring-line">
      <span className="grid size-12 place-items-center rounded-full bg-primary-soft text-primary">{icon}</span>
      <h2 className="text-title font-semibold">{title}</h2>
      <p className="max-w-[32ch] text-ink-muted">{body}</p>
      {action && <div className="pt-1">{action}</div>}
    </div>
  )
}
