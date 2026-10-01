import { expect, test } from '@playwright/test'

// Regenerate with: SCREENSHOTS=1 npx playwright test screenshots
// Output goes to docs/design-system/screenshots/<project>-<name>.png
const OUT = '../docs/design-system/screenshots'
const sections = [
  'colors',
  'contrast',
  'type',
  'controls',
  'forms',
  'cards',
  'states',
  'navigation',
  'patterns',
  'host',
]

test.skip(!process.env.SCREENSHOTS, 'only when SCREENSHOTS=1')

test.describe('design system screenshots', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design-system')
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible()
    await page.evaluate(() => document.fonts.ready)
    // Pause the decorative animations so captures are stable.
    await page.addStyleTag({ content: '*{animation:none!important;transition:none!important}' })
  })

  test('sections', async ({ page }, testInfo) => {
    const p = testInfo.project.name
    for (const id of sections) {
      const section = page.locator(`section[aria-labelledby="${id}-title"]`)
      await section.scrollIntoViewIfNeeded()
      await section.screenshot({ path: `${OUT}/${p}-${id}.png` })
    }
  })

  test('bottom sheet heights', async ({ page }, testInfo) => {
    const p = testInfo.project.name
    const phone = page.getByTestId('phone-frame')
    await phone.scrollIntoViewIfNeeded()
    const handle = phone.getByRole('button', { name: /panel de resultados/i })

    await handle.focus()
    await page.keyboard.press('ArrowDown') // half -> peek
    await expect(handle).toHaveAttribute('aria-expanded', 'false')
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await phone.screenshot({ path: `${OUT}/${p}-sheet-1-peek.png` })
    await handle.focus()

    await page.keyboard.press('ArrowUp') // peek -> half
    await page.keyboard.press('ArrowUp') // half -> full
    await expect(
      phone.getByRole('button', { name: 'Cochera con portón eléctrico', exact: true }),
    ).toBeVisible()
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur())
    await phone.screenshot({ path: `${OUT}/${p}-sheet-3-full.png` })
  })
})
