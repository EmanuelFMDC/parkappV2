import AxeBuilder from '@axe-core/playwright'
import { expect, test } from '@playwright/test'

const WCAG_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const CARD_TITLE = 'Cochera con portón eléctrico'
const OTHER_CARD = 'Cajón techado para auto compacto'

test.describe('design system page', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/design-system')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Sistema de diseño de ParkApp')
  })

  test('has no WCAG 2.1 AA violations (Spanish)', async ({ page }) => {
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    const summary = results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.slice(0, 3).map((n) => n.target.join(' ')),
    }))
    expect(summary).toEqual([])
  })

  test('has no WCAG 2.1 AA violations (English)', async ({ page }) => {
    await page.getByLabel('Idioma').selectOption('en')
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('ParkApp design system')
    const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze()
    expect(results.violations.map((v) => v.id)).toEqual([])
  })

  test('every button, link and field has a target of at least 44px', async ({ page }) => {
    const small = await page
      .locator('button:visible, a:visible, input:visible, select:visible, [role="switch"]:visible')
      .evaluateAll((els) =>
        els
          .map((el) => {
            // A checkbox is tapped through its whole label row.
            const box = el.matches('input[type="checkbox"]') ? (el.closest('label') ?? el) : el
            const r = box.getBoundingClientRect()
            // Card titles are stretched with ::after to cover the whole card: the card is the target.
            const stretched = getComputedStyle(el, '::after').position === 'absolute'
            return {
              text: (el.textContent ?? '').trim().slice(0, 30),
              w: r.width,
              h: r.height,
              stretched,
            }
          })
          .filter((e) => !e.stretched && e.w > 1 && e.h > 1 && e.h < 43.5),
      )
    expect(small).toEqual([])
  })

  test('bottom sheet works with the keyboard', async ({ page }) => {
    const frame = page.getByTestId('phone-frame')
    const handle = frame.getByRole('button', { name: /panel de resultados/i })
    const card = frame.getByRole('button', { name: CARD_TITLE, exact: true })
    await expect(handle).toHaveAttribute('aria-expanded', 'true')
    await expect(card).toBeVisible()
    const inertRegions = frame.locator('[inert]')
    await expect(inertRegions).toHaveCount(0)

    await handle.focus()
    await page.keyboard.press('Enter')
    await expect(handle).toHaveAttribute('aria-expanded', 'false')
    // Collapsed: the list is inert and hidden, so it is out of the focus order and the a11y tree.
    await expect(inertRegions).toHaveCount(1)
    await expect(card).toHaveCount(0)

    await handle.focus()
    await page.keyboard.press('ArrowUp')
    await expect(handle).toHaveAttribute('aria-expanded', 'true')
    await expect(inertRegions).toHaveCount(0)
    await expect(card).toBeVisible()
  })

  test('dragging the handle snaps the sheet to another height', async ({ page }) => {
    const frame = page.getByTestId('phone-frame')
    const panel = frame.getByRole('region', { name: 'Cocheras cercanas' })
    const handle = frame.getByRole('button', { name: /panel de resultados/i })
    // Put the phone at the top of the window so there is room to drag down.
    await frame.evaluate((el) => el.scrollIntoView({ block: 'start' }))

    const heightOf = async () => (await panel.boundingBox())!.height
    const half = await heightOf()

    const box = (await handle.boundingBox())!
    const x = box.x + box.width / 2
    const y = box.y + box.height / 2

    // Drag up: half -> full (taller).
    await page.mouse.move(x, y)
    await page.mouse.down()
    await page.mouse.move(x, y - 220, { steps: 8 })
    await page.mouse.up()
    await expect.poll(heightOf).toBeGreaterThan(half + 40)
    await expect(handle).toHaveAttribute('aria-expanded', 'true')

    // Drag down a long way: full -> peek (collapsed).
    const box2 = (await handle.boundingBox())!
    const x2 = box2.x + box2.width / 2
    const y2 = box2.y + box2.height / 2
    await page.mouse.move(x2, y2)
    await page.mouse.down()
    // Stay inside the window: pointer events stop outside it.
    const room = page.viewportSize()!.height - y2 - 4
    await page.mouse.move(x2, y2 + Math.min(450, room), { steps: 10 })
    await page.mouse.up()
    await expect(handle).toHaveAttribute('aria-expanded', 'false')
    await expect.poll(heightOf).toBeLessThan(half - 100)
  })

  test('selecting a card highlights its pin on the map', async ({ page }) => {
    const frame = page.getByTestId('phone-frame')
    await frame.getByRole('button', { name: OTHER_CARD, exact: true }).click()
    await expect(frame.getByRole('button', { name: /Cajón techado.*por hora/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })

  test('the panel is a sheet on a narrow container and a side list on a wide one', async ({
    page,
  }, testInfo) => {
    const phone = page.getByTestId('phone-frame')
    const desktop = page.getByTestId('desktop-frame')
    await desktop.scrollIntoViewIfNeeded()

    const narrow = await phone.getByRole('region', { name: 'Cocheras cercanas' }).boundingBox()
    const narrowFrame = await phone.boundingBox()
    expect(narrow!.width).toBeGreaterThan(narrowFrame!.width * 0.9)

    const panel = await desktop.getByRole('region', { name: 'Cocheras cercanas' }).boundingBox()
    const frame = await desktop.boundingBox()
    if (testInfo.project.name === 'desktop') {
      // Docked: a column at the left edge, not a strip across the bottom.
      expect(panel!.width).toBeLessThan(frame!.width / 2)
      expect(panel!.x).toBeLessThanOrEqual(frame!.x + 2)
    } else {
      // A phone-width viewport makes the "desktop" frame narrow too, so it correctly stays a sheet.
      expect(panel!.width).toBeGreaterThan(frame!.width * 0.9)
    }
  })

  test('hovering a card highlights its pin (desktop)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'hover needs a pointer')
    const desktop = page.getByTestId('desktop-frame')
    await desktop.scrollIntoViewIfNeeded()
    await desktop.getByRole('button', { name: OTHER_CARD, exact: true }).hover()
    await expect(desktop.getByRole('button', { name: /Cajón techado.*por hora/ })).toHaveAttribute(
      'aria-pressed',
      'true',
    )
  })
})
