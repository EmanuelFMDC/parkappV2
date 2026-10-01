import clsx from 'clsx'
import type { ReactNode } from 'react'

/** Centered reading column that leaves room for a sticky action bar when `withBar` is set. */
export function Page({
  children,
  withBar,
  className,
}: {
  children: ReactNode
  withBar?: boolean
  className?: string
}) {
  return (
    <div className={clsx('mx-auto max-w-3xl px-4', withBar ? 'pb-32' : 'pb-10', className)}>
      {children}
    </div>
  )
}
