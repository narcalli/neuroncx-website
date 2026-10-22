import type { Integration, IntegrationCategory } from '@/payload-types'
import { integrationHref } from '@/utilities/integrations'
import { pickMedia, type MediaValue } from '@/utilities/media'

import { initialOf, isItemCardDesign, type CardItem } from '../types'

/**
 * An integration as a card. The icon and badge come from its category, which
 * arrives as a whole record when the integration was read with depth 1 or
 * more, and as a bare id otherwise (then there is no icon or badge). The link
 * is set only when the integration has its own page.
 *
 * preferredDesign is the integration's own card design, else its category's
 * (the category arrives with the integration at depth 1), else empty, which
 * follows the section. Only the designs an item may choose count.
 */
export const fromIntegration = (doc: Integration): CardItem => {
  const category =
    doc.category && typeof doc.category === 'object' ? (doc.category as IntegrationCategory) : null
  const logo = pickMedia(doc.logo as MediaValue)
  return {
    id: doc.id,
    title: doc.name,
    tagline: doc.tagline || null,
    text: doc.summary || null,
    logo: logo ? { src: logo.src, alt: logo.alt || doc.name } : null,
    icon: category?.icon || null,
    initial: initialOf(doc.name),
    badge: category?.name || null,
    href: integrationHref(doc),
    preferredDesign: isItemCardDesign(doc.cardDesign)
      ? doc.cardDesign
      : isItemCardDesign(category?.cardDesign)
        ? category.cardDesign
        : null,
  }
}
