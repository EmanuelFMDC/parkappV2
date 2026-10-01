import clsx from 'clsx'

/** Loading placeholder. Decorative: announce loading with a labelled live region around it. */
export function Skeleton({ className }: { className?: string }) {
  return <div aria-hidden className={clsx('animate-shimmer rounded-control bg-line', className)} />
}
