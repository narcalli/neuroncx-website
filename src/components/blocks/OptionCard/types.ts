/**
 * The card options shared by every card-based block (Bento Grid, Product
 * Suite 2). Mirrors neuroncx-cms/src/fields/cardOptions.ts — the CMS is a
 * separate repo, so a field added there has to be added here too.
 */

export type CardColor = 'grey' | 'lavender' | 'white'
export type CardBorder = 'none' | 'solid' | 'gradient'
export type CardBorderColor = 'blue' | 'violet' | 'crimson' | 'navy'
export type CardListStyle = 'pills' | 'bullets'
export type CardImagePosition = 'middle' | 'top' | 'bottom' | 'background'

export interface CardPoint {
  id?: string | null
  text: string
}

export interface CardLinkData {
  label?: string | null
  url?: string | null
  newTab?: boolean | null
}

export interface CardOptionFields {
  /** Look. A missing colour falls back to the block's default. */
  cardColor?: CardColor | null
  border?: CardBorder | null
  /** Only used when border is "solid". */
  borderColor?: CardBorderColor | null
  accentLine?: boolean | null
  /** Content switches. Eyebrow is on unless explicitly false; the others are off unless true. */
  showNumber?: boolean | null
  showEyebrow?: boolean | null
  showPoints?: boolean | null
  /** Replaces the automatic 01, 02, ... count; that card is then skipped in the count. */
  numberText?: string | null
  /** The eyebrow text. */
  tag?: string | null
  points?: CardPoint[] | null
  listStyle?: CardListStyle | null
}
