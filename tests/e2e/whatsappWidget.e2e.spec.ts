import { expect, test } from '@playwright/test'

/**
 * The site-wide WhatsApp button, in a real browser. Needs the site running
 * with the button switched on in Site Settings. A page may have no closing
 * section, so that test adds one before the page starts.
 */

const BASE = process.env.E2E_BASE_URL || 'http://localhost:3000'
const button = '.ncx-wa'

const scrollTo = (page: import('@playwright/test').Page, y: number | 'end') =>
  page.evaluate((top) => {
    window.scrollTo({ top: top === 'end' ? document.documentElement.scrollHeight : top, behavior: 'instant' })
  }, y)

const PAGES: [string, number][] = [
  ['/', 390],
  ['/', 1440],
  ['/crm', 390],
  ['/crm', 1440],
  ['/bot-swarm', 390],
  ['/bot-swarm', 1440],
]

for (const [path, width] of PAGES) {
  test.describe(`${path} at ${width}px`, () => {
    test.use({ viewport: { width, height: 844 } })

    test('hidden at scroll 0, hidden just short of 420px, shown past it', async ({ page }) => {
      await page.goto(BASE + path, { waitUntil: 'networkidle' })
      await expect(page.locator(button)).toHaveCount(1)
      await expect(page.locator(button)).toBeHidden()
      await scrollTo(page, 400)
      await page.waitForTimeout(200)
      await expect(page.locator(button)).toBeHidden()
      await scrollTo(page, 430)
      await expect(page.locator(button)).toBeVisible()
    })

    test('the label shows, starting with Chat', async ({ page }) => {
      await page.goto(BASE + path, { waitUntil: 'networkidle' })
      await scrollTo(page, 430)
      await expect(page.locator('.ncx-wa__label')).toBeVisible()
      await expect(page.locator('.ncx-wa__label')).toHaveText(/^Chat/)
    })

    test('hidden while a closing section is on screen', async ({ page }) => {
      await page.addInitScript(() => {
        document.addEventListener('DOMContentLoaded', () => {
          const closing = document.createElement('section')
          closing.className = 'ncx-closing'
          closing.style.height = '1200px'
          document.body.appendChild(closing)
        })
      })
      await page.goto(BASE + path, { waitUntil: 'networkidle' })
      await scrollTo(page, 430)
      await expect(page.locator(button)).toBeVisible()
      await scrollTo(page, 'end')
      await expect(page.locator(button)).toBeHidden()
      await scrollTo(page, 430)
      await expect(page.locator(button)).toBeVisible()
    })
  })
}

test.describe('without JavaScript', () => {
  test.use({ javaScriptEnabled: false, viewport: { width: 390, height: 844 } })

  test('visible at the top of the page', async ({ page }) => {
    await page.goto(`${BASE}/`)
    await expect(page.locator(button)).toBeVisible()
    await expect(page.locator('.ncx-wa__label')).toBeVisible()
  })
})

test.describe('moving between pages', () => {
  test.use({ viewport: { width: 1440, height: 844 } })

  test('one button throughout, and not stuck hidden after a closing section', async ({ page }) => {
    await page.goto(`${BASE}/crm`, { waitUntil: 'networkidle' })
    await page.evaluate(() => {
      document.querySelector('.ncx-closing')?.scrollIntoView({ behavior: 'instant' })
    })
    await expect(page.locator(button)).toBeHidden()
    await page.evaluate(() => {
      const link = [...document.querySelectorAll<HTMLAnchorElement>('footer a[href^="/"]')].find(
        (a) => a.getAttribute('href') !== '/crm' && a.getAttribute('href') !== '/',
      )
      link?.click()
    })
    await page.waitForFunction(() => location.pathname !== '/crm')
    await page.waitForLoadState('networkidle')
    await expect(page.locator(button)).toHaveCount(1)
    await page.evaluate(() => {
      const travel = document.documentElement.scrollHeight - innerHeight
      window.scrollTo({ top: Math.min(430, travel), behavior: 'instant' })
    })
    await expect(page.locator(button)).toBeVisible()
  })
})
