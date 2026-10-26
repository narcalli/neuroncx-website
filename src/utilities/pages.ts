import { draftMode } from 'next/headers'
import { cache } from 'react'

import type { Page } from '@/payload-types'
import { CMS_TAG, getBySlug, getMany } from '@/utilities/cms'

/**
 * CMS pages and their addresses. A page without a parent lives at /{slug}
 * (the home page at /). A cluster page sits under its pillar page at
 * /{pillar slug}/{slug}; the CMS stores that path as the last of the page's
 * breadcrumbs (neuroncx-cms src/collections/Pages/nesting.ts).
 */

type PathPage = Pick<Page, 'slug' | 'parent' | 'breadcrumbs'>

const parentOf = (page: Pick<Page, 'parent'>): Page | null =>
  page.parent && typeof page.parent === 'object' ? page.parent : null

/** Whether the page sits under a pillar page. */
export const isCluster = (page: Pick<Page, 'parent'> | null | undefined): boolean => Boolean(page?.parent)

/**
 * A page's address on this site, or null when it has none (no slug yet).
 * A cluster page's comes from its stored breadcrumbs, else from its pillar's
 * slug when the pillar arrived as a whole record.
 */
export const pagePathOf = (page: PathPage | null | undefined): string | null => {
  if (!page?.slug) return null
  if (!isCluster(page)) return page.slug === 'home' ? '/' : `/${page.slug}`
  const stored = page.breadcrumbs?.at(-1)?.url
  if (typeof stored === 'string' && stored.startsWith('/')) return stored
  const pillar = parentOf(page)
  return pillar?.slug ? `/${pillar.slug}/${page.slug}` : null
}

/** Of the pages a path query returned, the one whose own address is that path. */
export const pickByPath = <T extends PathPage>(docs: T[], path: string): T | null =>
  docs.find((d) => isCluster(d) && pagePathOf(d) === path) ?? null

/**
 * The page at /{slug}, published or (in draft mode) its latest draft. `cache`
 * keeps one request per render, shared by the page and its metadata.
 */
export const queryPageBySlug = cache(async (slug: string): Promise<Page | null> => {
  const { isEnabled: draft } = await draftMode()
  return getBySlug<Page>('pages', slug, { draft, depth: 2, tags: [CMS_TAG, `page-${slug}`] })
})

/** The cluster page whose stored path is this one, such as /higher-education/fees. */
export const queryPageByPath = cache(async (path: string): Promise<Page | null> => {
  const { isEnabled: draft } = await draftMode()
  const slug = path.split('/').pop() || ''
  const docs = await getMany<Page>(
    'pages',
    {
      'where[breadcrumbs.url][equals]': path,
      limit: 5,
      depth: 2,
      ...(draft ? { draft: 'true' } : {}),
    },
    { draft, tags: [CMS_TAG, `page-${slug}`] },
  )
  return pickByPath(docs, path)
})

/**
 * Paths the site's own routes answer before the CMS pages do
 * (src/app/(frontend)): a page or pillar with one of these slugs is shadowed
 * there, so it is never listed in the sitemap.
 */
const OWN_FIRST_LEVEL = ['posts', 'bot-swarm', 'integrations-preview']
const OWN_SECOND_LEVEL = ['posts', 'bot-swarm', 'customers', 'integrations', 'next', 'api', 'dev']

const shadowed = (path: string): boolean => {
  const [first, ...rest] = path.split('/').filter(Boolean)
  if (!first) return false
  return rest.length ? OWN_SECOND_LEVEL.includes(first) : OWN_FIRST_LEVEL.includes(first)
}

/** Sitemap entries for published pages, each at its full path. */
export const pageSitemapEntries = (
  pages: (PathPage & { updatedAt?: string | null })[],
  origin: string,
): { loc: string; lastmod?: string }[] =>
  pages.flatMap((p) => {
    const path = pagePathOf(p)
    if (!path || shadowed(path)) return []
    return [{ loc: path === '/' ? `${origin}/` : `${origin}${path}`, ...(p.updatedAt ? { lastmod: p.updatedAt } : {}) }]
  })
