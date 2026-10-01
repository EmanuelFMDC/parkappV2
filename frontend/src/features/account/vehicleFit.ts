import type { Vehicle, VehicleType } from '../../api/types'

/** Whether a vehicle of this type fits a space that accepts `allowed` types. */
export const fits = (vehicle: Pick<Vehicle, 'type'>, allowed: VehicleType[]) =>
  allowed.includes(vehicle.type)

/** The vehicle to pre-select: the requested one if it fits, otherwise the first one that does. */
export function pickVehicle(
  vehicles: Vehicle[],
  allowed: VehicleType[],
  requestedId?: string,
): Vehicle | undefined {
  const requested = vehicles.find((v) => v.id === requestedId)
  if (requested && fits(requested, allowed)) return requested
  return vehicles.find((v) => fits(v, allowed))
}

/** "Nissan Versa · Gris · JAL-482-A" */
export function describeVehicle(v: Pick<Vehicle, 'make' | 'model' | 'color' | 'plate'>): string {
  return `${v.make} ${v.model} · ${v.color} · ${formatPlate(v.plate)}`
}

/** JAL482A -> JAL-482-A (the usual Jalisco format); anything else is shown as stored. */
export function formatPlate(plate: string): string {
  const m = /^([A-Z]{3})(\d{3})([A-Z])$/.exec(plate)
  return m ? `${m[1]}-${m[2]}-${m[3]}` : plate
}
