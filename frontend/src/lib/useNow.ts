import { useEffect, useState } from 'react'

/**
 * The current time, refreshed every `intervalMs`. Render code must not call `Date.now()` directly
 * (it would make renders impure); deadlines like "free until 2 h before" read it from here.
 */
export function useNow(intervalMs = 30_000): number {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}
