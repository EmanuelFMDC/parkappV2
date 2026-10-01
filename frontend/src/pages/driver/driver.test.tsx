import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import type { VehicleInput } from '../../api/types'
import { Providers } from '../../app/Providers'
import i18n from '../../i18n'
import { API_URL } from '../../mocks/handlers'
import { testDb } from '../../mocks/server'
import { createMockServices, type Services } from '../../services'
import PayPage from './PayPage'
import VenuePage from './VenuePage'

const GOOGLE_USER = 'mock-google-user'

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
const window2d = () => ({
  from: new Date(Date.now() + 2 * DAY).toISOString(),
  to: new Date(Date.now() + 2 * DAY + 4 * 3_600_000).toISOString(),
})
const payUrl = (spaceId = 'akron-2') => {
  const { from, to } = window2d()
  return `/book/${spaceId}/pay?venue=akron&from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`
}

/** A driver who has completed registration: profile, one sedan, identity verified. */
async function signedInDriver(vehicle?: Partial<VehicleInput>) {
  const services = createMockServices()
  await services.auth.signInWithGoogle()
  testDb().seedVerifiedAccount(GOOGLE_USER, vehicle)
  return services
}

beforeEach(async () => {
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
  it('shows the registered car and asks for no plate and no sign-in', async () => {
    renderAt(payUrl(), await signedInDriver())
    expect(await screen.findByText('Nissan Versa · Gris · JAL-482-A')).toBeInTheDocument()
    expect(screen.queryByLabelText(/placa/i)).not.toBeInTheDocument()
    expect(screen.queryByLabelText('Teléfono')).not.toBeInTheDocument()
  })

  it('books and confirms when the payment succeeds, using the registered car', async () => {
    renderAt(payUrl(), await signedInDriver())

    await userEvent.click(await screen.findByRole('button', { name: /Pagar y reservar · \$/ }))

    expect(await screen.findByTestId('where')).toHaveTextContent('/bookings/')
    const [booking] = testDb().listBookings(GOOGLE_USER)
    expect(booking?.status).toBe('confirmed')
    expect(booking?.vehicle.plate).toBe('JAL482A')
    expect(booking?.accessCode).toMatch(/^[A-Z0-9]{6}$/)
  })

  it('does not confirm the booking when the payment fails, and says so', async () => {
    const services = await signedInDriver()
    services.payments.confirm = async () => ({ status: 'failed', reason: 'card_declined' })
    renderAt(payUrl(), services)

    await userEvent.click(await screen.findByRole('button', { name: /Pagar y reservar · \$/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent('El pago no se pudo completar')
    const [held] = testDb().listBookings(GOOGLE_USER)
    // The space is held, not sold: it was never confirmed and has no access code or address.
    expect(held?.status).toBe('pending_payment')
    expect(held?.accessCode).toBeNull()
    expect(held?.space.address).toBeNull()
  })

  it('tells the driver when someone else took the garage', async () => {
    const services = await signedInDriver()
    const { from, to } = window2d()
    testDb().seedForeignBooking('akron-2', from, to)
    renderAt(payUrl(), services)

    await userEvent.click(await screen.findByRole('button', { name: /Pagar y reservar · \$/ }))

    expect(await screen.findByRole('alert')).toHaveTextContent(
      'Alguien acaba de reservar esta cochera',
    )
    expect(screen.getByRole('link', { name: 'Elegir otra cochera' })).toBeInTheDocument()
    expect(testDb().listBookings(GOOGLE_USER)).toEqual([])
  })

  it('sends the driver back to step 3 when none of their cars fits the garage', async () => {
    // akron-2 takes compact and sedan only; this driver has just a pickup.
    renderAt(payUrl(), await signedInDriver({ type: 'pickup', plate: 'PIC111' }))
    expect(await screen.findByTestId('where')).toHaveTextContent('/book/akron-2/time')
  })
})
