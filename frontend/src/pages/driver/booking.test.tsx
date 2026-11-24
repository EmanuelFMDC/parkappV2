import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { MemoryRouter, Route, Routes } from 'react-router-dom'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { Providers } from '../../app/Providers'
import i18n from '../../i18n'
import { offsetPoint } from '../../lib/geo'
import { API_URL } from '../../mocks/handlers'
import { buildSpaces, venues } from '../../mocks/domain/seed'
import { resetTestDb, testDb } from '../../mocks/server'
import { createMockServices } from '../../services'
import HostBookingsPage from '../host/HostBookingsPage'
import BookingPage from './BookingPage'

const DRIVER = 'mock-google-user'
const HOUR = 3_600_000

beforeEach(async () => {
  resetTestDb({ identityDelayMs: 0, reviewDelayMs: 0 })
  await i18n.changeLanguage('es-MX')
})

/** A confirmed booking on a seeded garage that starts `startsInH` hours from now. */
function confirmedBooking(startsInH: number) {
  const db = testDb()
  const vehicleId = db.seedVerifiedAccount(DRIVER).vehicles[0]!.id
  const start = Date.now() + startsInH * HOUR
  const held = db.createBooking(DRIVER, {
    spaceId: 'akron-1',
    startsAt: new Date(start).toISOString(),
    endsAt: new Date(start + 2 * HOUR).toISOString(),
    vehicleId,
  })
  return db.confirmBooking(DRIVER, held.id, 'pi_test')
}

async function renderBooking(id: string) {
  const services = createMockServices()
  await services.auth.signInWithGoogle()
  return render(
    <Providers apiBaseUrl={API_URL} services={services}>
      <MemoryRouter initialEntries={[`/bookings/${id}`]}>
        <Routes>
          <Route path="bookings/:bookingId" element={<BookingPage />} />
        </Routes>
      </MemoryRouter>
    </Providers>,
  )
}

describe('driver cancels', () => {
  it('for free 2 hours or more before the start, and sees the full refund', async () => {
    const b = confirmedBooking(5)
    await renderBooking(b.id)
    expect(await screen.findByText(/Cancelación gratis hasta el/)).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Aún es gratis')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Sí, cancelar' }))

    expect(await screen.findByText('Esta reserva fue cancelada.')).toBeInTheDocument()
    expect(screen.getByText(/^Te devolvemos \$/)).toBeInTheDocument()
    expect(testDb().getBooking(DRIVER, b.id)).toMatchObject({
      cancellationFeeCents: 0,
      refundCents: b.totalCents,
    })
  })

  it('with a 20 % penalty less than 2 hours before, told before confirming', async () => {
    const b = confirmedBooking(1)
    await renderBooking(b.id)
    expect(
      await screen.findByText(/Si cancelas ahora se cobra una penalización/),
    ).toBeInTheDocument()

    await userEvent.click(screen.getByRole('button', { name: 'Cancelar reserva' }))
    expect(screen.getByRole('dialog')).toHaveTextContent('Faltan menos de 2 horas')
    await userEvent.click(screen.getByRole('button', { name: 'Sí, cancelar' }))

    expect(await screen.findByText(/penalización por cancelación tardía/)).toBeInTheDocument()
    expect(testDb().getBooking(DRIVER, b.id).cancellationFeeCents).toBe(b.lateCancelFeeCents)
  })
})

describe('host cancels', () => {
  const HOST = 'mock-google-user'
  const OTHER_DRIVER = 'mock-user-3322222222'

  it('from their bookings, and the driver gets 100 % back', async () => {
    const db = testDb()
    db.updateProfile(HOST, {
      firstName: 'Marisol',
      lastName: 'Ríos',
      birthDate: '1988-04-12',
      email: 'marisol@example.com',
      acceptPrivacy: true,
    })
    db.startIdentity(HOST)
    const akron = venues.find((v) => v.id === 'akron')!
    const space = db.createHostSpace(HOST, {
      venueId: 'akron',
      street: 'Av. Patria 1234',
      neighborhood: 'Jardines Universidad',
      municipality: 'Zapopan',
      location: offsetPoint(akron.location, 500, 90),
      dimensions: { lengthCm: 520, widthCm: 300, heightCm: 230 },
      quantity: 1,
      availability: null,
      features: [],
      description: '',
      photoKeys: ['a', 'b', 'c'],
      acceptHostTerms: true,
    })
    db.approveAllSpacesNow()
    const vehicleId = db.seedVerifiedAccount(OTHER_DRIVER).vehicles[0]!.id
    const start = Date.now() + HOUR
    const held = db.createBooking(OTHER_DRIVER, {
      spaceId: space.id,
      startsAt: new Date(start).toISOString(),
      endsAt: new Date(start + 2 * HOUR).toISOString(),
      vehicleId,
    })
    const b = db.confirmBooking(OTHER_DRIVER, held.id, 'pi_test')

    const services = createMockServices()
    await services.auth.signInWithGoogle()
    render(
      <Providers apiBaseUrl={API_URL} services={services}>
        <MemoryRouter initialEntries={['/host/bookings']}>
          <Routes>
            <Route path="host/bookings" element={<HostBookingsPage />} />
          </Routes>
        </MemoryRouter>
      </Providers>,
    )

    await userEvent.click(await screen.findByRole('button', { name: 'Cancelar reserva' }))
    const dialog = screen.getByRole('dialog')
    expect(dialog).toHaveTextContent('Le devolvemos el 100 % de su pago')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Sí, cancelar' }))

    expect(await screen.findByText(/Cancelaste esta reserva/)).toBeInTheDocument()
    expect(db.getBooking(OTHER_DRIVER, b.id)).toMatchObject({
      status: 'cancelled',
      cancelledBy: 'host',
      cancellationFeeCents: 0,
      refundCents: b.totalCents,
    })
  })
})

describe('getting there (step 4)', () => {
  it('a confirmed booking links to turn-by-turn directions to the exact pin', async () => {
    const b = confirmedBooking(5)
    // The exact pin, not the approximate one drivers see before booking.
    const { lat, lng } = buildSpaces().find((s) => s.id === 'akron-1')!.location
    await renderBooking(b.id)
    const link = await screen.findByRole('link', { name: /Cómo llegar/ })
    expect(link).toHaveAttribute('href', expect.stringContaining(`destination=${lat},${lng}`))
    expect(link).toHaveAttribute('target', '_blank')
    expect(link).toHaveAttribute('rel', expect.stringContaining('noopener'))
  })
})

describe('arriving and leaving', () => {
  const photo = (name: string) => new File(['x'], name, { type: 'image/jpeg' })
  const pick = (...names: string[]) =>
    userEvent.upload(screen.getByLabelText('Agregar fotos'), names.map(photo))

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview')
    URL.revokeObjectURL = vi.fn()
  })

  it('says when check-in opens if it is too early', async () => {
    const b = confirmedBooking(5)
    await renderBooking(b.id)
    expect(await screen.findByText(/Podrás registrar tu llegada desde/)).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Registrar llegada/ })).not.toBeInTheDocument()
  })

  it('checks in and out with photos, with no extra charge on time', async () => {
    const b = confirmedBooking(0.1) // starts in 6 minutes: check-in is open
    await renderBooking(b.id)

    await userEvent.click(await screen.findByRole('button', { name: /Registrar llegada/ }))
    expect(
      await screen.findByText('Toma al menos 2 fotos: el auto y el cajón.'),
    ).toBeInTheDocument()

    await pick('auto.jpg', 'cajon.jpg')
    expect(await screen.findByText('2 de 4 fotos (mínimo 2)')).toBeInTheDocument()
    expect(screen.queryByText('Portada')).not.toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Registrar llegada/ }))

    expect(await screen.findByText('En uso', { exact: true })).toBeInTheDocument()
    expect(screen.getByText(/Sal antes del/)).toBeInTheDocument()

    await pick('auto2.jpg', 'cajon2.jpg')
    await userEvent.click(await screen.findByRole('button', { name: /Registrar salida/ }))
    expect(await screen.findByText('Sin cargos extra.')).toBeInTheDocument()
    expect(testDb().getBooking(DRIVER, b.id)).toMatchObject({
      status: 'completed',
      checkInPhotoCount: 2,
      checkOutPhotoCount: 2,
      overtimeHours: 0,
    })
  })
})

describe('reporting a problem', () => {
  it('sends a report for mediation and shows it on the booking', async () => {
    const b = confirmedBooking(5)
    await renderBooking(b.id)
    await userEvent.click(await screen.findByRole('button', { name: /Reportar un problema/ }))
    const dialog = screen.getByRole('dialog', { name: 'Reportar un problema' })

    await userEvent.type(within(dialog).getByLabelText('Qué pasó'), 'Corto')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enviar reporte' }))
    expect(await within(dialog).findByText(/al menos 10 caracteres/)).toBeInTheDocument()

    await userEvent.selectOptions(within(dialog).getByLabelText('Tipo de problema'), 'access')
    await userEvent.type(within(dialog).getByLabelText('Qué pasó'), ': el portón estaba cerrado.')
    await userEvent.click(within(dialog).getByRole('button', { name: 'Enviar reporte' }))

    expect(await screen.findByText(/Reportaste: Acceso o lugar ocupado/)).toBeInTheDocument()
    expect(screen.getByText('En revisión')).toBeInTheDocument()
    expect(testDb().getBooking(DRIVER, b.id).incidents).toEqual([
      expect.objectContaining({ category: 'access', status: 'open' }),
    ])
  })
})
