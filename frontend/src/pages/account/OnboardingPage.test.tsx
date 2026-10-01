import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Providers } from '../../app/Providers'
import i18n from '../../i18n'
import { API_URL } from '../../mocks/handlers'
import { resetTestDb, testDb } from '../../mocks/server'
import { createMockServices } from '../../services'
import OnboardingPage from './OnboardingPage'

function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{pathname + search}</p>
}

const NEXT = '/book/akron-2/time?venue=akron'

function renderOnboarding(services = createMockServices()) {
  return render(
    <Providers apiBaseUrl={API_URL} services={services}>
      <MemoryRouter initialEntries={[`/account/new?next=${encodeURIComponent(NEXT)}`]}>
        <Routes>
          <Route path="account/new" element={<OnboardingPage />} />
          <Route path="book/:spaceId/time" element={<Where />} />
          <Route path="*" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </Providers>,
  )
}

const ME = 'mock-user-3312345678'

async function fillProfile(over: { birthDate?: string; consent?: boolean } = {}) {
  await userEvent.type(await screen.findByLabelText('Nombre(s)'), 'Ana')
  await userEvent.type(screen.getByLabelText('Apellidos'), 'López García')
  await userEvent.type(screen.getByLabelText('Fecha de nacimiento'), over.birthDate ?? '1995-03-02')
  await userEvent.type(screen.getByLabelText('Correo electrónico'), 'ana@example.com')
  if (over.consent !== false) {
    await userEvent.click(screen.getByLabelText(/Acepto el aviso de privacidad/))
  }
  await userEvent.click(screen.getByRole('button', { name: 'Guardar y continuar' }))
}

beforeEach(async () => {
  resetTestDb({ identityDelayMs: 0 })
  await i18n.changeLanguage('es-MX')
})

describe('creating an account', () => {
  it('goes phone, details, car, identity, then back to where the driver was going', async () => {
    renderOnboarding()

    // 1. Phone
    expect(screen.getByText('Paso 1 de 4')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Teléfono'), '3312345678')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar código' }))
    await userEvent.type(await screen.findByLabelText('Código de 6 dígitos'), '000000')
    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }))

    // 2. Personal data
    expect(await screen.findByRole('heading', { name: 'Tus datos' })).toBeInTheDocument()
    expect(screen.getByText('Paso 2 de 4')).toBeInTheDocument()
    await fillProfile()

    // 3. Car
    expect(await screen.findByRole('heading', { name: 'Tu auto' })).toBeInTheDocument()
    expect(screen.getByText('Paso 3 de 4')).toBeInTheDocument()
    await userEvent.type(screen.getByLabelText('Placa'), 'jal482a')
    await userEvent.type(screen.getByLabelText('Marca'), 'Nissan')
    await userEvent.type(screen.getByLabelText('Modelo'), 'Versa')
    await userEvent.type(screen.getByLabelText('Color'), 'Gris')
    await userEvent.click(screen.getByRole('button', { name: 'Guardar auto y continuar' }))

    // 4. Identity (simulated provider)
    expect(
      await screen.findByRole('heading', { name: 'Verifica tu identidad' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Paso 4 de 4')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: 'Verificar mi identidad' }))
    expect(await screen.findByText(/Estamos revisando tu identidad/)).toBeInTheDocument()

    // The provider answers; the page notices and returns to the interrupted step.
    expect(await screen.findByTestId('where', undefined, { timeout: 8000 })).toHaveTextContent(NEXT)

    const me = testDb().getMe(ME)
    expect(me).toMatchObject({
      firstName: 'Ana',
      identityStatus: 'verified',
      email: 'ana@example.com',
    })
    expect(me.vehicles[0]).toMatchObject({ plate: 'JAL482A', type: 'sedan' })
  }, 20_000)

  it('refuses someone under 18 and says why', async () => {
    const services = createMockServices()
    await services.auth.signInWithGoogle()
    renderOnboarding(services)
    await fillProfile({ birthDate: '2015-01-01' })
    expect(await screen.findByRole('alert')).toHaveTextContent('Debes tener 18 años o más')
    expect(testDb().getMe('mock-google-user').firstName).toBeNull()
  })

  it('does not let anyone continue without accepting the privacy notice', async () => {
    const services = createMockServices()
    await services.auth.signInWithGoogle()
    renderOnboarding(services)
    await fillProfile({ consent: false })
    expect(await screen.findByRole('alert')).toHaveTextContent('aceptar el aviso de privacidad')
    expect(testDb().getMe('mock-google-user').privacyAcceptedAt).toBeNull()
  })

  it('resumes at the first thing still missing', async () => {
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
    renderOnboarding(services)
    expect(await screen.findByRole('heading', { name: 'Tu auto' })).toBeInTheDocument()
    expect(screen.getByText('Paso 3 de 4')).toBeInTheDocument()
  })

  it('offers another try when the identity check is rejected', async () => {
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
    db.setIdentityOutcome('rejected')
    renderOnboarding(services)

    await userEvent.click(await screen.findByRole('button', { name: 'Verificar mi identidad' }))
    expect(
      await screen.findByText(/No pudimos verificar tu identidad/, undefined, { timeout: 8000 }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Intentar de nuevo' })).toBeInTheDocument()
  }, 20_000)

  it('never follows a redirect that leaves the app', async () => {
    const services = createMockServices()
    await services.auth.signInWithGoogle()
    testDb().seedVerifiedAccount('mock-google-user')
    render(
      <Providers apiBaseUrl={API_URL} services={services}>
        <MemoryRouter initialEntries={['/account/new?next=https%3A%2F%2Fevil.example']}>
          <Routes>
            <Route path="account/new" element={<OnboardingPage />} />
            <Route path="*" element={<Where />} />
          </Routes>
        </MemoryRouter>
      </Providers>,
    )
    expect(await screen.findByTestId('where')).toHaveTextContent('/')
    expect(screen.getByTestId('where')).not.toHaveTextContent('evil')
  })
})
