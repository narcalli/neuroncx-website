import React from 'react'

import { RelatedCards } from '@/components/integrations/RelatedCards'

import type { CardDesignProps } from '../types'

/**
 * The logo card design: the cards from the bottom of an integration's page,
 * a logo (or the initial) on a tinted tile above the title and a line of
 * text. A card links when its item has its own page.
 *
 * `showAllLink` adds the "All integrations" end card, which only makes sense
 * for integrations, so it is off here unless asked for. Separate cards with
 * gaps, so a short last row simply ends early; `lastRow` does not apply.
 */
export const CardLogoCards: React.FC<CardDesignProps & { showAllLink?: boolean }> = ({
  items,
  columns,
  showAllLink = false,
}) => {
  if (!items.length) return null
  return (
    <RelatedCards
      cards={items.map((it) => ({
        id: it.id,
        name: it.title,
        text: it.tagline || it.text || null,
        href: it.href || null,
        logoSrc: it.logo?.src || null,
        flag: it.flag || null,
      }))}
      columns={columns}
      showAllLink={showAllLink}
    />
  )
}
