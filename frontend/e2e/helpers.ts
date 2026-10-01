import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
export const PHONE = '3312345678'
export const DRIVER_ID = `mock-user-${PHONE}`

/** Fails with a readable summary if the current page has WCAG 2.1 A/AA violations. */
export async function expectAccessible(page: Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
  const summary = results.violations.map((v) => ({
    id: v.id,
    impact: v.impact,
    nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
  }))
  expect(summary, `a11y violations on ${page.url()}`).toEqual([])
}

/** The in-browser API boots asynchronously after the page loads; tests that poke it must wait. */
export async function waitForMockDb(page: Page) {
  await page.waitForFunction(() => Boolean(window.__mockDb))
}

/** Stage 1 of the account: verify the phone with the test code. */
export async function signInWithPhone(page: Page, phone = PHONE) {
  await page.getByLabel('Teléfono', { exact: true }).fill(phone)
  await page.getByRole('button', { name: 'Enviar código' }).click()
  await page.getByLabel('Código de 6 dígitos').fill('000000')
  await page.getByRole('button', { name: 'Verificar' }).click()
}

export async function fillProfile(page: Page) {
  await page.getByLabel('Nombre(s)').fill('Ana')
  await page.getByLabel('Apellidos').fill('López García')
  await page.getByLabel('Fecha de nacimiento').fill('1995-03-02')
  await page.getByLabel('Correo electrónico').fill('ana@example.com')
  await page.getByLabel(/Acepto el aviso de privacidad/).check()
  await page.getByRole('button', { name: 'Guardar y continuar' }).click()
}

export async function fillVehicle(page: Page) {
  await page.getByLabel('Placa').fill('jal482a')
  await page.getByLabel('Marca').fill('Nissan')
  await page.getByLabel('Modelo').fill('Versa')
  await page.getByLabel('Color').fill('Gris')
  await page.getByRole('button', { name: 'Guardar auto y continuar' }).click()
}

/** Runs the whole registration: phone, details, car and identity (the simulated provider approves in a few seconds). */
export async function createAccount(page: Page) {
  await signInWithPhone(page)
  await expect(page.getByRole('heading', { name: 'Tus datos' })).toBeVisible()
  await fillProfile(page)
  await expect(page.getByRole('heading', { name: 'Tu auto' })).toBeVisible()
  await fillVehicle(page)
  await expect(page.getByRole('heading', { name: 'Verifica tu identidad' })).toBeVisible()
  await page.getByRole('button', { name: 'Verificar mi identidad' }).click()
}

/**
 * Gives the test driver an account that is already complete and verified, then signs in with the
 * phone. Faster than going through registration in tests that are about something else.
 */
export async function signInAsVerifiedDriver(
  page: Page,
  vehicle?: { type?: string; plate?: string },
) {
  await page.goto('/')
  await waitForMockDb(page)
  await page.evaluate(({ id, v }) => window.__mockDb!.seedVerifiedAccount(id, v as never), {
    id: DRIVER_ID,
    v: vehicle,
  })
  await page.goto('/account/new?next=%2F')
  await signInWithPhone(page)
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('¿A qué evento vas?')
}

/** Steps 1 and 2: pick Estadio Akron, its first event, and land on the garage list. */
export async function pickAkronFirstEvent(page: Page) {
  await page.goto('/')
  await expect(page.getByRole('heading', { level: 1 })).toHaveText('¿A qué evento vas?')
  await page.getByText('Estadio Akron', { exact: true }).click()
  await page.getByText('Concierto de ejemplo').click()
  await page.getByRole('button', { name: 'Ver cocheras' }).click()
  await expect(page).toHaveURL(/\/venues\/akron\/spaces\?/)
}
