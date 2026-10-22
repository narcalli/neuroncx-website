import type { Customer, Integration, IntegrationCategory, Page } from '@/payload-types'

/** One step of a breadcrumb trail. Only steps with an href are links. */
export type Crumb = { label: string; href?: string }

/**
 * A page as the trail needs it. A parent page arrives as a whole record only
 * when it was read with enough depth (and its fields were populated); a bare
 * id, or nothing, ends the walk there.
 */
export type TrailPage = Pick<Page, 'title'> & {
  id?: string
  slug?: string | null
  breadcrumbLabel?: string | null
  breadcrumbParent?: {
    kind?: 'none' | 'page' | 'label' | null
    page?: string | TrailPage | null
    label?: string | null
  } | null
}

export type TrailInput =
  | { page: TrailPage }
  | {
      integration: Pick<Integration, 'name'> & {
        category?: string | Pick<IntegrationCategory, 'name'> | null
      }
    }
  | { customer: Pick<Customer, 'name'> }

/** Parents walked above a page, at most. A parent set to a label counts as one. */
export const MAX_PARENTS = 3
/** The longest trail shown; a longer one keeps its ends and collapses the middle. */
export const MAX_ITEMS = 4
export const ELLIPSIS = '…'

const HOME: Crumb = { label: 'Home', href: '/' }

const pageLabel = (p: TrailPage) => p.breadcrumbLabel?.trim() || p.title
const pageHref = (p: TrailPage) => (p.slug ? `/${p.slug}` : undefined)

// Parents, nearest last. Stops at a missing or unpopulated parent, at Home
// (the trail starts there anyway) and at a page already in the trail.
const ancestorsOf = (page: TrailPage): Crumb[] => {
  const trail: Crumb[] = []
  const seen = new Set(page.id ? [page.id] : [])
  let parent = page.breadcrumbParent
  for (let level = 0; level < MAX_PARENTS && parent; level++) {
    if (parent.kind === 'label') {
      const label = parent.label?.trim()
      if (label) trail.unshift({ label })
      break
    }
    const p = parent.kind === 'page' ? parent.page : null
    if (!p || typeof p !== 'object' || p.slug === 'home' || (p.id && seen.has(p.id))) break
    if (p.id) seen.add(p.id)
    trail.unshift({ label: pageLabel(p), href: pageHref(p) })
    parent = p.breadcrumbParent
  }
  return trail
}

/** Keeps the first item and the last two, with ELLIPSIS between. */
const cap = (trail: Crumb[]): Crumb[] =>
  trail.length <= MAX_ITEMS
    ? trail
    : [trail[0], { label: ELLIPSIS }, ...trail.slice(-(MAX_ITEMS - 2))]

/**
 * The breadcrumb trail for a Payload page, an integration or a customer,
 * starting at Home. The last item is the current page and has no href.
 *
 * - Page: Home / its parents / the page, by breadcrumbLabel where set, else
 *   title. A parent set to a label has no link. Home's own trail is just Home.
 * - Integration: Home / Integrations / its category (no page, so no link) / the integration.
 * - Customer: Home / Customers / the customer.
 */
export const buildTrail = (input: TrailInput): Crumb[] => {
  if ('page' in input) {
    const { page } = input
    if (page.slug === 'home') return [{ label: HOME.label }]
    return cap([HOME, ...ancestorsOf(page), { label: pageLabel(page) }])
  }
  if ('integration' in input) {
    const { integration } = input
    const category = typeof integration.category === 'object' ? integration.category?.name : null
    return cap([
      HOME,
      { label: 'Integrations', href: '/integrations' },
      ...(category ? [{ label: category }] : []),
      { label: integration.name },
    ])
  }
  return cap([HOME, { label: 'Customers', href: '/customers' }, { label: input.customer.name }])
}
