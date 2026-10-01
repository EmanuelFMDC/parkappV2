/**
 * "Real-time" availability is short polling with TanStack Query, never WebSockets (CLAUDE.md).
 * Use as `refetchInterval: AVAILABILITY_POLL_MS` on availability queries.
 */
export const AVAILABILITY_POLL_MS = 15_000
