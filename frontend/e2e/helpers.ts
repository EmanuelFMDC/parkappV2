import AxeBuilder from '@axe-core/playwright'
import { expect, type Page } from '@playwright/test'

export const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']

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

export async function signInWithPhone(page: Page, phone = '3312345678') {
  await page.getByLabel('Teléfono').fill(phone)
  await page.getByRole('button', { name: 'Enviar código' }).click()
  await page.getByLabel('Código de 6 dígitos').fill('000000')
  await page.getByRole('button', { name: 'Verificar' }).click()
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
