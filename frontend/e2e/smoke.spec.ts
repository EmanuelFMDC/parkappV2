import { expect, test } from '@playwright/test'

test('home renders in Spanish by default and is installable as a PWA', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('¿A qué evento vas?')
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-MX')
  await expect(page).toHaveTitle('¿A qué evento vas? · ParkApp')

  const manifest = await page.request.get('/manifest.webmanifest')
  expect(manifest.ok()).toBe(true)
  const json = await manifest.json()
  expect(json.name).toBe('ParkApp')
  expect(json.display).toBe('standalone')
})

test('language preference persists after reload', async ({ page }) => {
  await page.goto('/profile')
  await page.getByRole('radio', { name: 'English' }).check({ force: true })
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Profile')

  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Profile')
  await expect(page.locator('html')).toHaveAttribute('lang', 'en')
})

test('an unknown address shows a helpful page, not a blank screen', async ({ page }) => {
  await page.goto('/this-does-not-exist')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Página no encontrada')
  await page.getByRole('button', { name: 'Ir al inicio' }).click()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('¿A qué evento vas?')
})

test.describe('browser in English', () => {
  test.use({ locale: 'en-US' })

  test('defaults to English from the browser language', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText(
      'Which event are you going to?',
    )
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})
