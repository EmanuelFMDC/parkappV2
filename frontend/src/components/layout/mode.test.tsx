import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Providers } from '../../app/Providers'
import { HostPitch } from '../../features/host/HostPitch'
import i18n from '../../i18n'
import { API_URL } from '../../mocks/handlers'
import { resetTestDb, testDb } from '../../mocks/server'
import HostBookingsPage from '../../pages/host/HostBookingsPage'
import HostSpacesPage from '../../pages/host/HostSpacesPage'
import ProfilePage from '../../pages/driver/ProfilePage'
import { createMockServices } from '../../services'
import { AppShell } from './AppShell'

function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{pathname + search}</p>
}

function renderAt(url: string, services = createMockServices()) {
  return render(
    <Providers apiBaseUrl={API_URL} services={services}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route index element={<Where />} />
            <Route path="bookings" element={<Where />} />
            <Route path="profile" element={<ProfilePage />} />
            <Route path="host" element={<HostSpacesPage />} />
            <Route path="host/bookings" element={<HostBookingsPage />} />
            <Route path="host/profile" element={<ProfilePage />} />
            <Route path="host/new/location" element={<Where />} />
            <Route path="*" element={<Where />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Providers>,
  )
}

const nav = () => screen.getByRole('navigation', { name: 'Navegación principal' })
const tab = (name: string) => within(nav()).queryByRole('button', { name })

async function verifiedHost() {
  const services = createMockServices()
  await services.auth.signInWithGoogle()
  testDb().seedVerifiedAccount('mock-google-user')
  return services
}

beforeEach(async () => {
  resetTestDb({ identityDelayMs: 0, reviewDelayMs: 0 })
  await i18n.changeLanguage('es-MX')
})

describe('each mode has its own bar', () => {
  it('driver mode shows search, my bookings and profile, and no host banner', () => {
    renderAt('/')
    expect(tab('Explorar')).toBeInTheDocument()
    expect(tab('Mis reservas')).toBeInTheDocument()
    expect(tab('Perfil')).toBeInTheDocument()
    expect(tab('Mis cocheras')).not.toBeInTheDocument()
    expect(screen.queryByText('Modo anfitrión')).not.toBeInTheDocument()
  })

  it('host mode shows my garages, bookings and profile, with a banner saying so', () => {
    renderAt('/host')
    expect(tab('Mis cocheras')).toBeInTheDocument()
    expect(tab('Reservas')).toBeInTheDocument()
    expect(tab('Perfil')).toBeInTheDocument()
    expect(tab('Explorar')).not.toBeInTheDocument()
    expect(tab('Mis reservas')).not.toBeInTheDocument()
    expect(screen.getByText('Modo anfitrión')).toBeInTheDocument()
  })

  it('marks the current tab', () => {
    renderAt('/host/bookings')
    expect(tab('Reservas')).toHaveAttribute('aria-current', 'page')
    expect(tab('Mis cocheras')).not.toHaveAttribute('aria-current')
  })

  it('stays in host mode when moving between host tabs, including the profile', async () => {
    renderAt('/host')
    await userEvent.click(tab('Perfil')!)
    expect(await screen.findByRole('heading', { level: 1, name: 'Perfil' })).toBeInTheDocument()
    expect(screen.getByText('Modo anfitrión', { selector: 'p' })).toBeInTheDocument() // the banner
    expect(tab('Mis cocheras')).toBeInTheDocument()
  })

  it('hides the bars on the steps of publishing a garage', () => {
    renderAt('/host/new/location')
    expect(
      screen.queryByRole('navigation', { name: 'Navegación principal' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByText('Modo anfitrión')).not.toBeInTheDocument()
  })

  it('the banner takes the person back to driver mode in one tap', async () => {
    renderAt('/host')
    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a modo conductor' }))
    expect(await screen.findByTestId('where')).toHaveTextContent('/')
    expect(tab('Explorar')).toBeInTheDocument()
    expect(screen.queryByText('Modo anfitrión')).not.toBeInTheDocument()
  })
})

describe('switching mode from the profile', () => {
  it('driver mode offers host mode, and shows cars', async () => {
    renderAt('/profile', await verifiedHost())
    expect(await screen.findByRole('heading', { name: 'Modo anfitrión' })).toBeInTheDocument()
    expect(await screen.findByRole('heading', { name: 'Mis autos' })).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a modo anfitrión' }))
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Mis cocheras' }),
    ).toBeInTheDocument()
    expect(screen.getByText('Modo anfitrión', { selector: 'p' })).toBeInTheDocument()
  })

  it('host mode has one way back (the banner), and does not show cars', async () => {
    renderAt('/host/profile', await verifiedHost())
    await screen.findByText('Prueba Conductor')
    expect(screen.queryByRole('heading', { name: 'Mis autos' })).not.toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Modo conductor' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('button', { name: 'Cambiar a modo conductor' })).toHaveLength(1)

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a modo conductor' }))
    expect(await screen.findByTestId('where')).toHaveTextContent('/')
    expect(tab('Explorar')).toBeInTheDocument()
  })

  it('works signed out too: the account is created when it is needed, not to switch mode', async () => {
    renderAt('/profile')
    await userEvent.click(await screen.findByRole('button', { name: 'Cambiar a modo anfitrión' }))
    expect(await screen.findByText('Renta tu cochera los días de evento')).toBeInTheDocument()
  })
})

describe('inviting drivers to host', () => {
  it('is a link to host mode', () => {
    render(
      <Providers apiBaseUrl={API_URL}>
        <MemoryRouter>
          <HostPitch />
        </MemoryRouter>
      </Providers>,
    )
    const link = screen.getByRole('link', { name: /¿Tienes una cochera\?/ })
    expect(link).toHaveAttribute('href', '/host')
  })
})

describe('host pages', () => {
  it('keeps old links to the bookings tab working', async () => {
    renderAt('/host?tab=bookings')
    expect(await screen.findByRole('heading', { level: 1, name: 'Anfitrión' })).toBeInTheDocument()
    expect(tab('Reservas')).toHaveAttribute('aria-current', 'page')
  })

  it('invites a newcomer from both host tabs', async () => {
    renderAt('/host/bookings')
    expect(await screen.findByText('Renta tu cochera los días de evento')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Empezar a publicar' })).toBeInTheDocument()
  })

  it('titles each tab by what it holds once the host is ready', async () => {
    renderAt('/host/bookings', await verifiedHost())
    expect(
      await screen.findByRole('heading', { level: 1, name: 'Reservas recibidas' }),
    ).toBeInTheDocument()
    expect(await screen.findByText('Aún no recibes reservas')).toBeInTheDocument()
  })
})
