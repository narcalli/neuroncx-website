import { CONTENT_COLLECTIONS, type ContentCollectionSlug } from '@/content/registry'
import type { Customer, Integration, Post } from '@/payload-types'
import { CMS_TAG, getMany } from '@/utilities/cms'
import { getEntries, getHub, siteOrigin } from '@/utilities/content'
import { publicCustomerQuery } from '@/utilities/customers'
import { getIndustryPages } from '@/utilities/industries'
import { hiddenFromSearch } from '@/utilities/searchVisibility'
import { customerEntries, integrationEntries, postEntries } from '@/utilities/sitemapEntries'

/**
 * The sitemap for content collections: every entry page (published, Live or
 * Pilot, Own page on) and every hub that serves its route base. A hub that
 * is still a preview is left out. Then every industry and industry topic
 * page (published, Live or Pilot, Own page on), at its stored path. Then the
 * integration, customer and post pages (utilities/sitemapEntries.ts). Anything
 * hidden from search engines is left out. Listed in robots.txt by
 * next-sitemap.config.cjs.
 */

export const revalidate = 3600

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function GET(request: Request) {
  const origin = siteOrigin() || new URL(request.url).origin
  const urls: { loc: string; lastmod?: string }[] = []

  for (const [collection, info] of Object.entries(CONTENT_COLLECTIONS) as [
    ContentCollectionSlug,
    (typeof CONTENT_COLLECTIONS)[ContentCollectionSlug],
  ][]) {
    if (info.hubAtRoute) {
      const hub = await getHub(collection)
      if (hub && !hiddenFromSearch(hub)) urls.push({ loc: `${origin}${info.route}`, lastmod: hub.updatedAt })
    }
    const entries = await getEntries(collection, { 'where[hasOwnPage][equals]': true, depth: 0 })
    for (const e of entries) {
      if (e.slug && !hiddenFromSearch(e)) urls.push({ loc: `${origin}${info.route}/${e.slug}`, lastmod: e.updatedAt })
    }
  }

  for (const collection of ['sectors', 'industryTopics'] as const) {
    for (const e of await getIndustryPages(collection)) {
      if (e.path && !hiddenFromSearch(e)) urls.push({ loc: `${origin}${e.path}`, lastmod: e.updatedAt })
    }
  }

  const [integrations, customers, posts] = await Promise.all([
    getMany<Integration>(
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
    getMany<Customer>(
      'customers',
      { ...publicCustomerQuery, 'where[hasOwnPage][equals]': true, limit: 1000, depth: 0 },
      { tags: [CMS_TAG, 'customers'] },
    ),
    getMany<Post>('posts', { 'where[_status][equals]': 'published', limit: 1000, depth: 0 }, { tags: [CMS_TAG, 'posts'] }),
  ])
  urls.push(
    ...integrationEntries(integrations, origin),
    ...customerEntries(customers, origin),
    ...postEntries(posts, origin),
  )

  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    urls
      .map(
        (u) =>
          `  <url><loc>${escapeXml(u.loc)}</loc>${u.lastmod ? `<lastmod>${escapeXml(u.lastmod)}</lastmod>` : ''}</url>`,
      )
      .join('\n') +
    '\n</urlset>\n'

  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } })
}
