import { expect, test } from '@playwright/test'

test('home renders in Spanish by default and is installable as a PWA', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Cocheras cerca de tu evento')
  await expect(page.locator('html')).toHaveAttribute('lang', 'es-MX')

  const manifest = await page.request.get('/manifest.webmanifest')
  expect(manifest.ok()).toBe(true)
  const json = await manifest.json()
  expect(json.name).toBe('ParkApp')
  expect(json.display).toBe('standalone')
})

test('language preference persists after reload', async ({ page }) => {
  await page.goto('/')
  await page.getByLabel('Idioma').selectOption('en')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Garages near your event')

  await page.reload()
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('Garages near your event')
})

test.describe('browser in English', () => {
  test.use({ locale: 'en-US' })

  test('defaults to English from the browser language', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Garages near your event')
    await expect(page.locator('html')).toHaveAttribute('lang', 'en')
  })
})
