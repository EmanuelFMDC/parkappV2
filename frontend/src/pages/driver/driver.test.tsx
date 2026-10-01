import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Providers } from '../../app/Providers'
import i18n from '../../i18n'
import { API_URL } from '../../mocks/handlers'
import { testDb } from '../../mocks/server'
import { createMockServices, type Services } from '../../services'
import PayPage from './PayPage'
import VenuePage from './VenuePage'

function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{pathname + search}</p>
}

function renderAt(url: string, services?: Services) {
  return render(
    <Providers apiBaseUrl={API_URL} services={services}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route index element={<VenuePage />} />
          <Route path="venues/:venueId/spaces" element={<Where />} />
          <Route path="book/:spaceId/time" element={<Where />} />
          <Route path="book/:spaceId/pay" element={<PayPage />} />
          <Route path="bookings/:id" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </Providers>,
  )
}

const DAY = 86_400_000
const payUrl = () => {
  const from = new Date(Date.now() + 2 * DAY).toISOString()
  const to = new Date(Date.now() + 2 * DAY + 4 * 3_600_000).toISOString()
  return `/book/akron-2/pay?venue=akron&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
}

beforeEach(async () => {
  sessionStorage.clear()
  await i18n.changeLanguage('es-MX')
})

describe('VenuePage (step 1)', () => {
  it('needs a venue and an event before it lets the driver continue', async () => {
    renderAt('/')
    const cta = screen.getByRole('button', { name: 'Ver cocheras' })
    expect(cta).toBeDisabled()

    await userEvent.click(await screen.findByText('Estadio Akron'))
    const events = await screen.findAllByText('Concierto de ejemplo')
    expect(events.length).toBeGreaterThan(0)
    expect(cta).toBeDisabled()

    await userEvent.click(events[0]!)
    expect(cta).toBeEnabled()
    await userEvent.click(cta)

    const where = await screen.findByTestId('where')
    expect(where).toHaveTextContent('/venues/akron/spaces?venue=akron&from=')
  })

  it('shows the four-step progress', () => {
    renderAt('/')
    expect(screen.getByText(/Paso 1 de 4/)).toBeInTheDocument()
  })
})

describe('PayPage (step 4)', () => {
  it('sends the driver back to step 3 when there is no license plate', async () => {
    renderAt(payUrl())
    expect(await screen.findByTestId('where')).toHaveTextContent('/book/akron-2/time')
  })

  it('asks a signed-out driver to sign in and keeps the pay button disabled', async () => {
    sessionStorage.setItem('parkapp.draft.plate', 'JAL482A')
    renderAt(payUrl())
    expect(
      await screen.findByRole('heading', { name: 'Inicia sesión para reservar' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /Pagar y reservar/ })).toBeDisabled()
  })

  it('books and confirms when the payment succeeds', async () => {
    sessionStorage.setItem('parkapp.draft.plate', 'JAL482A')
    const services = createMockServices()
    await services.auth.signInWithGoogle()
    renderAt(payUrl(), services)

    const pay = await screen.findByRole('button', { name: /Pagar y reservar · \$/ })
    await within(document.body).findByText('Tarjeta de ejemplo terminada en 4242')
    await userEvent.click(pay)

    expect(await screen.findByTestId('where')).toHaveTextContent('/bookings/')
    const [booking] = testDb().listBookings('mock-google-user')
    expect(booking?.status).toBe('confirmed')
    expect(booking?.accessCode).toMatch(/^[A-Z0-9]{6}$/)
  })

  it('does not confirm the booking when the payment fails, and says so', async () => {
    sessionStorage.setItem('parkapp.draft.plate', 'JAL482A')
    const services = createMockServices()
    services.payments.confirm = async () => ({ status: 'failed', reason: 'card_declined' })
    await services.auth.signInWithGoogle()
    renderAt(payUrl(), services)

    await userEvent.click(await screen.findByRole('button', { name: /Pagar y reservar · \$/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('El pago no se pudo completar')
    const [held] = testDb().listBookings('mock-google-user')
    // The space is held, not sold: it was never confirmed and has no access code or address.
    expect(held?.status).toBe('pending_payment')
    expect(held?.accessCode).toBeNull()
    expect(held?.space.address).toBeNull()
  })

  it('tells the driver when someone else took the garage', async () => {
    sessionStorage.setItem('parkapp.draft.plate', 'JAL482A')
    const services = createMockServices()
    await services.auth.signInWithGoogle()
    const url = payUrl()
    const params = new URL(`http://x${url}`).searchParams
    testDb().seedForeignBooking('akron-2', params.get('from')!, params.get('to')!)
    renderAt(url, services)

    await userEvent.click(await screen.findByRole('button', { name: /Pagar y reservar · \$/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Alguien acaba de reservar esta cochera',
    )
    expect(screen.getByRole('link', { name: 'Elegir otra cochera' })).toBeInTheDocument()
    expect(testDb().listBookings('mock-google-user')).toEqual([])
  })
})
