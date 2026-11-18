import { CONTENT_COLLECTIONS, type ContentCollectionSlug } from '@/content/registry'
import type { Customer, Integration, Page, Post } from '@/payload-types'
import { CMS_TAG, getManyOrThrow } from '@/utilities/cms'
import { getEntries, getHub, siteOrigin } from '@/utilities/content'
import { publicCustomerQuery } from '@/utilities/customers'
import { getIndustryPages } from '@/utilities/industries'
import { buildLlmsTxt, type LlmsLink, type LlmsSection } from '@/utilities/llmsTxt'
import { pageSitemapEntries } from '@/utilities/pages'
import { hiddenFromSearch } from '@/utilities/searchVisibility'
import { DEFAULT_DESCRIPTION, SITE_NAME } from '@/utilities/siteDefaults'
import { getSiteSettings } from '@/utilities/siteSettings'
import { customerEntries, integrationEntries, postEntries } from '@/utilities/sitemapEntries'

/**
 * /llms.txt: the site's pages as a Markdown list for AI tools (utilities/llmsTxt.ts). The same pages as
 * the two sitemaps, from the same queries and rules, each with its title and description.
 */
export const revalidate = 3600

export async function GET(request: Request) {
  const origin = siteOrigin() || new URL(request.url).origin
  const settings = await getSiteSettings()
  // The address each sitemap helper gives a single document, or nothing when it is left out.
  const urlOf = (entries: { loc: string }[]) => entries[0]?.loc

  // These throw when the CMS does not answer (as the sitemaps), so a failed request is never cached as a shorter map.
  const pages = await getManyOrThrow<Page>('pages', { limit: 1000, depth: 0, sort: 'slug' }, { tags: [CMS_TAG, 'pages-sitemap'] })
  // Home first, then the rest by slug.
  pages.sort((a, b) => Number(b.slug === 'home') - Number(a.slug === 'home'))
  const sections: LlmsSection[] = [
    {
      heading: 'Pages',
      links: pages.map((p) => ({
        title: p.meta?.title || p.title,
        url: urlOf(pageSitemapEntries([p], origin)) || '',
        description: p.meta?.description,
      })),
    },
  ]

  for (const [collection, info] of Object.entries(CONTENT_COLLECTIONS) as [
    ContentCollectionSlug,
    (typeof CONTENT_COLLECTIONS)[ContentCollectionSlug],
  ][]) {
    const links: LlmsLink[] = []
    if (info.hubAtRoute) {
      const hub = await getHub(collection)
      if (hub && !hiddenFromSearch(hub)) {
        links.push({ title: hub.meta?.title || hub.name, url: `${origin}${info.route}`, description: hub.meta?.description })
      }
    }
    const entries = await getEntries(collection, { 'where[hasOwnPage][equals]': true, depth: 0 })
    for (const e of entries) {
      if (e.slug && !hiddenFromSearch(e)) {
        links.push({ title: e.name, url: `${origin}${info.route}/${e.slug}`, description: e.meta?.description || e.summary })
      }
    }
    sections.push({ heading: info.hubLabel, links })
  }

  const industries: LlmsLink[] = []
  for (const collection of ['sectors', 'industryTopics'] as const) {
    for (const e of await getIndustryPages(collection)) {
      if (e.path && !hiddenFromSearch(e)) {
        industries.push({ title: e.name, url: `${origin}${e.path}`, description: e.meta?.description || e.summary })
      }
    }
  }
  sections.push({ heading: 'Industries', links: industries })

  const [integrations, customers, posts] = await Promise.all([
    getManyOrThrow<Integration>(
      'integrations',
      {
        'where[status][equals]': 'live',
        'where[_status][equals]': 'published',
        'where[hasOwnPage][equals]': true,
        limit: 1000,
        depth: 0,
      },
      { tags: [CMS_TAG, 'integrations'] },
    ),
    getManyOrThrow<Customer>(
      'customers',
      { ...publicCustomerQuery, 'where[hasOwnPage][equals]': true, limit: 1000, depth: 0 },
      { tags: [CMS_TAG, 'customers'] },
    ),
    getManyOrThrow<Post>('posts', { 'where[_status][equals]': 'published', limit: 1000, depth: 0 }, { tags: [CMS_TAG, 'posts'] }),
  ])
  sections.push(
    {
      heading: 'Integrations',
      links: integrations.map((d) => ({
        title: d.name,
        url: urlOf(integrationEntries([d], origin)) || '',
        description: d.meta?.description || d.summary || d.tagline,
      })),
    },
    {
      heading: 'Customer stories',
      links: customers.map((c) => ({ title: c.name, url: urlOf(customerEntries([c], origin)) || '', description: c.summary })),
    },
    {
      heading: 'Articles',
      links: posts.map((p) => ({
        title: p.meta?.title || p.title,
        url: urlOf(postEntries([p], origin)) || '',
        description: p.meta?.description,
      })),
    },
  )

  const body = buildLlmsTxt({
    name: settings.siteName || SITE_NAME,
    summary: settings.defaultDescription || DEFAULT_DESCRIPTION,
    sections,
  })
  return new Response(body, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } })
}
