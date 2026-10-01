import { expect, test, type Page } from '@playwright/test'
import {
  createAccount,
  expectAccessible,
  fillProfile,
  pickAkronFirstEvent,
  signInAsVerifiedDriver,
  signInWithPhone,
  waitForMockDb,
} from './helpers'

const AVAILABLE_GARAGE = 'Cajón techado para auto compacto'
const TAKEN_GARAGE = 'Cochera con portón eléctrico'

/** Continue from the detail page to payment for a driver who already has a verified account. */
async function goToPayment(page: Page) {
  await pickAkronFirstEvent(page)
  await page.getByRole('button', { name: AVAILABLE_GARAGE, exact: true }).click()
  await page.getByRole('button', { name: 'Elegir horario' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu horario')
  await page.getByRole('button', { name: 'Continuar al pago' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pago')
}

test.describe('driver books a garage in four steps', () => {
  test('a new driver creates an account at step 2, then books, then cancels', async ({ page }) => {
    // Registration waits for the simulated identity provider (about 3 s plus one poll).
    test.setTimeout(90_000)
    // Step 1 of 4: venue and event
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('¿A qué evento vas?')
    await expect(page.getByText('Paso 1 de 4')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ver cocheras' })).toBeDisabled()
    await expectAccessible(page)

    await page.getByText('Estadio Akron', { exact: true }).click()
    await page.getByText('Concierto de ejemplo').click()
    await page.getByRole('button', { name: 'Ver cocheras' }).click()

    // Step 2 of 4: browsing is open to everyone
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Cocheras cerca de Estadio Akron',
    )
    await expect(page.getByText('Paso 2 de 4')).toBeVisible()
    await expect(page.getByRole('button', { name: TAKEN_GARAGE, exact: true })).toBeDisabled()
    await expect(page.getByText('No disponible').first()).toBeVisible()
    await expectAccessible(page)

    await page.getByRole('button', { name: AVAILABLE_GARAGE, exact: true }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(AVAILABLE_GARAGE)
    await expect(page.getByRole('heading', { name: 'Reseñas' })).toBeVisible()
    await expect(page.getByText('La dirección exacta se muestra cuando confirmas')).toBeVisible()
    await expectAccessible(page)

    // Continuing without an account sends the driver to create one
    await page.getByRole('button', { name: 'Crear cuenta para continuar' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Crea tu cuenta')
    await expect(page).toHaveURL(/\/account\/new\?next=/)
    await expect(page.getByText('Paso 1 de 4')).toBeVisible()
    await expectAccessible(page)

    await signInWithPhone(page)
    await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible()
    await expect(page.getByText('Paso 2 de 4')).toBeVisible()
    await expectAccessible(page)
    await fillProfile(page)

    await expect(page.getByRole('heading', { name: 'Tu auto' })).toBeVisible()
    await expect(page.getByText('Paso 3 de 4')).toBeVisible()
    await expectAccessible(page)
    await page.getByLabel('Placa').fill('jal482a')
    await page.getByLabel('Marca').fill('Nissan')
    await page.getByLabel('Modelo').fill('Versa')
    await page.getByLabel('Color').fill('Gris')
    await page.getByRole('button', { name: 'Guardar auto y continuar' }).click()

    await expect(page.getByRole('heading', { name: 'Verifica tu identidad' })).toBeVisible()
    await expect(page.getByText('Paso 4 de 4')).toBeVisible()
    await expectAccessible(page)
    await page.getByRole('button', { name: 'Verificar mi identidad' }).click()
    await expect(page.getByText(/Estamos revisando tu identidad/)).toBeVisible()

    // The account is verified: the driver lands on step 3, exactly where they were going
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu horario', {
      timeout: 15_000,
    })
    await expect(page.getByText('Paso 3 de 4')).toBeVisible()

    // Step 3 of 4: no plate field, the registered car is used
    await expect(page.getByText('Nissan Versa · Gris · JAL-482-A')).toBeVisible()
    await expect(page.getByLabel(/placa/i)).toHaveCount(0)
    await expect(page.getByText('Duración:')).toBeVisible()
    await expectAccessible(page)
    await page.getByRole('button', { name: 'Continuar al pago' }).click()

    // Step 4 of 4: no sign-in here any more, just pay
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pago')
    await expect(page.getByText('Paso 4 de 4')).toBeVisible()
    await expect(page.getByText('Nissan Versa · Gris · JAL-482-A')).toBeVisible()
    await expect(page.getByLabel('Teléfono', { exact: true })).toHaveCount(0)
    await expect(page.getByText('Tarjeta de ejemplo terminada en 4242')).toBeVisible()
    await expectAccessible(page)
    await page.getByRole('button', { name: /Pagar y reservar/ }).click()

    // Confirmation: the ticket reveals the address and the access code
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lugar reservado')
    const ticket = page.getByRole('article', { name: AVAILABLE_GARAGE })
    await expect(ticket).toBeVisible()
    await expect(ticket.getByText('JAL-482-A')).toBeVisible()
    await expect(page.getByText('Calle de ejemplo').first()).toBeVisible()
    await expect(ticket.getByText(/^[A-Z0-9]{6}$/)).toBeVisible()
    await expectAccessible(page)

    // My bookings
    await page.goto('/bookings')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mis reservas')
    await expect(page.getByText('Confirmada', { exact: true })).toBeVisible()
    await expectAccessible(page)

    // Cancel (free until 10 minutes before arrival)
    await page.getByRole('link', { name: new RegExp(AVAILABLE_GARAGE) }).click()
    await page.getByRole('button', { name: 'Cancelar reserva' }).click()
    const dialog = page.getByRole('dialog', { name: '¿Cancelar esta reserva?' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('button', { name: 'Sí, cancelar' }).click()
    await expect(page.getByText('Cancelada', { exact: true })).toBeVisible()
    await expect(page.getByText('Esta reserva fue cancelada.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Cancelar reserva' })).toHaveCount(0)
  })

  test('a signed-out visitor cannot open step 3 or 4 by typing the address', async ({ page }) => {
    await pickAkronFirstEvent(page)
    const search = new URL(page.url()).search
    for (const step of ['time', 'pay']) {
      await page.goto(`/book/akron-2/${step}${search}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('Crea tu cuenta')
      await expect(page).toHaveURL(new RegExp(`next=%2Fbook%2Fakron-2%2F${step}`))
    }
  })

  test('someone with a half-finished account is sent to finish it', async ({ page }) => {
    await pickAkronFirstEvent(page)
    const search = new URL(page.url()).search
    await page.goto('/account/new')
    await signInWithPhone(page) // phone only: no details, no car, no identity
    await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible()

    await page.goto(`/book/akron-2/time${search}`)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Crea tu cuenta')
    await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible()
  })

  test('a rejected identity check can be retried', async ({ page }) => {
    await page.goto('/account/new')
    await waitForMockDb(page)
    // Set after loading: a navigation would reload the page and forget it.
    await page.evaluate(() => window.__mockDb!.setIdentityOutcome('rejected'))
    await createAccount(page)
    await expect(page.getByText(/No pudimos verificar tu identidad/)).toBeVisible({
      timeout: 15_000,
    })
    await expectAccessible(page)

    await page.evaluate(() => window.__mockDb!.setIdentityOutcome('verified'))
    await page.getByRole('button', { name: 'Intentar de nuevo' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('¿A qué evento vas?', {
      timeout: 15_000,
    })
  })

  test('registration refuses someone under 18 and a missing consent', async ({ page }) => {
    await page.goto('/account/new')
    await signInWithPhone(page)
    await page.getByLabel('Nombre(s)').fill('Ana')
    await page.getByLabel('Apellidos').fill('López')
    await page.getByLabel('Fecha de nacimiento').fill('2015-01-01')
    await page.getByLabel('Correo electrónico').fill('ana@example.com')
    await page.getByRole('button', { name: 'Guardar y continuar' }).click()
    await expect(page.getByText('Debes tener 18 años o más para reservar.')).toBeVisible()

    await page.getByLabel('Fecha de nacimiento').fill('1995-03-02')
    await page.getByRole('button', { name: 'Guardar y continuar' }).click()
    await expect(
      page.getByText('Para continuar debes aceptar el aviso de privacidad.'),
    ).toBeVisible()
    await expectAccessible(page)
  })

  test('a car that does not fit the garage is flagged and blocks booking it', async ({ page }) => {
    await signInAsVerifiedDriver(page, { type: 'pickup', plate: 'PIC111' })
    await pickAkronFirstEvent(page)
    // This garage accepts compact and sedan only.
    await page.getByRole('button', { name: AVAILABLE_GARAGE, exact: true }).click()
    await expect(page.getByText('Ninguno de tus autos cabe en esta cochera.')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Elegir horario' })).toBeDisabled()
    await expectAccessible(page)
  })

  test('a verified driver goes straight through steps 3 and 4 without any account screen', async ({
    page,
  }) => {
    await signInAsVerifiedDriver(page)
    await goToPayment(page)
    await expect(page.getByLabel('Teléfono', { exact: true })).toHaveCount(0)
    await page.getByRole('button', { name: /Pagar y reservar/ }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lugar reservado')
  })

  test('another driver takes the garage while this one is paying: no double booking', async ({
    page,
  }) => {
    await signInAsVerifiedDriver(page)
    await goToPayment(page)

    // Someone else books the same garage for the same hours.
    const url = new URL(page.url())
    await page.evaluate(
      ({ from, to }) => window.__mockDb!.seedForeignBooking('akron-2', from, to),
      { from: url.searchParams.get('from')!, to: url.searchParams.get('to')! },
    )

    await page.getByRole('button', { name: /Pagar y reservar/ }).click()
    await expect(page.getByRole('alert')).toContainText('Alguien acaba de reservar esta cochera')
    await expect(page).toHaveURL(/\/book\/akron-2\/pay/)
    await expect(page.getByRole('link', { name: 'Elegir otra cochera' })).toBeVisible()
    await expectAccessible(page)

    await page.goto('/bookings')
    await expect(page.getByText('Aún no tienes reservas')).toBeVisible()
  })

  test('shows a garage as unavailable on the list when someone books it', async ({ page }) => {
    await pickAkronFirstEvent(page)
    const url = new URL(page.url())
    const garage = page.getByRole('button', { name: AVAILABLE_GARAGE, exact: true })
    await expect(garage).toBeEnabled()

    await page.evaluate(
      ({ from, to }) => window.__mockDb!.seedForeignBooking('akron-2', from, to),
      { from: url.searchParams.get('from')!, to: url.searchParams.get('to')! },
    )
    // The list polls every 15 s; a window refocus refetches right away.
    await page.evaluate(() => window.dispatchEvent(new Event('focus')))
    await expect(garage).toBeDisabled({ timeout: 20_000 })
  })

  test('signed-out visitors are invited to create an account to see bookings', async ({ page }) => {
    await page.goto('/bookings')
    await expect(
      page.getByRole('heading', { name: 'Crea tu cuenta para ver tus reservas' }),
    ).toBeVisible()
    await page.getByRole('button', { name: 'Crear cuenta o iniciar sesión' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Crea tu cuenta')
    await expectAccessible(page)
  })

  test('the account, car and bookings survive a reload, and the profile shows them', async ({
    page,
  }) => {
    await signInAsVerifiedDriver(page)
    await goToPayment(page)
    await page.getByRole('button', { name: /Pagar y reservar/ }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lugar reservado')

    await page.goto('/bookings')
    await page.reload()
    await expect(page.getByText('Confirmada', { exact: true })).toBeVisible()

    await page.goto('/profile')
    await expect(page.getByText('Prueba Conductor')).toBeVisible()
    await expect(page.getByText('Identidad verificada').first()).toBeVisible()
    await expect(page.getByText('Nissan Versa · Gris · JAL-482-A')).toBeVisible()
    await expectAccessible(page)
  })

  test('works in English', async ({ page }) => {
    await page.goto('/profile')
    await page.getByRole('radio', { name: 'English' }).check({ force: true })
    await page.goto('/account/new')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Create your account')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expectAccessible(page)
  })
})
