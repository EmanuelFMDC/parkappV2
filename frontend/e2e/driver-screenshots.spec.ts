import { expect, test } from '@playwright/test'
import { fillProfile, fillVehicle, signInWithPhone } from './helpers'

// Regenerate with: SCREENSHOTS=1 npx playwright test driver-screenshots
const OUT = '../docs/driver/screenshots'

test.skip(!process.env.SCREENSHOTS, 'only when SCREENSHOTS=1')

test('driver flow screenshots', async ({ page }, testInfo) => {
  test.setTimeout(120_000)
  const p = testInfo.project.name
  const shot = async (name: string) => {
    await page.evaluate(() => document.fonts.ready)
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await page.screenshot({ path: `${OUT}/${p}-${name}.png` })
  }

  await page.goto('/')
  await page.getByText('Estadio Akron', { exact: true }).click()
  await page.getByText('Concierto de ejemplo').click()
  await shot('1-venue')

  await page.getByRole('button', { name: 'Ver cocheras' }).click()
  await expect(
    page.getByRole('button', { name: 'Cajón techado para auto compacto', exact: true }),
  ).toBeVisible()
  await shot('2-spaces')

  await page.getByRole('button', { name: 'Cajón techado para auto compacto', exact: true }).click()
  await expect(page.getByRole('heading', { name: 'Reseñas' })).toBeVisible()
  await shot('3-detail')
  await page.getByRole('heading', { name: 'Reseñas' }).scrollIntoViewIfNeeded()
  await shot('3b-detail-reviews')

  // Continuing without an account: create one first
  await page.getByRole('button', { name: 'Crear cuenta para continuar' }).click()
  await expect(page.getByRole('heading', { name: 'Verifica tu teléfono' })).toBeVisible()
  await shot('4a-account-phone')

  await signInWithPhone(page)
  await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible()
  await shot('4b-account-profile')
  await fillProfile(page)

  await expect(page.getByRole('heading', { name: 'Tu auto' })).toBeVisible()
  await shot('4c-account-vehicle')
  await fillVehicle(page)

  await expect(page.getByRole('heading', { name: 'Verifica tu identidad' })).toBeVisible()
  await shot('4d-account-identity')
  await page.getByRole('button', { name: 'Verificar mi identidad' }).click()
  await expect(page.getByText(/Estamos revisando tu identidad/)).toBeVisible()
  await shot('4e-account-identity-pending')

  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Tu horario', {
    timeout: 15_000,
  })
  await expect(page.getByText('Duración:')).toBeVisible()
  await shot('5-time')

  await page.getByRole('button', { name: 'Continuar al pago' }).click()
  await expect(page.getByText('Tarjeta de ejemplo terminada en 4242')).toBeVisible()
  await shot('6-pay')

  await page.getByRole('button', { name: /Pagar y reservar/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lugar reservado')
  await shot('7-ticket')

  await page.goto('/bookings')
  await expect(page.getByText('Confirmada', { exact: true })).toBeVisible()
  await shot('8-bookings')

  await page.goto('/profile')
  await expect(page.getByText('Ana López García')).toBeVisible()
  await shot('9-profile')
})
