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
export const sectionDesignOf = (row: Partial<Pick<Row, 'cardDesign'>>, group: Pick<List, 'cardDesign'>): SectionDesign | null =>
  row.cardDesign ? (isSectionDesign(row.cardDesign) ? row.cardDesign : null) : isSectionDesign(group.cardDesign) ? group.cardDesign : null
