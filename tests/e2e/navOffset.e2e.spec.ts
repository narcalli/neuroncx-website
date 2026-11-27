import { expect, test } from '@playwright/test'

/**
 * --ncx-nav-offset, in a real browser. The site bar hides on the way down
 * the page and comes back on the way up, and anything sticky below it reads
 * this to know how much of the window it is covering (globals.css,
 * Header/Component.client.tsx, the comparison table's header row).
 *
 * A unit test cannot see this: nothing here exists until the page is laid
 * out and scrolled. Needs the site running.
 */

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'

const offset = (page: import('@playwright/test').Page) =>
  page.evaluate(() =>
    parseInt(getComputedStyle(document.documentElement).getPropertyValue('--ncx-nav-offset'), 10),
  )

/** How far down the window the bar actually reaches, to check the token against. */
const barBottom = (page: import('@playwright/test').Page) =>
  page.evaluate(() => {
    const nav = document.querySelector('header.ncx-nav')
    return nav ? Math.max(0, Math.round(nav.getBoundingClientRect().bottom)) : -1
  })

const scrollTo = (page: import('@playwright/test').Page, top: number) =>
  page.evaluate((y) => window.scrollTo({ top: y, behavior: 'instant' }), top)

test.describe('the sticky offset follows the site bar', () => {
  test.use({ viewport: { width: 1280, height: 800 } })

  test('is the bar height at rest, drops to 0 once the bar hides, returns when it comes back', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })

    // At the top of the page the bar is shown, so the token is its height.
    expect(await offset(page)).toBe(64)
    expect(await barBottom(page)).toBe(64)

    // Down the page: the bar hides, so nothing should be reserved for it.
    await scrollTo(page, 1600)
    await expect.poll(() => offset(page), { timeout: 4000 }).toBe(0)
    expect(await barBottom(page)).toBe(0)

    // Back up: the bar returns and the space under it is reserved again.
    await scrollTo(page, 1200)
    await expect.poll(() => offset(page), { timeout: 4000 }).toBe(64)
    expect(await barBottom(page)).toBe(64)
  })

  test('never disagrees with where the bar actually is', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' })
    for (const y of [0, 900, 1800, 1500, 2400, 600]) {
      await scrollTo(page, y)
      // Settle the slide before comparing: mid-transition the two are both
      // moving, and the token is meant to match once it lands.
      await page.waitForTimeout(500)
      expect(await offset(page), `at scrollY ${y}`).toBe(await barBottom(page))
    }
  })
})
