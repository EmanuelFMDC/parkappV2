/** A domain error the mock API turns into a Problem response, like the real backend will. */
export class ApiError extends Error {
  readonly status: number
  readonly code: string

  constructor(status: number, code: string, message: string) {
    super(message)
    this.status = status
    this.code = code
  }
}

export const notFound = (what: string) => new ApiError(404, 'not_found', `${what} not found`)
export const unauthorized = () => new ApiError(401, 'unauthorized', 'Sign in to continue')
