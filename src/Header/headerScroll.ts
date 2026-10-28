/**
 * Pure scroll-to-header-state logic, kept apart from the component so it can
 * be tested without a browser (the same pattern as megaMenuLayout.ts).
 *
 * A hairline and a soft shadow replace the glass veil once the page has
 * moved past STUCK_AT. The bar slides out of view once the visitor has
 * scrolled down past HIDE_AFTER, and comes back the moment they scroll up,
 * or at any time a menu is open or focus sits inside the header: it must
 * never hide while someone is using it.
 */

export const STUCK_AT = 8
export const HIDE_AFTER = 240

export type HeaderScrollState = { stuck: boolean; hidden: boolean }

export const nextHeaderState = (p: {
  scrollY: number
  lastScrollY: number
  /** A dropdown or the drawer is open, or focus is inside the header. */
  held: boolean
}): HeaderScrollState => ({
  stuck: p.scrollY > STUCK_AT,
  hidden: !p.held && p.scrollY > p.lastScrollY && p.scrollY > HIDE_AFTER,
})
