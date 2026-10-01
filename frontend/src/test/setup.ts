import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterAll, afterEach, beforeAll, vi } from 'vitest'
import '../i18n'
import { resetTestDb, server } from '../mocks/server'

// jsdom does not implement scrolling; the app scrolls to the top on every screen change.
window.scrollTo = vi.fn() as unknown as typeof window.scrollTo

beforeAll(() => server.listen({ onUnhandledRequest: 'error' }))
afterEach(() => {
  // Storage is shared by every test in a file; the app now keeps things there (last mode, drafts).
  localStorage.clear()
  sessionStorage.clear()
  cleanup()
  server.resetHandlers()
  resetTestDb()
})
afterAll(() => server.close())
