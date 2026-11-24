import { APP_TIME_ZONE } from './time'

/**
 * When a host rents their space, in Mexico City wall time. `null` means always.
 * Days are ISO weekdays (1 = Monday ... 7 = Sunday). `toHour <= fromHour` means the window runs
 * overnight into the next morning (e.g. 18 to 2).
 */
export interface Availability {
  days: number[]
  fromHour: number
  toHour: number
}

export const WEEKDAYS = [1, 2, 3, 4, 5, 6, 7] as const

export function validAvailability(a: Availability): boolean {
  const days = new Set(a.days)
  return (
    a.days.length > 0 &&
    days.size === a.days.length &&
    a.days.every((d) => Number.isInteger(d) && d >= 1 && d <= 7) &&
    Number.isInteger(a.fromHour) &&
    Number.isInteger(a.toHour) &&
    a.fromHour >= 0 &&
    a.fromHour <= 23 &&
    a.toHour >= 1 &&
    a.toHour <= 24 &&
    a.fromHour !== a.toHour
  )
}

const ISO_DAY: Record<string, number> = { Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6, Sun: 7 }
const parts = new Intl.DateTimeFormat('en-US', {
  timeZone: APP_TIME_ZONE,
  weekday: 'short',
  hour: 'numeric',
  hourCycle: 'h23',
})

/** The Mexico City weekday (1-7) and hour (0-23) of an instant. */
function localSlot(instant: number): { day: number; hour: number } {
  const p = parts.formatToParts(new Date(instant))
  return {
    day: ISO_DAY[p.find((x) => x.type === 'weekday')!.value]!,
    hour: Number(p.find((x) => x.type === 'hour')!.value),
  }
}

function hourIsOpen(a: Availability, day: number, hour: number): boolean {
  const previous = day === 1 ? 7 : day - 1
  if (a.fromHour < a.toHour) return a.days.includes(day) && hour >= a.fromHour && hour < a.toHour
  // Overnight: the evening part belongs to a listed day, the early morning to the day after one.
  return (
    (a.days.includes(day) && hour >= a.fromHour) || (a.days.includes(previous) && hour < a.toHour)
  )
}

const HOUR_MS = 3_600_000

/** Whether every hour of a whole-hour booking falls inside the host's schedule. */
export function isWithinAvailability(
  a: Availability | null | undefined,
  startsAt: string,
  endsAt: string,
): boolean {
  if (!a) return true
  for (let t = Date.parse(startsAt); t < Date.parse(endsAt); t += HOUR_MS) {
    const { day, hour } = localSlot(t)
    if (!hourIsOpen(a, day, hour)) return false
  }
  return true
}
