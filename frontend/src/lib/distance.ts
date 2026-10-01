/** "350 m" under a kilometer, "1.4 km" above. Locale-aware. */
export function formatDistance(meters: number, locale: string): string {
  if (meters < 1000) {
    return new Intl.NumberFormat(locale, {
      style: 'unit',
      unit: 'meter',
      unitDisplay: 'narrow',
      maximumFractionDigits: 0,
    }).format(meters)
  }
  return new Intl.NumberFormat(locale, {
    style: 'unit',
    unit: 'kilometer',
    unitDisplay: 'narrow',
    maximumFractionDigits: 1,
  }).format(meters / 1000)
}
