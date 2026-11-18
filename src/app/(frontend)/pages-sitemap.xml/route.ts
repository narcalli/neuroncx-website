import type { Page } from '@/payload-types'
import { CMS_TAG, getManyOrThrow } from '@/utilities/cms'
import { siteOrigin } from '@/utilities/content'
import { pageSitemapEntries } from '@/utilities/pages'

/**
 * The sitemap for CMS pages: every published page at its full address, so a
 * cluster page is listed at /{pillar}/{slug}. Pages a site route answers
 * first are left out (utilities/pages.ts). Listed in robots.txt by
 * next-sitemap.config.cjs.
 *
 * Never empty: when the CMS does not answer, or answers with no page to list,
 * the route throws instead, so the last good sitemap stays in the cache and a
 * crawler sees a temporary error. On 18 Nov 2026 a failed request was turned
 * into an empty list and an empty sitemap was cached and served with a 200.
 */
export const revalidate = 3600

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function GET(request: Request) {
  const origin = siteOrigin() || new URL(request.url).origin
  // The public API returns published pages only.
  const pages = await getManyOrThrow<Page>('pages', { limit: 1000, depth: 0, sort: 'slug' }, { tags: [CMS_TAG, 'pages-sitemap'] })
  const urls = pageSitemapEntries(pages, origin)
  // The home page is always published, so a sitemap with nothing in it is a fault, not the site.
  if (!urls.length) throw new Error(`pages-sitemap: ${pages.length} pages from the CMS gave no address to list; not publishing an empty sitemap.`)
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
