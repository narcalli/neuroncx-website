/**
 * Local mirror of the "bentoGrid" block shape returned by the CMS's REST
 * API. The CMS is a separate repo — these are hand-kept, not generated —
 * so if a field is added or renamed there, it has to be updated here too.
 * The per-card option fields (number, eyebrow, points, colour, border) are
 * shared with other card blocks and live in ../OptionCard/types.
 */
import type { CardColor, CardImagePosition, CardLinkData, CardOptionFields } from '../OptionCard/types'

/** The shared card colours plus the ones only Bento Grid offers. */
export type BentoGridCardColor = CardColor | 'red'

export type BentoGridGap = 'small' | 'medium' | 'large'
export type BentoGridColSpan = '3' | '4' | '6' | '8' | '9' | '12'
export type BentoGridRowSpan = '1' | '2' | '3'
export type BentoGridTabletColSpan = 'auto' | '6' | '12'
export type BentoGridTitleSize = 'large' | 'regular'
export type BentoGridImagePosition = CardImagePosition
export type BentoGridLink = CardLinkData

export interface BentoGridImage {
  url: string
  alt?: string | null
  width?: number | null
  height?: number | null
}

export interface BentoGridCard extends Omit<CardOptionFields, 'cardColor'> {
  id?: string | null
  cardColor?: BentoGridCardColor | null
  /** A BlockIcon name. Empty means no icon. */
  icon?: string | null
  colSpan: BentoGridColSpan
  rowSpan: BentoGridRowSpan
  tabletColSpan: BentoGridTabletColSpan
  title: string
  titleSize: BentoGridTitleSize
  body?: string | null
  /** A populated media doc, a bare id string when depth was too shallow, or nothing. */
  image?: BentoGridImage | string | null
  imagePosition: BentoGridImagePosition
  link?: BentoGridLink | null
}

export interface BentoGridBlockProps {
  blockType: 'bentoGrid'
  gap: BentoGridGap
  rowHeight: number
  dense: boolean
  framed: boolean
  /** Optional section header. Each part shows only when filled in. */
  eyebrow?: string | null
  title?: string | null
  description?: string | null
  cards: BentoGridCard[]
  /** The block's Appearance "Background" option, applied by the page wrapper. */
  background?: 'default' | 'white' | 'cloud' | 'navy' | 'crimson' | null
  /** The block's Appearance "Content width" option, applied by the page wrapper. */
  width?: 'default' | 'narrow' | 'wide' | 'full' | null
}
