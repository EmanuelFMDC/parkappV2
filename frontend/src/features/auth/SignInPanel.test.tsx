import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { beforeEach, describe, expect, it } from 'vitest'
import { Providers } from '../../app/Providers'
import i18n from '../../i18n'
import { createMockServices } from '../../services'
import { useAuth } from './context'
import { SignInPanel } from './SignInPanel'

function Who() {
  const { user } = useAuth()
  return <p data-testid="who">{user?.id ?? 'nobody'}</p>
}

function setup() {
  const services = createMockServices()
  render(
    <Providers services={services}>
      <SignInPanel />
      <Who />
    </Providers>,
  )
  return services
}

beforeEach(async () => {
  await i18n.changeLanguage('es-MX')
})

describe('SignInPanel', () => {
  it('rejects a phone that is not 10 digits', async () => {
    setup()
    await userEvent.type(screen.getByLabelText('Teléfono'), '331234')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar código' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Escribe un teléfono de 10 dígitos.')
    expect(screen.getByTestId('who')).toHaveTextContent('nobody')
  })

  it('signs in with a phone and the test code', async () => {
    setup()
    await userEvent.type(screen.getByLabelText('Teléfono'), '33 1234 5678')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar código' }))
    await userEvent.type(await screen.findByLabelText('Código de 6 dígitos'), '000000')
    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }))
    expect(await screen.findByText('mock-user-3312345678')).toBeInTheDocument()
  })

  it('keeps the driver signed out on a wrong code and says so', async () => {
    setup()
    await userEvent.type(screen.getByLabelText('Teléfono'), '3312345678')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar código' }))
    await userEvent.type(await screen.findByLabelText('Código de 6 dígitos'), '123456')
    await userEvent.click(screen.getByRole('button', { name: 'Verificar' }))
    expect(await screen.findByRole('alert')).toHaveTextContent('El código no es correcto')
    expect(screen.getByTestId('who')).toHaveTextContent('nobody')
  })

  it('lets the driver go back and change the phone', async () => {
    setup()
    await userEvent.type(screen.getByLabelText('Teléfono'), '3312345678')
    await userEvent.click(screen.getByRole('button', { name: 'Enviar código' }))
    await userEvent.click(await screen.findByRole('button', { name: 'Cambiar teléfono' }))
    expect(screen.getByLabelText('Teléfono')).toBeInTheDocument()
  })
})
