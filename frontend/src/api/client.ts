import createClient, { type Middleware } from 'openapi-fetch'
import type { paths } from './schema'

export type ApiClient = ReturnType<typeof createClient<paths>>

/** Typed API client generated from the OpenAPI contract. Adds the auth token to every request. */
export function createApiClient(
  getToken: () => Promise<string | null>,
  baseUrl: string = import.meta.env.VITE_API_URL ?? '',
): ApiClient {
  const client = createClient<paths>({ baseUrl })
  const withAuth: Middleware = {
    async onRequest({ request }) {
      const token = await getToken()
      if (token) request.headers.set('Authorization', `Bearer ${token}`)
      return request
    },
  }
  client.use(withAuth)
  return client
}
