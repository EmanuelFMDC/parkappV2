import { expect, test } from '@playwright/test'
import { signInWithPhone } from './helpers'

// Regenerate with: SCREENSHOTS=1 npx playwright test driver-screenshots
const OUT = '../docs/driver/screenshots'

test.skip(!process.env.SCREENSHOTS, 'only when SCREENSHOTS=1')

test('driver flow screenshots', async ({ page }, testInfo) => {
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

  await page.getByRole('button', { name: 'Elegir horario' }).click()
  await page.getByLabel('Placa del auto').fill('JAL482A')
  await expect(page.getByText('Duración:')).toBeVisible()
  await shot('4-time')

  await page.getByRole('button', { name: 'Continuar al pago' }).click()
  await shot('5-pay-signin')
  await signInWithPhone(page)
  await expect(page.getByText('Tarjeta de ejemplo terminada en 4242')).toBeVisible()
  await shot('5b-pay')

  await page.getByRole('button', { name: /Pagar y reservar/ }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Lugar reservado')
  await shot('6-ticket')

  await page.goto('/bookings')
  await expect(page.getByText('Confirmada', { exact: true })).toBeVisible()
  await shot('7-bookings')

  await page.goto('/profile')
  await shot('8-profile')
})
