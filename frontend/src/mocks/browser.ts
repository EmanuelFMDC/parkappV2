import { getResponse } from 'msw'
import { setupWorker } from 'msw/browser'
import { createDemoDb, createHandlers } from './handlers'
import type { MockDb } from './domain/db'

declare global {
  interface Window {
    /** Only in the e2e build: lets tests act as "another driver". */
    __mockDb?: MockDb
  }
}

/** Starts the in-browser API. Used while there is no real backend. */
export async function startMockApi() {
  const db = createDemoDb()
  if (import.meta.env.MODE === 'e2e') window.__mockDb = db
  const handlers = createHandlers(db, 250)
  if (import.meta.env.MODE === 'demo') {
    // The installable demo (GitHub Pages) needs the only service worker slot for the PWA, so the
    // mock API answers inside the page instead: API calls never leave the phone.
    const networkFetch = window.fetch.bind(window)
    window.fetch = async (input, init) => {
      const request = new Request(input, init)
      if (new URL(request.url).pathname.startsWith('/api/')) {
        const response = await getResponse(handlers, request)
        if (response) return response
      }
      return networkFetch(input, init)
    }
    return
  }
  const worker = setupWorker(...handlers)
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}
