import { render, screen } from '@testing-library/react'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Providers } from '../../app/Providers'
import i18n from '../../i18n'
import { API_URL } from '../../mocks/handlers'
import { testDb } from '../../mocks/server'
import { createMockServices } from '../../services'
import { RequireAccount } from './RequireAccount'

function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{pathname + search}</p>
}

const TIME_URL =
  '/book/akron-2/time?venue=akron&from=2026-10-12T00:00:00.000Z&to=2026-10-12T06:00:00.000Z'

function renderGuarded(services = createMockServices()) {
  return render(
    <Providers apiBaseUrl={API_URL} services={services}>
      <MemoryRouter initialEntries={[TIME_URL]}>
        <Routes>
          <Route path="account/new" element={<Where />} />
          <Route element={<RequireAccount />}>
            <Route path="book/:spaceId/time" element={<p>step three</p>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Providers>,
  )
}

beforeEach(async () => {
  await i18n.changeLanguage('es-MX')
})

describe('RequireAccount', () => {
  it('sends a signed-out visitor to create an account and remembers where they were going', async () => {
    renderGuarded()
    const where = await screen.findByTestId('where')
    expect(where).toHaveTextContent('/account/new?next=')
    const next = new URL(`http://x${where.textContent}`).searchParams.get('next')
    expect(next).toBe(TIME_URL)
  })

  it('sends a signed-in driver with an incomplete account to finish it', async () => {
    const services = createMockServices()
    await services.auth.signInWithGoogle() // account exists, but no profile, car or identity
    renderGuarded(services)
    expect(await screen.findByTestId('where')).toHaveTextContent('/account/new?next=')
  })

  it('sends a driver whose identity is still pending to finish it', async () => {
    const services = createMockServices()
    await services.auth.signInWithGoogle()
    const db = testDb()
    db.updateProfile('mock-google-user', {
      firstName: 'Ana',
      lastName: 'López',
      birthDate: '1995-03-02',
      email: 'ana@example.com',
      acceptPrivacy: true,
    })
    db.addVehicle('mock-google-user', {
      plate: 'ABC123D',
      make: 'Kia',
      model: 'Rio',
      color: 'Rojo',
      type: 'sedan',
    })
    db.startIdentity('mock-google-user')
    renderGuarded(services)
    expect(await screen.findByTestId('where')).toHaveTextContent('/account/new?next=')
  })

  it('lets a complete, verified driver through', async () => {
    const services = createMockServices()
    await services.auth.signInWithGoogle()
    testDb().seedVerifiedAccount('mock-google-user')
    renderGuarded(services)
    expect(await screen.findByText('step three')).toBeInTheDocument()
  })
})
