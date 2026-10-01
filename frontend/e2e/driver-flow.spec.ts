import { expect, test } from '@playwright/test'
import { expectAccessible, pickAkronFirstEvent, signInWithPhone } from './helpers'

const AVAILABLE_GARAGE = 'Cajón techado para auto compacto'
const TAKEN_GARAGE = 'Cochera con portón eléctrico'

test.describe('driver books a garage in four steps', () => {
  test('venue, garage, time and payment end to end, then cancels', async ({ page }) => {
    // Step 1 of 4: venue and event
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('¿A qué evento vas?')
    await expect(page.getByText('Paso 1 de 4')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Ver cocheras' })).toBeDisabled()
    await expectAccessible(page)

    await page.getByText('Estadio Akron', { exact: true }).click()
    await page.getByText('Concierto de ejemplo').click()
    await page.getByRole('button', { name: 'Ver cocheras' }).click()

    // Step 2 of 4: garages on the map and list
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Cocheras cerca de Estadio Akron',
    )
    await expect(page.getByText('Paso 2 de 4')).toBeVisible()
    const taken = page.getByRole('button', { name: TAKEN_GARAGE, exact: true })
    await expect(taken).toBeDisabled()
    await expect(page.getByText('No disponible').first()).toBeVisible()
    await expectAccessible(page)

    await page.getByRole('button', { name: AVAILABLE_GARAGE, exact: true }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(AVAILABLE_GARAGE)
    await expect(page.getByRole('heading', { name: 'Reseñas' })).toBeVisible()
    await expect(page.getByText('Anfitrión:')).toBeVisible()
    await expect(page.getByText('La dirección exacta se muestra cuando confirmas')).toBeVisible()
    await expectAccessible(page)
    await page.getByRole('button', { name: 'Elegir horario' }).click()

    // Step 3 of 4: time and plate
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu horario')
    await expect(page.getByText('Paso 3 de 4')).toBeVisible()
    await expect(page.getByText('Duración:')).toBeVisible()
    await expectAccessible(page)

    await page.getByRole('button', { name: 'Continuar al pago' }).click()
    await expect(page.getByText('Escribe la placa completa, por ejemplo JAL-482-A.')).toBeVisible()

    await page.getByLabel('Placa del auto').fill('jal482a')
    await page.getByRole('button', { name: 'Continuar al pago' }).click()

    // Step 4 of 4: sign in, then pay
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Pago')
    await expect(page.getByText('Paso 4 de 4')).toBeVisible()
    await expect(page.getByRole('button', { name: /Pagar y reservar/ })).toBeDisabled()
    await expectAccessible(page)

    await signInWithPhone(page)
    await expect(page.getByText('Tarjeta de ejemplo terminada en 4242')).toBeVisible()
    await page.getByRole('button', { name: /Pagar y reservar/ }).click()

    // Confirmation: the ticket reveals the address and the access code
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lugar reservado')
    const ticket = page.getByRole('article', { name: AVAILABLE_GARAGE })
    await expect(ticket).toBeVisible()
    await expect(ticket.getByText('JAL482A')).toBeVisible()
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

  test('another driver takes the garage while this one is paying: no double booking', async ({
    page,
  }) => {
    await pickAkronFirstEvent(page)
    await page.getByRole('button', { name: AVAILABLE_GARAGE, exact: true }).click()
    await page.getByRole('button', { name: 'Elegir horario' }).click()
    await page.getByLabel('Placa del auto').fill('JAL482A')
    await page.getByRole('button', { name: 'Continuar al pago' }).click()
    await signInWithPhone(page)
    await expect(page.getByText('Tarjeta de ejemplo terminada en 4242')).toBeVisible()

    // Someone else books the same garage for the same hours.
    const url = new URL(page.url())
    await page.evaluate(
      ({ spaceId, from, to }) => window.__mockDb!.seedForeignBooking(spaceId, from, to),
      {
        spaceId: 'akron-2',
        from: url.searchParams.get('from')!,
        to: url.searchParams.get('to')!,
      },
    )

    await page.getByRole('button', { name: /Pagar y reservar/ }).click()
    await expect(page.getByRole('alert')).toContainText('Alguien acaba de reservar esta cochera')
    await expect(page).toHaveURL(/\/book\/akron-2\/pay/)
    await expect(page.getByRole('link', { name: 'Elegir otra cochera' })).toBeVisible()
    await expectAccessible(page)

    // Nothing was booked.
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

  test('signed-out visitors are asked to sign in to see bookings', async ({ page }) => {
    await page.goto('/bookings')
    await expect(
      page.getByRole('heading', { name: 'Inicia sesión para ver tus reservas' }),
    ).toBeVisible()
    await expectAccessible(page)
  })

  test('the session and bookings survive a reload', async ({ page }) => {
    await pickAkronFirstEvent(page)
    await page.getByRole('button', { name: AVAILABLE_GARAGE, exact: true }).click()
    await page.getByRole('button', { name: 'Elegir horario' }).click()
    await page.getByLabel('Placa del auto').fill('JAL482A')
    await page.getByRole('button', { name: 'Continuar al pago' }).click()
    await signInWithPhone(page)
    await page.getByRole('button', { name: /Pagar y reservar/ }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lugar reservado')

    await page.goto('/bookings')
    await page.reload()
    await expect(page.getByText('Confirmada', { exact: true })).toBeVisible()
  })

  test('works in English', async ({ page }) => {
    await page.goto('/profile')
    await page.getByRole('radio', { name: 'English' }).check({ force: true })
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Which event are you going to?',
    )
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
    await expectAccessible(page)
  })
})
