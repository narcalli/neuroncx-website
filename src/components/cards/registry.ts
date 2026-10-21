import React from 'react'

import { CardDirectory } from './designs/Directory'
import { CardFeatures } from './designs/Features'
import { CardGrid } from './designs/Grid'
import { CardLogoCards } from './designs/LogoCards'
import { CardPills } from './designs/Pills'
import { CardStories } from './designs/Stories'
import type { CardDesignProps } from './types'

/**
 * Every card design by name. A block that lets an editor choose a design
 * stores one of these names and renders it with CardDesign.
 */
export const CARD_DESIGNS = {
  grid: CardGrid,
  logoCard: CardLogoCards,
  directory: CardDirectory,
  feature: CardFeatures,
  story: CardStories,
  pill: CardPills,
} satisfies Record<string, React.ComponentType<CardDesignProps>>

export type CardDesignName = keyof typeof CARD_DESIGNS

export const isCardDesign = (name: unknown): name is CardDesignName =>
  typeof name === 'string' && Object.prototype.hasOwnProperty.call(CARD_DESIGNS, name)

/** Renders the named design; an unknown or missing name falls back to the grid. */
export const CardDesign = ({
  design,
  ...props
}: CardDesignProps & { design?: string | null }): React.ReactElement => {
  const Design: React.ComponentType<CardDesignProps> = isCardDesign(design)
    ? CARD_DESIGNS[design]
    : CARD_DESIGNS.grid
  return React.createElement(Design, props)
}
