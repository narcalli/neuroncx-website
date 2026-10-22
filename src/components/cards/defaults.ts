import type { CardBorder, CardBorderColor, CardColor } from '@/components/blocks/OptionCard/types'

import { isCardDesign, type CardDesignName } from './registry'
import type { CardColumns, CardLastRow } from './types'

/**
 * What a block with the CMS "Card design" settings falls back to, field by
 * field. The source is CARD_DESIGN_DEFAULTS in neuroncx-cms
 * src/fields/cardDesign.ts; keep the two in step.
 *
 * columns is null: no fixed number per row, so each design uses its own (the
 * grid fits as many as the width allows, feature and story cards 3, logo
 * cards 4). allowItemDesigns is on: an item that chose its own design gets
 * it (see CardSection).
 */
export const CARD_DESIGN_DEFAULTS = {
  design: 'grid',
  columns: null,
  lastRow: 'leave',
  groupByCategory: false,
  allowItemDesigns: true,
} as const

/**
 * The feature card look when none is saved: the CMS look defaults
 * (cardLookFields('white') in neuroncx-cms src/fields/cardOptions.ts). White
 * with a shadow, no border, no accent line.
 */
export const CARD_LOOK_DEFAULTS = {
  cardColor: 'white',
  border: 'none',
  borderColor: 'blue',
  accentLine: false,
} as const

/** The settings as the CMS sends them: any field may be missing or null. */
export type SavedCardDesign = {
  design?: string | null
  columns?: string | null
  lastRow?: string | null
  groupByCategory?: boolean | null
  linkLabel?: string | null
  look?: {
    cardColor?: string | null
    border?: string | null
    borderColor?: string | null
    accentLine?: boolean | null
  } | null
  allowItemDesigns?: boolean | null
}

/** Every setting filled in. */
export type CardDesignSettings = {
  design: CardDesignName
  columns: CardColumns | null
  lastRow: CardLastRow
  groupByCategory: boolean
  linkLabel: string | null
  look: { cardColor: CardColor; border: CardBorder; borderColor: CardBorderColor; accentLine: boolean }
  allowItemDesigns: boolean
}

const oneOf = <T extends string>(value: unknown, allowed: readonly T[], fallback: T): T =>
  allowed.includes(value as T) ? (value as T) : fallback

/**
 * The saved settings over the defaults, field by field: a block with no
 * settings, or only some, gets the default for each one that is missing,
 * empty or not a known value.
 */
export const mergeCardDesign = (saved?: SavedCardDesign | null): CardDesignSettings => {
  const s = saved || {}
  const look = s.look || {}
  const columns = Number(s.columns)
  return {
    design: isCardDesign(s.design) ? s.design : CARD_DESIGN_DEFAULTS.design,
    columns: columns === 2 || columns === 3 || columns === 4 ? columns : CARD_DESIGN_DEFAULTS.columns,
    lastRow: oneOf(s.lastRow, ['stretch', 'center', 'leave'], CARD_DESIGN_DEFAULTS.lastRow),
    groupByCategory: s.groupByCategory ?? CARD_DESIGN_DEFAULTS.groupByCategory,
    linkLabel: s.linkLabel?.trim() || null,
    look: {
      cardColor: oneOf(look.cardColor, ['grey', 'lavender', 'white'], CARD_LOOK_DEFAULTS.cardColor),
      border: oneOf(look.border, ['none', 'solid', 'gradient'], CARD_LOOK_DEFAULTS.border),
      borderColor: oneOf(look.borderColor, ['blue', 'violet', 'crimson', 'navy'], CARD_LOOK_DEFAULTS.borderColor),
      accentLine: look.accentLine ?? CARD_LOOK_DEFAULTS.accentLine,
    },
    allowItemDesigns: s.allowItemDesigns ?? CARD_DESIGN_DEFAULTS.allowItemDesigns,
  }
}
