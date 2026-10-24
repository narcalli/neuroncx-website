import type { Hub, List } from '@/payload-types'

/**
 * Designs that draw a hub grouping's whole section with one of the site's
 * blocks, one card per entry (SECTION_CARD_DESIGNS in neuroncx-cms
 * src/fields/cardDesign.ts).
 */
export const SECTION_DESIGNS = ['suite', 'suiteSteps', 'suite2', 'detailedSuite', 'bento'] as const

export type SectionDesign = (typeof SECTION_DESIGNS)[number]

export const isSectionDesign = (v: unknown): v is SectionDesign => SECTION_DESIGNS.includes(v as SectionDesign)

type Row = NonNullable<Hub['groupingSections']>[number]

/**
 * The section design a hub's grouping section draws with: the row's own
 * design wins; with none, the grouping's section design applies. Null draws
 * the card grid, where an entry's or a grouping's item design still applies.
 */
/**
 * The card designs that can list an entry's key points (KEY_POINT_DESIGNS in
 * neuroncx-cms src/fields/cardDesign.ts).
 */
export const KEY_POINT_DESIGNS = ['feature', 'logoCard', 'story'] as const

const showsKeyPoints = (design: unknown) => (KEY_POINT_DESIGNS as readonly unknown[]).includes(design)

/**
 * Whether a hub's grouping section lists its entries' key points. "Show key
 * points" sits beside each Card design choice and is offered only for a
 * design that can show them, so the switch read is the one beside the design
 * in force: the row's, when the row chose such a design, else the
 * grouping's, when it did. Off otherwise.
 */
export const showKeyPointsOf = (
  row: Partial<Pick<Row, 'cardDesign' | 'showKeyPoints'>>,
  group: Pick<List, 'cardDesign' | 'showKeyPoints'>,
): boolean =>
  showsKeyPoints(row.cardDesign)
    ? Boolean(row.showKeyPoints)
    : showsKeyPoints(group.cardDesign)
      ? Boolean(group.showKeyPoints)
      : false

export const sectionDesignOf = (row: Partial<Pick<Row, 'cardDesign'>>, group: Pick<List, 'cardDesign'>): SectionDesign | null =>
  row.cardDesign ? (isSectionDesign(row.cardDesign) ? row.cardDesign : null) : isSectionDesign(group.cardDesign) ? group.cardDesign : null
