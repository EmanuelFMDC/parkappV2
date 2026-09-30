import { useCallback, useState } from 'react'

export interface Vehicle {
  plate: string
  nickname?: string
}

const STORAGE_KEY = 'parkapp.vehicles'

function load(): Vehicle[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as Vehicle[]) : []
  } catch {
    return []
  }
}

export function savedPlate(): string {
  return load()[0]?.plate ?? ''
}

/** Saved vehicles, persisted per device. The first one is the default. */
export function useVehicles() {
  const [vehicles, setVehicles] = useState<Vehicle[]>(load)

  const update = useCallback((next: Vehicle[]) => {
    setVehicles(next)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
    } catch {
      /* storage unavailable: keep in memory only */
    }
  }, [])

  return {
    vehicles,
    add: (v: Vehicle) => update([...vehicles.filter((x) => x.plate !== v.plate), v]),
    remove: (plate: string) => update(vehicles.filter((x) => x.plate !== plate)),
  }
}
