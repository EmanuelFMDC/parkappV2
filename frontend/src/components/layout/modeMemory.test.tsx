import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes, useLocation } from 'react-router-dom'
import { beforeEach, describe, expect, it } from 'vitest'
import { Providers } from '../../app/Providers'
import i18n from '../../i18n'
import { markRestoreChecked, readMode, writeMode } from '../../lib/modePreference'
import { API_URL } from '../../mocks/handlers'
import { resetTestDb, testDb } from '../../mocks/server'
import { createMockServices, type Services } from '../../services'
import { AppShell } from './AppShell'

function Where() {
  const { pathname, search } = useLocation()
  return <p data-testid="where">{pathname + search}</p>
}

function renderAt(url: string, services: Services = createMockServices()) {
  return render(
    <Providers apiBaseUrl={API_URL} services={services}>
      <MemoryRouter initialEntries={[url]}>
        <Routes>
          <Route element={<AppShell />}>
            <Route path="*" element={<Where />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </Providers>,
  )
}

const where = () => screen.getByTestId('where').textContent

/** A host whose account is complete and verified. */
async function readyHost() {
  const services = createMockServices()
  await services.auth.signInWithGoogle()
  testDb().seedVerifiedAccount('mock-google-user')
  return services
}

/** Someone signed in whose account is not finished yet. */
async function unfinishedAccount() {
  const services = createMockServices()
  await services.auth.signInWithGoogle()
  return services
}

beforeEach(async () => {
  resetTestDb({ identityDelayMs: 0, reviewDelayMs: 0 })
  await i18n.changeLanguage('es-MX')
})

describe('remembering the mode', () => {
  it('saves the mode whenever the person is on one of the bottom-bar screens', async () => {
    renderAt('/host/bookings')
    await waitFor(() => expect(readMode()).toBe('host'))
  })

  it('saves driver mode too', async () => {
    writeMode('host')
    markRestoreChecked() // not opening the app: just navigating
    renderAt('/bookings')
    await waitFor(() => expect(readMode()).toBe('driver'))
  })

  it('does not save the mode on the screens of a flow (they are not a choice of mode)', async () => {
    renderAt('/host/new/location')
    await waitFor(() => expect(where()).toBe('/host/new/location'))
    expect(readMode()).toBeNull()
  })

  it('moving between tabs updates the saved mode', async () => {
    renderAt('/host')
    await waitFor(() => expect(readMode()).toBe('host'))
    await userEvent.click(screen.getByRole('button', { name: 'Perfil' }))
    await waitFor(() => expect(where()).toBe('/host/profile'))
    expect(readMode()).toBe('host')
  })
})

describe('opening the app after using host mode', () => {
  it('takes a ready host back to host mode', async () => {
    writeMode('host')
    renderAt('/', await readyHost())
    await waitFor(() => expect(where()).toBe('/host'))
    expect(readMode()).toBe('host')
  })

  it('only decides once per tab: tapping Explorar later stays in driver mode', async () => {
    writeMode('host')
    renderAt('/', await readyHost())
    await waitFor(() => expect(where()).toBe('/host'))

    await userEvent.click(screen.getByRole('button', { name: 'Cambiar a modo conductor' }))
    await waitFor(() => expect(where()).toBe('/'))
    // Still at the root, still driver mode: no second jump.
    await new Promise((resolve) => setTimeout(resolve, 100))
    expect(where()).toBe('/')
    expect(readMode()).toBe('driver')
  })

  it('does not restore when this tab already decided (a reload)', async () => {
    writeMode('host')
    markRestoreChecked()
    renderAt('/', await readyHost())
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(where()).toBe('/')
  })

  it('does not interfere with a link the person opened', async () => {
    writeMode('host')
    renderAt('/bookings', await readyHost())
    await waitFor(() => expect(readMode()).toBe('driver'))
    expect(where()).toBe('/bookings')
  })

  it('does not restore when the root has link parameters', async () => {
    writeMode('host')
    renderAt('/?venue=akron', await readyHost())
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(where()).toBe('/?venue=akron')
  })

  it('does not send someone with an unfinished account to an invitation', async () => {
    writeMode('host')
    renderAt('/', await unfinishedAccount())
    await waitFor(() => expect(readMode()).toBe('driver'))
    expect(where()).toBe('/')
  })

  it('does not restore for someone who is not signed in', async () => {
    writeMode('host')
    renderAt('/')
    await waitFor(() => expect(readMode()).toBe('driver'))
    expect(where()).toBe('/')
  })

  it('opens in driver mode when driver mode was the last', async () => {
    writeMode('driver')
    renderAt('/', await readyHost())
    await new Promise((resolve) => setTimeout(resolve, 150))
    expect(where()).toBe('/')
  })

  it('keeps the saved host mode while the account is still loading', async () => {
    writeMode('host')
    renderAt('/', await readyHost())
    // Right after the first render the account has not arrived: nothing may have overwritten it.
    expect(readMode()).toBe('host')
    await waitFor(() => expect(where()).toBe('/host'))
  })
})

describe('signing out', () => {
  it('forgets the mode, so the next person on this phone starts fresh', async () => {
    const services = await readyHost()
    writeMode('host')
    renderAt('/host', services)
    await waitFor(() => expect(readMode()).toBe('host'))

    await services.auth.signOut()
    await waitFor(() => expect(localStorage.getItem('parkapp.mode')).toBeNull())
  })
})
