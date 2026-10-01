import { setupWorker } from 'msw/browser'
import { createDemoDb, createHandlers } from './handlers'
import type { MockDb } from './domain/db'

declare global {
  interface Window {
    /** Only in the e2e build: lets tests act as "another driver". */
    __mockDb?: MockDb
  }
}

/** Starts the in-browser API (D-014). Used while there is no real backend. */
export async function startMockApi() {
  const db = createDemoDb()
  if (import.meta.env.MODE === 'e2e') window.__mockDb = db
  const worker = setupWorker(...createHandlers(db, 250))
  await worker.start({ onUnhandledRequest: 'bypass', quiet: true })
}
