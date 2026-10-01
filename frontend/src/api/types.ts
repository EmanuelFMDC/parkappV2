import type { components } from './schema'

/** Friendly aliases for the generated contract types. Never hand-write API shapes elsewhere. */
type Schemas = components['schemas']

export type Venue = Schemas['Venue']
export type VenueEvent = Schemas['VenueEvent']
export type SpaceFeature = Schemas['SpaceFeature']
export type SpaceSummary = Schemas['SpaceSummary']
export type Space = Schemas['Space']
export type Review = Schemas['Review']
export type Quote = Schemas['Quote']
export type Booking = Schemas['Booking']
export type BookingStatus = Schemas['BookingStatus']
export type BookingCreate = Schemas['BookingCreate']
export type Problem = Schemas['Problem']
export type Me = Schemas['Me']
export type Vehicle = Schemas['Vehicle']
export type VehicleInput = Schemas['VehicleInput']
export type VehicleType = Schemas['VehicleType']
export type ProfileInput = Schemas['ProfileInput']
export type IdentityStatus = Schemas['IdentityStatus']
export type LatLng = Schemas['LatLng']
