import type { Metadata } from 'next'

/**
 * The CMS's "Hide from search engines" switch (meta.noIndex in each SEO tab).
 * A hidden page stays reachable by its address, carries noindex, follow (so
 * search engines drop it but still follow its links), and is left out of
 * every sitemap.
 */

type WithMeta = { meta?: { noIndex?: boolean | null } | null } | null | undefined

export const hiddenFromSearch = (doc: WithMeta): boolean => doc?.meta?.noIndex === true

/** The robots part of a page's metadata: noindex, follow when hidden, else nothing (indexable). */
export const robotsFor = (doc: WithMeta): Pick<Metadata, 'robots'> =>
  hiddenFromSearch(doc) ? { robots: { index: false, follow: true } } : {}
