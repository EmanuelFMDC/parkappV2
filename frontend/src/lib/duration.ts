/** 210 -> { hours: 3, minutes: 30 }. Pages format it with the translated unit labels. */
export function splitMinutes(total: number): { hours: number; minutes: number } {
  return { hours: Math.floor(total / 60), minutes: total % 60 }
}

export function formatDuration(total: number, hoursShort: string, minutesShort: string): string {
  const { hours, minutes } = splitMinutes(total)
  const parts: string[] = []
  if (hours) parts.push(`${hours} ${hoursShort}`)
  if (minutes) parts.push(`${minutes} ${minutesShort}`)
  return parts.join(' ') || `0 ${minutesShort}`
}
