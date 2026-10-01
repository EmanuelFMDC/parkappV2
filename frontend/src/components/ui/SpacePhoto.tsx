import clsx from 'clsx'

export type PhotoTone = 'day' | 'dusk' | 'night'

const sky: Record<PhotoTone, string> = {
  day: 'fill-signal-100',
  dusk: 'fill-ticket-200',
  night: 'fill-signal-800',
}
const wall: Record<PhotoTone, string> = {
  day: 'fill-surface',
  dusk: 'fill-signal-50',
  night: 'fill-signal-600',
}

/**
 * Illustrated stand-in for a host photo (real photos arrive from Cloud Storage later).
 * Pass `label` when the image carries information; otherwise it is decorative.
 */
export function SpacePhoto({
  tone = 'day',
  label,
  className,
}: {
  tone?: PhotoTone
  label?: string
  className?: string
}) {
  return (
    <svg
      viewBox="0 0 320 240"
      preserveAspectRatio="xMidYMid slice"
      role={label ? 'img' : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
      className={clsx('block', className)}
    >
      <rect width="320" height="240" className={sky[tone]} />
      <rect y="176" width="320" height="64" className="fill-signal-200" />
      <path d="M40 92 160 34l120 58z" className="fill-primary" />
      <rect x="52" y="92" width="216" height="94" className={wall[tone]} />
      <rect x="92" y="112" width="136" height="74" rx="4" className="fill-signal-200" />
      {[124, 138, 152, 166].map((y) => (
        <rect key={y} x="98" y={y} width="124" height="3" rx="1.5" className="fill-signal-300" />
      ))}
      <rect x="146" y="150" width="28" height="36" className="fill-ticket-400" opacity="0" />
      <rect x="20" y="196" width="60" height="6" rx="3" className="fill-signal-300" />
      <rect x="240" y="196" width="60" height="6" rx="3" className="fill-signal-300" />
      <g>
        <rect x="118" y="196" width="84" height="22" rx="8" className="fill-ticket-400" />
        <rect x="132" y="184" width="56" height="18" rx="7" className="fill-ticket-500" />
        <circle cx="138" cy="219" r="7" className="fill-ink" />
        <circle cx="182" cy="219" r="7" className="fill-ink" />
      </g>
    </svg>
  )
}
