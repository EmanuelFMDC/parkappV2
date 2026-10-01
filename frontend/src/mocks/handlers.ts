import { delay, http, HttpResponse, type HttpHandler } from 'msw'
import type {
  BookingCreate,
  HostSpaceCreate,
  HostSpaceUpdate,
  Me,
  ProfileInput,
  VehicleInput,
} from '../api/types'
import { createDb, type MockDb } from './domain/db'
import { ApiError } from './domain/errors'
import { seedDemoBookings } from './domain/demo'

/** Empty in the browser (same origin); tests set VITE_API_URL to an absolute URL. */
export const API_URL = import.meta.env.VITE_API_URL ?? ''

/** The mock auth service issues `mock-token-<userId>`; the real backend will verify a Firebase JWT. */
function userIdFrom(request: Request): string | null {
  const header = request.headers.get('Authorization') ?? ''
  const match = /^Bearer mock-token-(.+)$/.exec(header)
  return match?.[1] ?? null
}

function problem(error: unknown) {
  if (error instanceof ApiError) {
    return HttpResponse.json({ code: error.code, message: error.message }, { status: error.status })
  }
  throw error
}

export function createHandlers(db: MockDb, latencyMs = 0): HttpHandler[] {
  const url = (path: string) => `${API_URL}${path}`

  /** Runs a handler, waits a little like a network would, and turns domain errors into Problems. */
  const route =
    (
      fn: (ctx: {
        request: Request
        params: Record<string, string | readonly string[] | undefined>
      }) => unknown | Promise<unknown>,
      status = 200,
    ) =>
    async (ctx: {
      request: Request
      params: Record<string, string | readonly string[] | undefined>
    }) => {
      if (latencyMs) await delay(latencyMs)
      try {
        return HttpResponse.json(fn(ctx) as never, { status })
      } catch (error) {
        return problem(error)
      }
    }

  const param = (
    ctx: { params: Record<string, string | readonly string[] | undefined> },
    key: string,
  ) => String(ctx.params[key])
  const query = (request: Request, key: string) => new URL(request.url).searchParams.get(key) ?? ''

  return [
    http.get(
      url('/api/health'),
      route(() => db.health()),
    ),
    http.get(
      url('/api/venues'),
      route(() => ({ items: db.listVenues() })),
    ),
    http.get(
      url('/api/venues/:venueId/events'),
      route((c) => ({ items: db.listEvents(param(c, 'venueId')) })),
    ),
    http.get(
      url('/api/venues/:venueId/spaces'),
      route((c) => ({
        items: db.searchSpaces(
          param(c, 'venueId'),
          query(c.request, 'startsAt'),
          query(c.request, 'endsAt'),
        ),
      })),
    ),
    http.get(
      url('/api/spaces/:spaceId'),
      route((c) => db.getSpace(param(c, 'spaceId'))),
    ),
    http.get(
      url('/api/spaces/:spaceId/reviews'),
      route((c) => ({ items: db.listReviews(param(c, 'spaceId')) })),
    ),
    http.get(
      url('/api/spaces/:spaceId/quote'),
      route((c) =>
        db.quote(param(c, 'spaceId'), query(c.request, 'startsAt'), query(c.request, 'endsAt')),
      ),
    ),

    http.get(
      url('/api/bookings'),
      route((c) => ({ items: db.listBookings(userIdFrom(c.request)) })),
    ),
    http.post(url('/api/bookings'), async ({ request, params }) => {
      const body = (await request.clone().json()) as BookingCreate
      return route((c) => db.createBooking(userIdFrom(c.request), body), 201)({ request, params })
    }),
    http.get(
      url('/api/bookings/:bookingId'),
      route((c) => db.getBooking(userIdFrom(c.request), param(c, 'bookingId'))),
    ),
    http.post(url('/api/bookings/:bookingId/confirm'), async ({ request, params }) => {
      const body = (await request.clone().json()) as { paymentIntentId: string }
      return route((c) =>
        db.confirmBooking(userIdFrom(c.request), param(c, 'bookingId'), body.paymentIntentId),
      )({ request, params })
    }),
    http.post(
      url('/api/bookings/:bookingId/cancel'),
      route((c) => db.cancelBooking(userIdFrom(c.request), param(c, 'bookingId'))),
    ),

    http.get(
      url('/api/me'),
      route((c) => db.getMe(userIdFrom(c.request))),
    ),
    http.patch(url('/api/me'), async ({ request, params }) => {
      const body = (await request.clone().json()) as Partial<Pick<Me, 'language'>>
      return route((c) => db.updateMe(userIdFrom(c.request), body))({ request, params })
    }),

    http.put(url('/api/me/profile'), async ({ request, params }) => {
      const body = (await request.clone().json()) as ProfileInput
      return route((c) => db.updateProfile(userIdFrom(c.request), body))({ request, params })
    }),
    http.post(url('/api/me/vehicles'), async ({ request, params }) => {
      const body = (await request.clone().json()) as VehicleInput
      return route((c) => db.addVehicle(userIdFrom(c.request), body), 201)({ request, params })
    }),
    http.delete(
      url('/api/me/vehicles/:vehicleId'),
      route((c) => db.removeVehicle(userIdFrom(c.request), param(c, 'vehicleId'))),
    ),
    http.post(
      url('/api/me/identity'),
      route((c) => db.startIdentity(userIdFrom(c.request))),
    ),

    http.get(
      url('/api/host/spaces'),
      route((c) => ({ items: db.listHostSpaces(userIdFrom(c.request)) })),
    ),
    http.post(url('/api/host/spaces'), async ({ request, params }) => {
      const body = (await request.clone().json()) as HostSpaceCreate
      return route((c) => db.createHostSpace(userIdFrom(c.request), body), 201)({ request, params })
    }),
    http.patch(url('/api/host/spaces/:spaceId'), async ({ request, params }) => {
      const body = (await request.clone().json()) as HostSpaceUpdate
      return route((c) => db.updateHostSpace(userIdFrom(c.request), param(c, 'spaceId'), body))({
        request,
        params,
      })
    }),
    http.get(
      url('/api/host/bookings'),
      route((c) => ({ items: db.listHostBookings(userIdFrom(c.request)) })),
    ),
  ]
}

/** Browser/demo database: persists bookings in localStorage and starts with some spaces already taken. */
export function createDemoDb(): MockDb {
  const db = createDb({ storage: typeof localStorage === 'undefined' ? null : localStorage })
  seedDemoBookings(db)
  return db
}
