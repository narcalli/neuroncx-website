import type { Customer, Integration, Post } from '@/payload-types'

import { customerHref } from './customers'
import { integrationHref } from './integrations'
import { hiddenFromSearch } from './searchVisibility'

/**
 * Sitemap entries for the pages that live outside the content collections
 * (app/(frontend)/content-sitemap.xml). Each uses the same rule as the page
 * itself, so the sitemap never lists an address that is a 404. Entries
 * hidden from search engines are left out (utilities/searchVisibility.ts).
 */

export type SitemapEntry = { loc: string; lastmod?: string }

const entry = (origin: string, path: string | null, updatedAt?: string | null): SitemapEntry[] =>
  path ? [{ loc: `${origin}${path}`, ...(updatedAt ? { lastmod: updatedAt } : {}) }] : []

/** Integration items with a page of their own: published, Live, Own page on. */
export const integrationEntries = (docs: Integration[], origin: string): SitemapEntry[] =>
  docs.flatMap((d) => (hiddenFromSearch(d) ? [] : entry(origin, integrationHref(d), d.updatedAt)))

/** Customers with a page of their own: a name, Own page on and a slug. */
export const customerEntries = (docs: Customer[], origin: string): SitemapEntry[] =>
  docs.flatMap((c) => entry(origin, customerHref(c), c.updatedAt))

/** Published posts at /posts/{slug}. */
export const postEntries = (docs: Post[], origin: string): SitemapEntry[] =>
  docs.flatMap((p) => (hiddenFromSearch(p) || !p.slug ? [] : entry(origin, `/posts/${p.slug}`, p.updatedAt)))
