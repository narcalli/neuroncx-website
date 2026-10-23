import { CONTENT_COLLECTIONS, type ContentCollectionSlug } from '@/content/registry'
import { getEntries, getHub, siteOrigin } from '@/utilities/content'

/**
 * The sitemap for content collections: every entry page (published, Live or
 * Pilot, Own page on) and every hub that serves its route base. A hub that
 * is still a preview is left out. Listed in robots.txt by
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
      if (hub) urls.push({ loc: `${origin}${info.route}`, lastmod: hub.updatedAt })
    }
    const entries = await getEntries(collection, { 'where[hasOwnPage][equals]': true, depth: 0 })
    for (const e of entries) {
      if (e.slug) urls.push({ loc: `${origin}${info.route}/${e.slug}`, lastmod: e.updatedAt })
    }
  }

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
