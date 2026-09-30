const currency = 'MXN'

export function formatMoney(amount: number, lang: string) {
  return new Intl.NumberFormat(lang, {
    style: 'currency',
    currency,
    maximumFractionDigits: Number.isInteger(amount) ? 0 : 2,
  }).format(amount)
}

export function formatTime(date: Date | string | number, lang: string) {
  return new Intl.DateTimeFormat(lang, { hour: '2-digit', minute: '2-digit' }).format(new Date(date))
}

export function formatDay(date: Date | string | number, lang: string) {
  return new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(new Date(date))
}

export function formatDistance(meters: number, lang: string) {
  return meters < 1000
    ? `${meters} m`
    : `${new Intl.NumberFormat(lang, { maximumFractionDigits: 1 }).format(meters / 1000)} km`
}

/** mm:ss or h:mm:ss countdown */
export function formatCountdown(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(total / 3600)
  const m = Math.floor((total % 3600) / 60)
  const s = total % 60
  const pad = (n: number) => String(n).padStart(2, '0')
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`
}
