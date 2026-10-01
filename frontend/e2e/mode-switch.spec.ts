import { expect, test, type Page } from '@playwright/test'
import { HOST_ID, HOST_PHONE, expectAccessible, signInAsSeeded } from './helpers'

const nav = (page: Page) => page.getByRole('navigation', { name: 'Navegación principal' })
const tab = (page: Page, name: string) => nav(page).getByRole('button', { name })

test.describe('one account, two modes', () => {
  test('a person switches from driver to host mode from the profile, and back from the banner', async ({
    page,
  }) => {
    await signInAsSeeded(page, HOST_ID, HOST_PHONE)

    // Driver mode: search, my bookings and profile
    await expect(tab(page, 'Explorar')).toBeVisible()
    await expect(tab(page, 'Mis reservas')).toBeVisible()
    await expect(tab(page, 'Mis cocheras')).toHaveCount(0)
    await expect(page.getByText('Modo anfitrión')).toHaveCount(0)

    await tab(page, 'Perfil').click()
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Perfil')
    await expect(page.getByRole('heading', { name: 'Mis autos' })).toBeVisible()
    await expectAccessible(page)
    await page.getByRole('button', { name: 'Cambiar a modo anfitrión' }).click()

    // Host mode: its own bar and a banner that says so
    await expect(page).toHaveURL(/\/host$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Mis cocheras')
    await expect(page.getByText('Modo anfitrión', { exact: true })).toBeVisible()
    await expect(tab(page, 'Mis cocheras')).toBeVisible()
    await expect(tab(page, 'Reservas')).toBeVisible()
    await expect(tab(page, 'Explorar')).toHaveCount(0)
    await expect(tab(page, 'Mis reservas')).toHaveCount(0)
    await expectAccessible(page)

    await tab(page, 'Reservas').click()
    await expect(page).toHaveURL(/\/host\/bookings$/)
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Reservas recibidas')
    await expectAccessible(page)

    // The profile is the same page, still in host mode, without the driver's cars
    await tab(page, 'Perfil').click()
    await expect(page).toHaveURL(/\/host\/profile$/)
    await expect(page.getByText('Modo anfitrión', { exact: true })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Mis autos' })).toHaveCount(0)
    await expect(page.getByText('Prueba Conductor')).toBeVisible()
    await expectAccessible(page)

    // One tap back to the driver side
    await page.getByRole('button', { name: 'Cambiar a modo conductor' }).click()
    await expect(page).toHaveURL(/localhost:\d+\/$/)
    await expect(tab(page, 'Explorar')).toBeVisible()
    await expect(page.getByText('Modo anfitrión', { exact: true })).toHaveCount(0)
  })

  test('the back button follows the mode, because the address is the mode', async ({ page }) => {
    await signInAsSeeded(page, HOST_ID, HOST_PHONE)
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Cambiar a modo anfitrión' }).click()
    await expect(tab(page, 'Mis cocheras')).toBeVisible()

    await page.goBack()
    await expect(tab(page, 'Explorar')).toBeVisible()
    await expect(tab(page, 'Mis cocheras')).toHaveCount(0)

    await page.goForward()
    await expect(tab(page, 'Mis cocheras')).toBeVisible()
  })

  test('drivers get a quiet invitation to host, and it leads to host mode', async ({ page }) => {
    await page.goto('/')
    const pitch = page.getByRole('link', { name: /¿Tienes una cochera\?/ })
    await expect(pitch).toBeVisible()
    await expectAccessible(page)
    await pitch.click()
    await expect(page).toHaveURL(/\/host$/)
    await expect(page.getByText('Renta tu cochera los días de evento')).toBeVisible()
    await expect(page.getByText('Modo anfitrión', { exact: true })).toBeVisible()
  })

  test('someone who is not signed in can look at host mode before creating an account', async ({
    page,
  }) => {
    await page.goto('/profile')
    await page.getByRole('button', { name: 'Cambiar a modo anfitrión' }).click()
    await expect(page.getByRole('button', { name: 'Empezar a publicar' })).toBeVisible()
    await tab(page, 'Reservas').click()
    await expect(page.getByRole('button', { name: 'Empezar a publicar' })).toBeVisible()
    await expectAccessible(page)
  })

  test('old links to the bookings tab still work', async ({ page }) => {
    await page.goto('/host?tab=bookings')
    await expect(page).toHaveURL(/\/host\/bookings$/)
    await expect(tab(page, 'Reservas')).toHaveAttribute('aria-current', 'page')
  })

  test('the banner and the switch are translated', async ({ page }) => {
    await page.goto('/profile')
    await page.getByRole('radio', { name: 'English' }).check({ force: true })
    await page.getByRole('button', { name: 'Switch to host mode' }).click()
    await expect(page.getByText('Host mode', { exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Switch to driver mode' })).toBeVisible()
    await expect(page.getByRole('navigation', { name: 'Main navigation' })).toBeVisible()
    await expectAccessible(page)
  })

  test.describe('opening the app again', () => {
    test('a ready host comes back to host mode, once, and tapping Explorar later stays in driver mode', async ({
      page,
    }) => {
      await signInAsSeeded(page, HOST_ID, HOST_PHONE)
      await page.goto('/profile')
      await page.getByRole('button', { name: 'Cambiar a modo anfitrión' }).click()
      await expect(tab(page, 'Mis cocheras')).toBeVisible()

      // A new tab is the closest thing to opening the app again: same device, fresh session.
      const reopened = await page.context().newPage()
      await reopened.goto('/')
      await expect(reopened).toHaveURL(/\/host$/)
      await expect(reopened.getByText('Modo anfitrión', { exact: true })).toBeVisible()
      await expectAccessible(reopened)

      // Going to the driver side sticks: it is a choice, not something to undo
      await reopened.getByRole('button', { name: 'Cambiar a modo conductor' }).click()
      await expect(reopened).toHaveURL(/localhost:\d+\/$/)
      await reopened.waitForTimeout(500)
      await expect(reopened).toHaveURL(/localhost:\d+\/$/)

      // Reloading the tab does not jump either
      await reopened.reload()
      await expect(tab(reopened, 'Explorar')).toBeVisible()

      // And the next time the app opens, it is in the mode they left it in: driver
      const third = await page.context().newPage()
      await third.goto('/')
      await expect(tab(third, 'Explorar')).toBeVisible()
      await expect(third).toHaveURL(/localhost:\d+\/$/)
    })

    test('a link is never overridden by the remembered mode', async ({ page }) => {
      await signInAsSeeded(page, HOST_ID, HOST_PHONE)
      await page.goto('/profile')
      await page.getByRole('button', { name: 'Cambiar a modo anfitrión' }).click()
      await expect(tab(page, 'Mis cocheras')).toBeVisible()

      const reopened = await page.context().newPage()
      await reopened.goto('/bookings')
      await expect(reopened).toHaveURL(/\/bookings$/)
      await expect(tab(reopened, 'Mis reservas')).toBeVisible()
    })

    test('someone who is not a host yet is not sent to the invitation on every launch', async ({
      page,
    }) => {
      await page.goto('/profile')
      await page.getByRole('button', { name: 'Cambiar a modo anfitrión' }).click()
      await expect(page.getByRole('button', { name: 'Empezar a publicar' })).toBeVisible()

      const reopened = await page.context().newPage()
      await reopened.goto('/')
      await expect(reopened.getByRole('heading', { level: 1 })).toHaveText('¿A qué evento vas?')
      await expect(reopened).toHaveURL(/localhost:\d+\/$/)
    })

    test('signing out forgets the mode for the next person on the phone', async ({ page }) => {
      await signInAsSeeded(page, HOST_ID, HOST_PHONE)
      await page.goto('/profile')
      await page.getByRole('button', { name: 'Cambiar a modo anfitrión' }).click()
      await expect(tab(page, 'Mis cocheras')).toBeVisible()
      await page.goto('/host/profile')
      await page.getByRole('button', { name: 'Cerrar sesión' }).click()
      await expect(
        page.getByRole('button', { name: 'Crear cuenta o iniciar sesión' }),
      ).toBeVisible()

      const reopened = await page.context().newPage()
      await reopened.goto('/')
      await expect(reopened).toHaveURL(/localhost:\d+\/$/)
      await expect(tab(reopened, 'Explorar')).toBeVisible()
    })
  })
})
