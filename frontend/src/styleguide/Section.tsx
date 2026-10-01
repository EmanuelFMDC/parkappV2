import type { ReactNode } from 'react'

export function Section({
  id,
  title,
  intro,
  children,
}: {
  id: string
  title: string
  intro?: string
  children: ReactNode
}) {
  return (
    <section aria-labelledby={`${id}-title`} className="scroll-mt-6 space-y-5 py-8">
      <div className="space-y-1.5">
        <h2 id={`${id}-title`} className="text-headline font-bold">
          {title}
        </h2>
        {intro && <p className="max-w-[62ch] text-ink-muted">{intro}</p>}
      </div>
      {children}
    </section>
  )
}

export function Subsection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="space-y-3">
      <h3 className="text-title font-semibold">{title}</h3>
      {children}
    </div>
  )
}
