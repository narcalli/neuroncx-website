import type { Header } from '@/payload-types'
import { hrefOf, type LinkValue } from '@/utilities/cmsValues'

/**
 * The mega menu's rules, kept apart from the component so they can be tested
 * without a browser. The CMS describes the same rules to editors (the Groups
 * field on the header's menu items):
 *
 *   The menu panel sizes itself. A single group hides its label. Groups with
 *   4 or more items wrap into 2 columns. The featured card only shows when the
 *   menu has 5 or more items in total.
 */

export type NavItem = NonNullable<Header['navItems']>[number]

export type MenuEntry = {
  id: string
  icon: string | null
  label: string
  description: string | null
  href: string
  newTab: boolean
  badge: 'new' | 'beta' | null
}

export type MenuGroup = { id: string; label: string | null; items: MenuEntry[] }

export type Featured = {
  eyebrow: string | null
  title: string
  href: string | null
  newTab: boolean
  linkLabel: string | null
}

const isExternal = (href: string) => /^https?:\/\//.test(href)

const badgeOf = (value: unknown): MenuEntry['badge'] => {
  const v = typeof value === 'string' ? value.trim().toLowerCase() : ''
  return v === 'new' || v === 'beta' ? v : null
}

/** A link field's address and whether it opens in a new tab, or null when it goes nowhere. */
const target = (link: LinkValue): { href: string; newTab: boolean } | null => {
  const href = hrefOf(link)
  return href ? { href, newTab: Boolean(link?.newTab) || isExternal(href) } : null
}

/** The groups the item has in the mega menu fields, items that go nowhere left out. */
const ownGroups = (item: NavItem): MenuGroup[] =>
  (item.groups || [])
    .map((g, gi) => ({
      id: g.id || `g${gi}`,
      label: g.label?.trim() || null,
      items: (g.items || []).flatMap((it, ii) => {
        const to = it?.label ? target(it.link as LinkValue) : null
        if (!to) return []
        return [
          {
            id: it.id || `g${gi}i${ii}`,
            icon: it.icon || null,
            label: it.label,
            description: it.description?.trim() || null,
            ...to,
            badge: badgeOf(it.badge),
          },
        ]
      }),
    }))
    .filter((g) => g.items.length)

/**
 * The groups from the old fields, for a header that has not been copied into
 * the mega menu fields yet (scripts/migrate-mega-menu.ts in the CMS): each old
 * column a group, or a flat list split at each group heading.
 */
const legacyGroups = (item: NavItem): MenuGroup[] => {
  const columns = (item.columns || [])
    .map((c, ci) => ({
      id: c.id || `c${ci}`,
      label: c.heading?.trim() || null,
      items: (c.links || []).flatMap((l, li) =>
        l?.label && l.href
          ? [{ id: l.id || `c${ci}l${li}`, icon: null, label: l.label, description: l.description?.trim() || null, href: l.href, newTab: isExternal(l.href), badge: null }]
          : [],
      ),
    }))
    .filter((c) => c.items.length)
  if (columns.length) return columns

  const groups: MenuGroup[] = []
  ;(item.items || []).forEach((l, li) => {
    if (!l?.label || !l.href) return
    if (!groups.length || l.groupHeading) groups.push({ id: `h${li}`, label: l.groupHeading?.trim() || null, items: [] })
    groups[groups.length - 1].items.push({
      id: l.id || `l${li}`,
      icon: null,
      label: l.label,
      description: null,
      href: l.href,
      newTab: Boolean(l.newTab) || isExternal(l.href),
      badge: badgeOf(l.badge),
    })
  })
  return groups
}

/**
 * What one menu item is: a plain link, a mega menu, or nothing to show. The
 * mega menu fields win; the old ones are read only while those are empty,
 * with the rule the site used before them (old links make a dropdown unless
 * the item was set to a link with an address).
 */
export type MenuKind =
  | { kind: 'link'; href: string; newTab: boolean }
  | { kind: 'megaMenu'; groups: MenuGroup[] }
  | { kind: 'none' }

export const menuKind = (item: NavItem): MenuKind => {
  const own = item.type === 'megaMenu' ? ownGroups(item) : []
  if (own.length) return { kind: 'megaMenu', groups: own }

  const link = item.type === 'link' ? target(item.link as LinkValue) : null
  if (link) return { kind: 'link', ...link }

  const legacy = legacyGroups(item)
  if (legacy.length && !(item.type === 'link' && item.href)) return { kind: 'megaMenu', groups: legacy }
  if (item.href) return { kind: 'link', href: item.href, newTab: isExternal(item.href) }
  return { kind: 'none' }
}

export const FEATURED_MIN_ITEMS = 5
export const GRID_MIN_ITEMS = 4

/**
 * How a panel lays out its groups:
 * - labels show only when there is more than one group;
 * - a group with 4 or more items is a 2-column grid, a shorter one a list;
 * - the featured card shows when it is switched on, has a title, and the
 *   menu has 5 or more items in total.
 */
export const panelLayout = (groups: MenuGroup[], featured: NavItem['featured'] | null) => {
  const total = groups.reduce((n, g) => n + g.items.length, 0)
  const showLabels = groups.length > 1
  return {
    showLabels,
    // In a row of labelled columns, a column without a label keeps the space,
    // so every column's first item starts on the same line.
    reserveLabel: showLabels && groups.some((g) => g.label),
    groups: groups.map((g) => ({ ...g, grid: g.items.length >= GRID_MIN_ITEMS })),
    hasIcons: groups.some((g) => g.items.some((i) => i.icon)),
    featured: featuredOf(featured, total),
  }
}

const featuredOf = (featured: NavItem['featured'] | null, total: number): Featured | null => {
  if (!featured?.enabled || total < FEATURED_MIN_ITEMS || !featured.title?.trim()) return null
  const to = target(featured.link as LinkValue)
  return {
    eyebrow: featured.eyebrow?.trim() || null,
    title: featured.title.trim(),
    href: to?.href || null,
    newTab: to?.newTab || false,
    linkLabel: featured.linkLabel?.trim() || null,
  }
}

/**
 * Where a panel's left edge goes, in viewport pixels. It starts under its
 * trigger; if its right edge would pass the container's right edge it moves
 * left just enough, but never past the container's left edge (a panel wider
 * than the container cannot happen: its max-width is the container's width).
 */
export const panelLeft = (p: { triggerLeft: number; panelWidth: number; containerLeft: number; containerRight: number }) =>
  Math.max(p.containerLeft, Math.min(p.triggerLeft, p.containerRight - p.panelWidth))
