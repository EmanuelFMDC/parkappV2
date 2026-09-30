import clsx from 'clsx'

/** The parking road sign: the brand's anchor shape. Decorative unless given a label. */
export function PSign({ className, label }: { className?: string; label?: string }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={clsx('size-10', className)}
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <rect width="48" height="48" rx="12" className="fill-primary" />
      <path
        d="M18 37V11h10a8.5 8.5 0 0 1 0 17H18"
        fill="none"
        className="stroke-accent"
        strokeWidth="6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}
