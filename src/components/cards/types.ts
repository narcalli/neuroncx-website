import type { CardOptionFields } from '@/components/blocks/OptionCard/types'

/**
 * One card, whatever it describes. Every card design (designs/*) takes a list
 * of these, and an adapter (adapters/*) turns a CMS record into one, so a
 * design never needs to know which collection its items came from.
 */
export type CardItem = {
  id: string
  title: string
  tagline?: string | null
  text?: string | null
  logo?: { src: string; alt: string } | null
  /** An icon name from the shared icon library (BlockIcon). */
  icon?: string | null
  /** The first letter of the title, or "?". Shown where a logo would be when there is none. */
  initial: string
  /** A short label, for example a category. */
  badge?: string | null
  chips?: string[]
  /** Set only when the item has its own page. */
  href?: string | null
  linkLabel?: string | null
  /** The design the item asks for (its own, else its group's, such as an integration's category), where its section allows it. Empty follows the section. */
  preferredDesign?: ItemCardDesign | null
}

/**
 * The designs one item may choose for itself (ITEM_CARD_DESIGNS in
 * neuroncx-cms src/fields/cardDesign.ts). Directory and pill describe a
 * whole list, so only a section can use them.
 */
export const ITEM_CARD_DESIGNS = ['grid', 'logoCard', 'feature', 'story'] as const

export type ItemCardDesign = (typeof ITEM_CARD_DESIGNS)[number]

export const isItemCardDesign = (name: unknown): name is ItemCardDesign =>
  typeof name === 'string' && (ITEM_CARD_DESIGNS as readonly string[]).includes(name)

/** Cards per row on wide screens. */
export type CardColumns = 2 | 3 | 4

/**
 * What happens to a last row that is not full: stretch its cards to fill the
 * row, centre them, or leave them where they fall.
 */
export type CardLastRow = 'stretch' | 'center' | 'leave'

/** The look of the feature design: the card options OptionCard already understands. */
export type CardLook = Pick<CardOptionFields, 'cardColor' | 'border' | 'borderColor' | 'accentLine'>

export type CardLayoutProps = {
  columns?: CardColumns
  lastRow?: CardLastRow
  look?: CardLook
}

export type CardDesignProps = { items: CardItem[] } & CardLayoutProps

/** The first letter of a title, or "?" when there is none. */
export const initialOf = (title?: string | null): string => (title || '').trim().charAt(0) || '?'
