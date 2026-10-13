import type { Customer, Sector } from '@/payload-types'

/**
 * Shared rules for customers on the public site.
 *
 * The CMS already enforces clearance for visitors: an uncleared customer
 * arrives with its anonymised name, no slug, no logo and hasOwnPage false,
 * and past customers and drafts never arrive at all. The checks here are a
 * second line of defence, so a mistake in one place cannot publish a name.
 */
export const publicCustomerQuery = {
  'where[_status][equals]': 'published',
} as const

/** Sector ids from a relationship field, whether populated or not. */
export const sectorIds = (sectors?: (string | Sector)[] | null): string[] =>
  (sectors || []).map((s) => (typeof s === 'object' && s ? s.id : s)).filter((id): id is string => Boolean(id))

/** Populated customers with a name to show. */
export const publicCustomers = (docs: (Customer | string | null | undefined)[]): Customer[] =>
  docs.filter((c): c is Customer => Boolean(c && typeof c === 'object' && c.name))

/** A customer may be linked to, and have a page, only with a name, its own page switched on and a slug. */
export const hasPublicPage = (c?: Customer | null): c is Customer & { slug: string } =>
  Boolean(c && c.name && c.hasOwnPage && c.slug)

/** The address of a customer's own page, or null when it has none. */
export const customerHref = (c?: Customer | null): string | null => (hasPublicPage(c) ? `/customers/${c.slug}` : null)

/** Lower order first, then name. The CMS ignores a visitor's sort by name, so the name part happens here. */
export const byOrderThenName = (a: Customer, b: Customer) =>
  (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name)
