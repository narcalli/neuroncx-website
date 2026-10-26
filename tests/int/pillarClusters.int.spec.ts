import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildTrail } from '@/components/Breadcrumbs'
import { breadcrumbList } from '@/utilities/jsonLd'
import { pagePathOf, pageSitemapEntries, pickByPath } from '@/utilities/pages'

/** Pillar and cluster pages: addresses, the two routes, breadcrumbs, metadata and the sitemap. */

vi.mock('next/headers', () => ({ draftMode: async () => ({ isEnabled: false }) }))
// The page body pulls in every block; the routes are checked by what they hand it.
vi.mock('@/components/PageView', () => ({ PageView: () => null }))
vi.mock('@/components/PayloadRedirects', () => ({ PayloadRedirects: () => null }))
const moved: string[] = []
vi.mock('next/navigation', () => ({
  permanentRedirect: (to: string) => {
    moved.push(to)
    throw new Error(`NEXT_REDIRECT ${to}`)
  },
  redirect: (to: string) => {
    throw new Error(`NEXT_REDIRECT ${to}`)
  },
  notFound: () => {
    throw new Error('NEXT_NOT_FOUND')
  },
}))

const pillar = { id: 'p1', title: 'Higher education', slug: 'higher-education', parent: null }
const cluster = {
  id: 'c1',
  title: 'Student lead qualification',
  slug: 'student-lead-qualification',
  parent: pillar,
  breadcrumbs: [
    { label: 'Higher education', url: '/higher-education' },
    { label: 'Student lead qualification', url: '/higher-education/student-lead-qualification' },
  ],
  hero: { type: 'none' },
  layout: [],
}

describe('addresses', () => {
  it('keeps a page without a parent at /slug and home at /', () => {
    expect(pagePathOf({ slug: 'crm', parent: null })).toBe('/crm')
    expect(pagePathOf({ slug: 'home' })).toBe('/')
    expect(pagePathOf({ slug: null } as any)).toBeNull()
  })

  it('puts a cluster page under its pillar, from its stored path or else its pillar', () => {
    expect(pagePathOf(cluster as any)).toBe('/higher-education/student-lead-qualification')
    expect(pagePathOf({ slug: 'fees', parent: pillar as any, breadcrumbs: [] })).toBe('/higher-education/fees')
  })

  it('picks the cluster whose own address is the path, not a page that only mentions it', () => {
    const other = { ...cluster, id: 'c2', slug: 'other', breadcrumbs: [cluster.breadcrumbs[1], { url: '/x/other' }] }
    expect((pickByPath([other, cluster] as any, '/higher-education/student-lead-qualification') as any)?.id).toBe('c1')
    expect(pickByPath([{ ...pillar, breadcrumbs: [{ url: '/higher-education' }] }] as any, '/higher-education')).toBeNull()
  })
})

describe('breadcrumbs', () => {
  it('gives a cluster page Home / pillar / page, with the pillar linked', () => {
    expect(buildTrail({ page: cluster as any })).toEqual([
      { label: 'Home', href: '/' },
      { label: 'Higher education', href: '/higher-education' },
      { label: 'Student lead qualification' },
    ])
  })

  it('gives a pillar page Home / pillar, and leaves other pages as they were', () => {
    expect(buildTrail({ page: pillar as any })).toEqual([{ label: 'Home', href: '/' }, { label: 'Higher education' }])
    const withLabelParent = { title: 'Fees', slug: 'fees', breadcrumbParent: { kind: 'label' as const, label: 'Education' } }
    expect(buildTrail({ page: withLabelParent })).toEqual([{ label: 'Home', href: '/' }, { label: 'Education' }, { label: 'Fees' }])
  })

  it('describes the cluster trail as a BreadcrumbList with full addresses', () => {
    const list = breadcrumbList(buildTrail({ page: cluster as any }), 'https://www.neuroncx.com')
    expect(list?.itemListElement).toEqual([
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.neuroncx.com/' },
      { '@type': 'ListItem', position: 2, name: 'Higher education', item: 'https://www.neuroncx.com/higher-education' },
      { '@type': 'ListItem', position: 3, name: 'Student lead qualification' },
    ])
  })
})

describe('sitemap', () => {
  it('lists published pages at their full address, leaving out pages a site route answers first', () => {
    const entries = pageSitemapEntries(
      [
        { slug: 'home', updatedAt: '2026-10-01' },
        { slug: 'higher-education' },
        cluster as any,
        { slug: 'bot-swarm' },
        { slug: 'customers' },
        { slug: 'x', parent: { slug: 'customers' }, breadcrumbs: [{ url: '/customers' }, { url: '/customers/x' }] },
        { slug: null },
      ],
      'https://www.neuroncx.com',
    )
    expect(entries.map((e) => e.loc)).toEqual([
      'https://www.neuroncx.com/',
      'https://www.neuroncx.com/higher-education',
      'https://www.neuroncx.com/higher-education/student-lead-qualification',
      'https://www.neuroncx.com/customers',
    ])
    expect(entries[0].lastmod).toBe('2026-10-01')
  })
})

describe('routes', () => {
  // What the CMS answers: the cluster for its path or slug, nothing for the rest.
  let asked: string[] = []
  beforeEach(() => {
    asked = []
    moved.length = 0
    vi.stubEnv('CMS_URL', 'http://cms.test')
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://www.neuroncx.com')
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        const url = decodeURIComponent(String(input))
        asked.push(url)
        const hit =
          url.includes('/api/pages') &&
          (url.includes('where[breadcrumbs.url][equals]=/higher-education/student-lead-qualification') ||
            url.includes('where[slug][equals]=student-lead-qualification'))
        const docs = hit ? [cluster] : []
        return new Response(JSON.stringify({ docs, totalDocs: docs.length, totalPages: 1, page: 1 }), { status: 200 })
      }),
    )
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  const params = <T,>(p: T) => ({ params: Promise.resolve(p) })

  it('serves a cluster page at /pillar/slug', async () => {
    const { default: ClusterPage } = await import('@/app/(frontend)/[slug]/[cluster]/page')
    const el: any = await ClusterPage(params({ slug: 'higher-education', cluster: 'student-lead-qualification' }))
    expect(el.props.page.id).toBe('c1')
    expect(el.props.url).toBe('/higher-education/student-lead-qualification')
    expect(asked.some((u) => u.includes('where[breadcrumbs.url][equals]=/higher-education/student-lead-qualification'))).toBe(true)
  })

  it('falls through to the redirects for an unknown /pillar/slug', async () => {
    const { default: ClusterPage } = await import('@/app/(frontend)/[slug]/[cluster]/page')
    const el: any = await ClusterPage(params({ slug: 'higher-education', cluster: 'nothing-here' }))
    expect(el.props).toEqual({ url: '/higher-education/nothing-here' })
  })

  it('moves a cluster page asked for at its bare slug permanently to its full address', async () => {
    const { default: Page } = await import('@/app/(frontend)/[slug]/page')
    await expect(Page(params({ slug: 'student-lead-qualification' }))).rejects.toThrow('NEXT_REDIRECT')
    expect(moved).toEqual(['/higher-education/student-lead-qualification'])
  })

  it('gives a cluster page its full address as canonical and og:url', async () => {
    const { generateMetadata } = await import('@/app/(frontend)/[slug]/[cluster]/page')
    const meta: any = await generateMetadata(params({ slug: 'higher-education', cluster: 'student-lead-qualification' }))
    expect(meta.alternates?.canonical).toBe('https://www.neuroncx.com/higher-education/student-lead-qualification')
    expect(meta.openGraph?.url).toBe('https://www.neuroncx.com/higher-education/student-lead-qualification')
  })
})
