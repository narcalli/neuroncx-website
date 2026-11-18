import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * A sitemap is never published empty because a CMS request failed: the route
 * throws instead, so the last good copy stays cached and a crawler sees a
 * temporary error (18 Nov 2026: a failed request became an empty urlset,
 * cached and served with a 200).
 */

vi.mock('next/headers', () => ({
  draftMode: async () => ({ isEnabled: false }),
  cookies: async () => ({ get: () => undefined }),
}))

const SITE = 'https://www.example.test'
type Reply = { ok: boolean; status: number; body?: unknown } | 'network'
let reply: (url: string) => Reply

beforeEach(() => {
  vi.stubEnv('NEXT_PUBLIC_SERVER_URL', SITE)
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const r = reply(String(input))
      if (r === 'network') throw new TypeError('fetch failed')
      return { ok: r.ok, status: r.status, json: async () => r.body ?? { docs: [] } }
    }),
  )
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

const pagesSitemap = async () => (await import('@/app/(frontend)/pages-sitemap.xml/route')).GET(new Request(`${SITE}/pages-sitemap.xml`))
const contentSitemap = async () => (await import('@/app/(frontend)/content-sitemap.xml/route')).GET(new Request(`${SITE}/content-sitemap.xml`))
const pages = { docs: [{ slug: 'home' }, { slug: 'contact' }, { slug: 'integrations' }] }

describe('the pages sitemap', () => {
  it('lists the published pages when the CMS answers', async () => {
    reply = () => ({ ok: true, status: 200, body: pages })
    const xml = await (await pagesSitemap()).text()
    expect(xml).toContain(`<loc>${SITE}/</loc>`)
    expect(xml).toContain(`<loc>${SITE}/contact</loc>`)
    // A site route answers /integrations first, so the CMS page is left out.
    expect(xml).not.toContain(`<loc>${SITE}/integrations</loc>`)
  })

  it('throws, rather than publishing an empty sitemap, when the CMS errors or cannot be reached', async () => {
    reply = () => ({ ok: false, status: 503 })
    await expect(pagesSitemap()).rejects.toThrow(/CMS did not answer/)
    reply = () => ({ ok: false, status: 400 })
    await expect(pagesSitemap()).rejects.toThrow(/CMS did not answer/)
    reply = () => 'network'
    await expect(pagesSitemap()).rejects.toThrow(/CMS did not answer/)
  })

  it('throws when the CMS answers with no page to list', async () => {
    reply = () => ({ ok: true, status: 200, body: { docs: [] } })
    await expect(pagesSitemap()).rejects.toThrow(/not publishing an empty sitemap/)
    reply = () => ({ ok: true, status: 200, body: { docs: [{ slug: 'integrations' }] } })
    await expect(pagesSitemap()).rejects.toThrow(/not publishing an empty sitemap/)
  })
})

describe('the content sitemap', () => {
  it('throws when the integrations, customers or posts request fails, rather than dropping them', async () => {
    reply = (url) => (url.includes('/api/posts') ? { ok: false, status: 502 } : { ok: true, status: 200, body: { docs: [] } })
    await expect(contentSitemap()).rejects.toThrow(/CMS did not answer/)
  })
})
