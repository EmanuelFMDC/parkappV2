import { renderHook } from '@testing-library/react'
import type { ReactNode } from 'react'
import { MemoryRouter } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { tripSearch, useTrip } from './useTrip'

const wrap = (url: string) =>
  function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>
  }

describe('tripSearch / useTrip', () => {
  it('round-trips a trip through the URL', () => {
    const search = tripSearch({
      venueId: 'akron',
      startsAt: '2026-10-14T00:00:00.000Z',
      endsAt: '2026-10-14T05:30:00.000Z',
    })
    const { result } = renderHook(() => useTrip(), { wrapper: wrap(`/x${search}`) })
    expect(result.current.venueId).toBe('akron')
    expect(result.current.window).toEqual({
      startsAt: '2026-10-14T00:00:00.000Z',
      endsAt: '2026-10-14T05:30:00.000Z',
    })
  })

  it.each([
    ['no window', '/x?venue=akron'],
    ['unparsable dates', '/x?venue=akron&from=hoy&to=manana'],
    ['end before start', '/x?venue=akron&from=2026-10-14T05:00:00Z&to=2026-10-14T01:00:00Z'],
  ])('treats %s as no window', (_name, url) => {
    const { result } = renderHook(() => useTrip(), { wrapper: wrap(url) })
    expect(result.current.window).toBeNull()
  })
})
