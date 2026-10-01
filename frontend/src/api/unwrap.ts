import type { Problem } from './types'

/** An error response from the API, carrying its stable machine-readable `code`. */
export class ApiProblem extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

interface FetchResult<T> {
  data?: T
  error?: unknown
  response: Response
}

/** Turns an openapi-fetch result into data, or throws an `ApiProblem` the UI can map to a message. */
export async function unwrap<T>(request: Promise<FetchResult<T>>): Promise<T> {
  const { data, error, response } = await request
  if (error !== undefined || data === undefined) {
    const problem = (error ?? {}) as Partial<Problem>
    throw new ApiProblem(
      response.status,
      problem.code ?? 'unknown',
      problem.message ?? 'Unexpected error',
    )
  }
  return data
}
