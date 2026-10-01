import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { http, HttpResponse } from 'msw'
import { beforeEach, describe, expect, it } from 'vitest'
import { Providers } from '../app/Providers'
import i18n from '../i18n'
import { API_URL } from '../mocks/handlers'
import { server } from '../mocks/server'
import { HomePage } from './HomePage'

function renderHome() {
  return render(
    <Providers apiBaseUrl={API_URL}>
      <HomePage />
    </Providers>,
  )
}

describe('HomePage', () => {
  beforeEach(async () => {
    await i18n.changeLanguage('es-MX')
  })

  it('shows the service status from the typed API client', async () => {
    renderHome()
    expect(await screen.findByText('Funcionando (versión 0.0.0)')).toBeInTheDocument()
  })

  it('shows an error state when the API is down', async () => {
    server.use(http.get(`${API_URL}/api/health`, () => new HttpResponse(null, { status: 500 })))
    renderHome()
    expect(await screen.findByText('Sin conexión con el servidor')).toBeInTheDocument()
  })

  it('switches language without reloading', async () => {
    renderHome()
    await screen.findByText('Funcionando (versión 0.0.0)')

    await userEvent.selectOptions(screen.getByLabelText('Idioma'), 'en')

    expect(await screen.findByText('Garages near your event')).toBeInTheDocument()
    expect(screen.getByText('Running (version 0.0.0)')).toBeInTheDocument()
  })
})
