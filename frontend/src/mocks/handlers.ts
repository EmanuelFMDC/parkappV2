import { http, HttpResponse } from 'msw'

export const API_URL = 'http://localhost:8000'

/** Handlers mirror the OpenAPI contract. Only used by tests, never shipped to the browser. */
export const handlers = [
  http.get(`${API_URL}/api/health`, () => HttpResponse.json({ status: 'ok', version: '0.0.0' })),
]
