import type { Page } from '@/payload-types'
import { CMS_TAG, getMany } from '@/utilities/cms'
import { siteOrigin } from '@/utilities/content'
import { pageSitemapEntries } from '@/utilities/pages'

/**
 * The sitemap for CMS pages: every published page at its full address, so a
 * cluster page is listed at /{pillar}/{slug}. Pages a site route answers
 * first are left out (utilities/pages.ts). Listed in robots.txt by
 * next-sitemap.config.cjs.
 */
export const revalidate = 3600

const escapeXml = (s: string) =>
  s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')

export async function GET(request: Request) {
  const origin = siteOrigin() || new URL(request.url).origin
  // The public API returns published pages only.
  const pages = await getMany<Page>('pages', { limit: 1000, depth: 0, sort: 'slug' }, { tags: [CMS_TAG, 'pages-sitemap'] })
  const urls = pageSitemapEntries(pages, origin)
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
