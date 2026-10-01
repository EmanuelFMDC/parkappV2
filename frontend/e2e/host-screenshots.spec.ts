import { expect, test } from '@playwright/test'
import { HOST_ID, HOST_PHONE, OTHER_ID, TINY_PNG, signInAsSeeded } from './helpers'

// Regenerate with: SCREENSHOTS=1 npx playwright test host-screenshots
const OUT = '../docs/host/screenshots'

test.skip(!process.env.SCREENSHOTS, 'only when SCREENSHOTS=1')

test('host flow screenshots', async ({ page }, testInfo) => {
  test.setTimeout(120_000)
  const p = testInfo.project.name
  const shot = async (name: string) => {
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.screenshot({ path: `${OUT}/${p}-${name}.png` })
  }

  // A newcomer sees the invitation
  await page.goto('/host')
  await expect(page.getByText('Renta tu cochera los días de evento')).toBeVisible()
  await shot('1-intro')

  await signInAsSeeded(page, HOST_ID, HOST_PHONE)

  // Step 1: location
  await page.goto('/host/new/location')
  await page.getByLabel('Recinto cercano').selectOption('akron')
  await page.getByLabel('Calle y número').fill('Av. Patria 1234')
  await page.getByLabel('Colonia').fill('Jardines Universidad')
  await page.getByLabel('Municipio').selectOption('Zapopan')
  await page.getByLabel('Referencias (opcional)').fill('Portón negro junto a la farmacia')
  await page.getByRole('button', { name: 'Mover al este' }).click()
  await page.getByRole('button', { name: 'Mover al norte' }).click()
  await page.getByRole('group', { name: 'Mapa de cocheras cercanas' }).scrollIntoViewIfNeeded()
  await shot('2-location')
  await page.getByRole('button', { name: 'Continuar' }).click()

  // Step 2: dimensions
  await page.getByLabel(/Largo/).fill('520')
  await page.getByLabel(/Ancho/).fill('300')
  await page.getByLabel(/Altura de la entrada/).fill('230')
  await page.getByLabel('Techado').check()
  await page.getByLabel('Portón eléctrico').check()
  await shot('3-size')
  await page.getByRole('button', { name: 'Continuar' }).click()

  // Step 3: photos
  await page.getByLabel('Agregar fotos').setInputFiles(
    ['uno.png', 'dos.png', 'tres.png', 'cuatro.png'].map((name) => ({
      name,
      mimeType: 'image/png',
      buffer: TINY_PNG,
    })),
  )
  await expect(page.getByText('4 de 8 fotos (mínimo 3)')).toBeVisible()
  await page.getByLabel('Título del anuncio').fill('Cochera techada junto al estadio')
  await page.getByLabel('Descripción (opcional)').fill('Entrada amplia y portón eléctrico.')
  await shot('4-photos')
  await page.getByRole('button', { name: 'Continuar' }).click()

  // Step 4: price
  await page.getByLabel('Precio por hora (pesos)').fill('60')
  await page.getByLabel(/Acepto las reglas para anfitriones/).check()
  await shot('5-price')
  await page.getByRole('button', { name: 'Publicar cochera' }).click()

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu cochera está en revisión')
  await shot('6-done')

  await page.goto('/host')
  await expect(page.getByText('En revisión')).toBeVisible()
  await shot('7-home-in-review')

  // Approved, and a driver booked it
  await page.evaluate(
    ({ other }) => {
      const db = window.__mockDb!
      db.approveAllSpacesNow()
      const space = db.listHostSpaces('mock-user-3311111111')[0]!
      const event = db.listEvents('akron')[0]!
      const vehicleId = db.seedVerifiedAccount(other).vehicles[0]!.id
      const booking = db.createBooking(other, {
        spaceId: space.id,
        startsAt: new Date(Date.parse(event.startsAt) - 2 * 3_600_000).toISOString(),
        endsAt: new Date(Date.parse(event.endsAt) + 3_600_000).toISOString(),
        vehicleId,
      })
      db.confirmBooking(other, booking.id, 'pi_demo')
    },
    { other: OTHER_ID },
  )
  await page.goto('/host')
  await expect(page.getByText('Publicada')).toBeVisible()
  await shot('8-home-live')

  await page.goto('/host?tab=bookings')
  await expect(page.getByText('Identidad verificada')).toBeVisible()
  await shot('9-bookings-received')
})
