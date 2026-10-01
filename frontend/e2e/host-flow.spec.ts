import { expect, test } from '@playwright/test'
import {
  HOST_ID,
  HOST_PHONE,
  OTHER_ID,
  OTHER_PHONE,
  PHONE,
  TINY_PNG,
  expectAccessible,
  fillProfile,
  pickAkronFirstEvent,
  seedDraft,
  signInAsSeeded,
  signInWithPhone,
  signOut,
  waitForMockDb,
} from './helpers'

const TITLE = 'Cochera techada junto al estadio'

test.describe('host lists a garage in four steps', () => {
  test('a newcomer registers as a host, lists a garage, and drivers can find it once approved', async ({
    page,
  }) => {
    test.setTimeout(120_000)

    // Intro for someone who is not a host yet
    await page.goto('/host')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Anfitrión')
    await expect(page.getByText('Renta tu cochera los días de evento')).toBeVisible()
    await expectAccessible(page)
    await page.getByRole('button', { name: 'Empezar a publicar' }).click()

    // Registration as a host: three steps, no car
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Crea tu cuenta')
    await expect(page.getByText('Paso 1 de 3')).toBeVisible()
    await expect(page.getByText(/necesitamos saber quién eres/)).toBeVisible()
    await signInWithPhone(page, PHONE)
    await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible()
    await expect(page.getByText('Paso 2 de 3')).toBeVisible()
    await fillProfile(page)
    await expect(page.getByRole('heading', { name: 'Verifica tu identidad' })).toBeVisible()
    await expect(page.getByText('Paso 3 de 3')).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Tu auto' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Verificar mi identidad' }).click()

    // Step 1 of 4: location
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('¿Dónde está tu cochera?', {
      timeout: 15_000,
    })
    await expect(page.getByText('Paso 1 de 4')).toBeVisible()
    await expect(page.getByText('Ubicación').first()).toBeVisible()
    await expect(page.getByText('Elige primero el recinto cercano para ver el mapa.')).toBeVisible()
    await page.getByLabel('Recinto cercano').selectOption('akron')
    await page.getByLabel('Calle y número').fill('Av. Patria 1234')
    await page.getByLabel('Colonia').fill('Jardines Universidad')
    await page.getByLabel('Municipio').selectOption('Zapopan')
    await page.getByLabel('Referencias (opcional)').fill('Portón negro junto a la farmacia')
    await expect(page.getByRole('status').filter({ hasText: 'de Estadio Akron' })).toBeVisible()
    await page.getByRole('button', { name: 'Mover al este' }).click()
    await expect(
      page.getByRole('status').filter({ hasText: /A 4\d\d\s?m de Estadio Akron/ }),
    ).toBeVisible()
    await expectAccessible(page)
    await page.getByRole('button', { name: 'Continuar' }).click()

    // Step 2 of 4: dimensions; the cars that fit are suggested
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Medidas del espacio')
    await expect(page.getByText('Paso 2 de 4')).toBeVisible()
    await page.getByLabel(/Largo/).fill('520')
    await page.getByLabel(/Ancho/).fill('300')
    await page.getByLabel(/Altura de la entrada/).fill('230')
    await expect(page.getByLabel('Compacto')).toBeChecked()
    await expect(page.getByLabel('Sedán')).toBeChecked()
    await expect(page.getByLabel('SUV')).toBeChecked()
    await expect(page.getByLabel('Pick-up')).not.toBeChecked()
    await page.getByLabel('Techado').check()
    await page.getByLabel('Portón eléctrico').check()
    await expectAccessible(page)
    await page.getByRole('button', { name: 'Continuar' }).click()

    // Step 3 of 4: photos and description
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Fotos y descripción')
    await expect(page.getByText('Paso 3 de 4')).toBeVisible()
    await page.getByLabel('Agregar fotos').setInputFiles(
      ['uno.png', 'dos.png', 'tres.png'].map((name) => ({
        name,
        mimeType: 'image/png',
        buffer: TINY_PNG,
      })),
    )
    await expect(page.getByText('3 de 8 fotos (mínimo 3)')).toBeVisible()
    await expect(page.getByText('Portada')).toBeVisible()
    await page.getByLabel('Título del anuncio').fill(TITLE)
    await page.getByLabel('Descripción (opcional)').fill('Entrada amplia y portón eléctrico.')
    await expectAccessible(page)
    await page.getByRole('button', { name: 'Continuar' }).click()

    // Step 4 of 4: price and publish
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Precio')
    await expect(page.getByText('Paso 4 de 4')).toBeVisible()
    await page.getByLabel('Precio por hora (pesos)').fill('60')
    await expect(page.getByText('Por 4 horas: $240')).toBeVisible()
    await expect(page.getByText(TITLE)).toBeVisible()
    await page.getByLabel(/Acepto las reglas para anfitriones/).check()
    await expectAccessible(page)
    await page.getByRole('button', { name: 'Publicar cochera' }).click()

    // Done: in review, not live yet
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu cochera está en revisión')
    await expectAccessible(page)
    await page.getByRole('button', { name: 'Ver mis cocheras' }).click()
    await expect(page.getByText('En revisión')).toBeVisible()
    await expect(page.getByText('Av. Patria 1234, Zapopan')).toBeVisible()

    // Drivers do not see it yet...
    await pickAkronFirstEvent(page)
    await expect(page.getByRole('button', { name: TITLE, exact: true })).toHaveCount(0)

    // ...but once back-office approves it, they do, marked as new
    await page.goto('/host')
    await expect(page.getByText('Publicada')).toBeVisible({ timeout: 20_000 })
    await expectAccessible(page)
    await pickAkronFirstEvent(page)
    const card = page.getByRole('button', { name: TITLE, exact: true })
    await expect(card).toBeVisible()
    await expect(page.getByText('Nueva').first()).toBeVisible()
    await card.click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(TITLE)
    await expect(page.getByText('Anfitrión: Ana L.')).toBeVisible()
  })

  test('registration shows a clear message for each step that is incomplete', async ({ page }) => {
    await page.goto('/')
    await waitForMockDb(page)
    await page.evaluate((id) => window.__mockDb!.seedVerifiedAccount(id), HOST_ID)
    await page.goto('/account/new?next=%2Fhost%2Fnew%2Flocation&as=host')
    await signInWithPhone(page, HOST_PHONE)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('¿Dónde está tu cochera?')

    // Nothing filled in
    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page.getByText('Elige el recinto cercano.')).toBeVisible()
    await expectAccessible(page)

    await page.getByLabel('Recinto cercano').selectOption('akron')
    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page.getByText('Escribe la calle, el número y la colonia.').first()).toBeVisible()

    // A pin outside the 3 km radius is refused with text, not only color
    await page.getByLabel('Calle y número').fill('Av. Patria 1234')
    await page.getByLabel('Colonia').fill('Jardines Universidad')
    await page.getByLabel('Municipio').selectOption('Zapopan')
    const map = page.getByRole('group', { name: 'Mapa de cocheras cercanas' })
    await map.scrollIntoViewIfNeeded()
    const box = (await map.boundingBox())!
    // A little inside the corner: the map has rounded corners, and a click on the very edge misses it.
    await page.mouse.click(box.x + box.width - 14, box.y + 14)
    await expect(page.getByRole('status').filter({ hasText: 'fuera del radio de 3' })).toBeVisible()
    await page.getByRole('button', { name: 'Continuar' }).click()
    await expect(page.getByText('La cochera debe estar a menos de 3 km del recinto.')).toBeVisible()
    await expectAccessible(page)
  })

  test('the steps cannot be skipped by typing the address, and need an account', async ({
    page,
  }) => {
    // Signed out: sent to register as a host
    await page.goto('/host/new/price')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Crea tu cuenta')
    await expect(page).toHaveURL(/as=host/)

    // Signed in as a verified host with an empty draft: sent back to step 1
    await signInAsSeeded(page, HOST_ID, HOST_PHONE)
    for (const step of ['size', 'photos', 'price']) {
      await page.goto(`/host/new/${step}`)
      await expect(page.getByRole('heading', { level: 1 })).toHaveText('¿Dónde está tu cochera?')
    }
  })

  test('a draft survives a reload of the tab', async ({ page }) => {
    await signInAsSeeded(page, HOST_ID, HOST_PHONE)
    await page.goto('/host/new/location')
    await page.getByLabel('Calle y número').fill('Av. Patria 1234')
    await page.reload()
    await expect(page.getByLabel('Calle y número')).toHaveValue('Av. Patria 1234')
  })

  test('back-office can reject a space; the host sees why and can list it again', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await signInAsSeeded(page, HOST_ID, HOST_PHONE)
    await page.evaluate(() => window.__mockDb!.setReviewOutcome('rejected'))
    await seedDraft(page)
    await page.goto('/host/new/price')
    // The reload above reset the in-browser API: set the outcome again before publishing.
    await waitForMockDb(page)
    await page.evaluate(() => window.__mockDb!.setReviewOutcome('rejected'))
    await page.getByRole('button', { name: 'Publicar cochera' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu cochera está en revisión')
    await page.getByRole('button', { name: 'Ver mis cocheras' }).click()

    await expect(page.getByText('Rechazada')).toBeVisible({ timeout: 20_000 })
    await expect(page.getByRole('alert').filter({ hasText: 'fotos' })).toBeVisible()
    await expectAccessible(page)
    await expect(page.getByRole('link', { name: 'Publicar de nuevo' })).toBeVisible()
  })

  test('pausing hides the garage from drivers and resuming brings it back; the price can change', async ({
    page,
  }) => {
    test.setTimeout(90_000)
    await signInAsSeeded(page, HOST_ID, HOST_PHONE)
    await seedDraft(page)
    await page.goto('/host/new/price')
    await page.getByRole('button', { name: 'Publicar cochera' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu cochera está en revisión')
    await page.evaluate(() => window.__mockDb!.approveAllSpacesNow())
    await page.goto('/host')
    await expect(page.getByText('Publicada')).toBeVisible()

    // Change the price
    await page.getByRole('button', { name: 'Cambiar precio' }).click()
    const dialog = page.getByRole('dialog', { name: 'Cambiar el precio por hora' })
    await dialog.getByLabel('Precio por hora (pesos)').fill('5')
    await dialog.getByRole('button', { name: 'Guardar precio' }).click()
    await expect(dialog.getByText('El precio por hora debe estar entre $20 y $500.')).toBeVisible()
    await dialog.getByLabel('Precio por hora (pesos)').fill('75.50')
    await dialog.getByRole('button', { name: 'Guardar precio' }).click()
    await expect(page.getByText('$75.50')).toBeVisible()

    // Pause: drivers stop seeing it
    await page.getByRole('button', { name: 'Pausar' }).click()
    await expect(page.getByText('Pausada').first()).toBeVisible()
    await expectAccessible(page)
    await pickAkronFirstEvent(page)
    await expect(page.getByRole('button', { name: TITLE, exact: true })).toHaveCount(0)

    // Resume: they see it again, at the new price
    await page.goto('/host')
    await page.getByRole('button', { name: 'Reactivar' }).click()
    await expect(page.getByText('Publicada')).toBeVisible()
    await pickAkronFirstEvent(page)
    await expect(page.getByRole('button', { name: TITLE, exact: true })).toBeVisible()
    await expect(page.getByText('$75.50').first()).toBeVisible()
  })

  test('the host sees who booked, with first name, badge and car, and never a phone or email', async ({
    page,
  }) => {
    test.setTimeout(120_000)
    // 1. A host publishes and the garage goes live
    await signInAsSeeded(page, HOST_ID, HOST_PHONE)
    await seedDraft(page)
    await page.goto('/host/new/price')
    await page.getByRole('button', { name: 'Publicar cochera' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu cochera está en revisión')
    await page.evaluate(() => window.__mockDb!.approveAllSpacesNow())
    await signOut(page)

    // 2. Another driver books it
    await signInAsSeeded(page, OTHER_ID, OTHER_PHONE)
    await pickAkronFirstEvent(page)
    await page.getByRole('button', { name: TITLE, exact: true }).click()
    await page.getByRole('button', { name: 'Elegir horario' }).click()
    await page.getByRole('button', { name: 'Continuar al pago' }).click()
    await page.getByRole('button', { name: /Pagar y reservar/ }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lugar reservado')
    await signOut(page)

    // 3. The host sees the booking
    await signInAsSeeded(page, HOST_ID, HOST_PHONE)
    await page.goto('/host/bookings')
    await expect(page.getByRole('heading', { name: TITLE })).toBeVisible()
    await expect(page.getByText('Prueba', { exact: true })).toBeVisible()
    await expect(page.getByText('Identidad verificada')).toBeVisible()
    await expect(page.getByText('Nissan Versa · Gris · JAL-482-A')).toBeVisible()
    await expect(page.getByText('Confirmada', { exact: true })).toBeVisible()
    await expect(page.locator('body')).not.toContainText(OTHER_PHONE)
    await expect(page.locator('body')).not.toContainText('prueba@example.com')
    await expectAccessible(page)
  })

  test('a host cannot book their own garage', async ({ page }) => {
    test.setTimeout(90_000)
    await signInAsSeeded(page, HOST_ID, HOST_PHONE)
    await seedDraft(page)
    await page.goto('/host/new/price')
    await page.getByRole('button', { name: 'Publicar cochera' }).click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu cochera está en revisión')
    await page.evaluate(() => window.__mockDb!.approveAllSpacesNow())

    await pickAkronFirstEvent(page)
    await page.getByRole('button', { name: TITLE, exact: true }).click()
    await page.getByRole('button', { name: 'Elegir horario' }).click()
    await page.getByRole('button', { name: 'Continuar al pago' }).click()
    await page.getByRole('button', { name: /Pagar y reservar/ }).click()
    await expect(page.getByRole('alert')).toContainText('No puedes reservar tu propia cochera')
    await expectAccessible(page)
  })

  test('works in English', async ({ page }) => {
    await page.goto('/profile')
    await page.getByRole('radio', { name: 'English' }).check({ force: true })
    await page.goto('/host')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Host')
    await expect(page.getByText('Rent out your garage on event days')).toBeVisible()
    await expectAccessible(page)
  })
})
