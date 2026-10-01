import { setupServer } from 'msw/node'
import { createDb, type MockDb } from './domain/db'
import { createHandlers } from './handlers'

let current: MockDb = createDb()

/** Handlers always talk to the current database, so each test can start from a clean one. */
const proxy = new Proxy({} as MockDb, {
  get: (_target, key) => current[key as keyof MockDb],
})

export const server = setupServer(...createHandlers(proxy))

export const testDb = () => current
export function resetTestDb(options?: Parameters<typeof createDb>[0]) {
  current = createDb(options)
  return current
}
