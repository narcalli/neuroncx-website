import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { blogPosting, softwareApplication } from '@/utilities/jsonLd'
import { pageSitemapEntries } from '@/utilities/pages'
import { hiddenFromSearch, robotsFor } from '@/utilities/searchVisibility'
import { DEFAULT_DESCRIPTION } from '@/utilities/siteDefaults'
import { customerEntries, integrationEntries, postEntries } from '@/utilities/sitemapEntries'

/**
 * Hide from search engines (meta.noIndex), the sitemap's integration,
 * customer and post pages, the default description, and the software and
 * blog post structured data.
 */

vi.mock('next/headers', () => ({
  draftMode: async () => ({ isEnabled: false }),
  cookies: async () => ({ get: () => undefined }),
}))

const SITE = 'https://www.example.test'
const hidden = { meta: { noIndex: true } }

let replies: Record<string, unknown> = {}
beforeEach(() => {
  replies = {}
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string | URL) => {
      const url = String(input)
      const key = Object.keys(replies).find((k) => url.includes(k))
      return { ok: true, status: 200, json: async () => (key ? replies[key] : { docs: [] }) }
    }),
  )
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('hide from search engines', () => {
  it('marks a hidden page noindex, follow, and leaves others alone', () => {
    expect(hiddenFromSearch(hidden)).toBe(true)
    expect(hiddenFromSearch({ meta: { noIndex: false } })).toBe(false)
    expect(hiddenFromSearch(null)).toBe(false)
    expect(robotsFor(hidden)).toEqual({ robots: { index: false, follow: true } })
    expect(robotsFor({ meta: {} })).toEqual({})
  })

  it("reaches a CMS page's metadata", async () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', SITE)
    vi.stubEnv('CMS_URL', 'https://cms.test')
    const { generateMeta } = await import('@/utilities/generateMeta')
    const meta = await generateMeta({ doc: { slug: 'test-page', title: 'Test', meta: { noIndex: true } }, path: '/test-page' })
    expect(meta.robots).toEqual({ index: false, follow: true })
    expect((await generateMeta({ doc: { slug: 'fees', title: 'Fees' }, path: '/fees' })).robots).toBeUndefined()
  })

  it('keeps a hidden page out of the pages sitemap', () => {
    const pages = [
      { slug: 'home', updatedAt: '2026-11-01' },
      { slug: 'test-page', ...hidden },
      { slug: 'fees', meta: { noIndex: false } },
    ] as any[]
    expect(pageSitemapEntries(pages, SITE).map((e) => e.loc)).toEqual([`${SITE}/`, `${SITE}/fees`])
  })
})

describe('sitemap pages outside the content collections', () => {
  it('lists integrations with a page of their own, by the page rule', () => {
    const docs = [
      { slug: 'docpulse', status: 'live', hasOwnPage: true, updatedAt: '2026-11-02' },
      { slug: 'planned-one', status: 'planned', hasOwnPage: true },
      { slug: 'no-page', status: 'live', hasOwnPage: false },
      { slug: 'hidden-one', status: 'live', hasOwnPage: true, ...hidden },
    ] as any[]
    expect(integrationEntries(docs, SITE)).toEqual([{ loc: `${SITE}/integrations/docpulse`, lastmod: '2026-11-02' }])
  })

  it('lists customers with a page of their own, and posts by slug', () => {
    const customers = [
      { name: 'Ovum Hospitals', slug: 'ovum', hasOwnPage: true },
      { name: 'Quiet one', slug: 'quiet', hasOwnPage: false },
      { name: '', slug: 'nameless', hasOwnPage: true },
    ] as any[]
    expect(customerEntries(customers, SITE).map((e) => e.loc)).toEqual([`${SITE}/customers/ovum`])
    const posts = [{ slug: 'four-flows', updatedAt: '2026-10-01' }, { slug: 'draft-ish', ...hidden }, { slug: '' }] as any[]
    expect(postEntries(posts, SITE)).toEqual([{ loc: `${SITE}/posts/four-flows`, lastmod: '2026-10-01' }])
  })

  it('come out in content-sitemap.xml, without hidden entries', async () => {
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', SITE)
    vi.stubEnv('CMS_URL', 'https://cms.test')
    replies['/api/integrations?'] = {
      docs: [
        { slug: 'docpulse', status: 'live', hasOwnPage: true },
        { slug: 'hidden-one', status: 'live', hasOwnPage: true, ...hidden },
      ],
    }
    replies['/api/customers?'] = { docs: [{ name: 'Ovum', slug: 'ovum', hasOwnPage: true }] }
    replies['/api/posts?'] = { docs: [{ slug: 'four-flows' }] }
    const { GET } = await import('@/app/(frontend)/content-sitemap.xml/route')
    const xml = await (await GET(new Request(`${SITE}/content-sitemap.xml`))).text()
    expect(xml).toContain(`<loc>${SITE}/integrations/docpulse</loc>`)
    expect(xml).toContain(`<loc>${SITE}/customers/ovum</loc>`)
    expect(xml).toContain(`<loc>${SITE}/posts/four-flows</loc>`)
    expect(xml).not.toContain('hidden-one')
  })
})

describe('the default description', () => {
  it('fits the 155-character limit of the CMS field', () => {
    expect(DEFAULT_DESCRIPTION.length).toBeLessThanOrEqual(155)
  })
})

describe('structured data for each page type', () => {
  it('describes an integration or agent as software made by NeuronCx', () => {
    expect(
      softwareApplication({
        siteUrl: SITE,
        path: '/integrations/docpulse',
        name: 'DocPulse integration',
        description: ' Book, cancel and reschedule. ',
        image: '/media/docpulse.png',
      }),
    ).toEqual({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'DocPulse integration',
      url: `${SITE}/integrations/docpulse`,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      description: 'Book, cancel and reschedule.',
      image: `${SITE}/media/docpulse.png`,
      publisher: { '@id': `${SITE}/#organization` },
    })
    expect(softwareApplication({ siteUrl: '', path: '/x', name: 'X' })).toBeNull()
    expect(softwareApplication({ siteUrl: SITE, path: '/x', name: ' ' })).toBeNull()
  })

  it('describes a post as a blog post, with authors or else NeuronCx', () => {
    const post = blogPosting({
      siteUrl: SITE,
      path: '/posts/four-flows',
      headline: 'Four WhatsApp flows',
      datePublished: '2026-10-01T00:00:00.000Z',
      dateModified: '2026-10-05T00:00:00.000Z',
      authors: ['Asha Rao', null, ' '],
    })!
    expect(post).toMatchObject({
      '@type': 'BlogPosting',
      headline: 'Four WhatsApp flows',
      url: `${SITE}/posts/four-flows`,
      mainEntityOfPage: `${SITE}/posts/four-flows`,
      datePublished: '2026-10-01T00:00:00.000Z',
      dateModified: '2026-10-05T00:00:00.000Z',
      author: [{ '@type': 'Person', name: 'Asha Rao' }],
      publisher: { '@id': `${SITE}/#organization` },
    })
    expect(blogPosting({ siteUrl: SITE, path: '/posts/x', headline: 'X' })?.author).toEqual({
      '@id': `${SITE}/#organization`,
    })
    expect(blogPosting({ siteUrl: SITE, path: '/posts/x', headline: '' })).toBeNull()
  })
})
