import type { MicroApp } from '@/payload-types'
import { entryHref, groupOf } from '@/utilities/content'

import { initialOf, isItemCardDesign, type CardItem } from '../types'

/**
 * A bot swarm agent as a card. The link is set only when the agent has its
 * own page. A Pilot agent carries a Pilot chip, and in a draft preview a
 * Planned agent carries a Planned chip (and links to its page, if it has one).
 *
 * preferredDesign is the agent's own card design, else its family's (the
 * family arrives with the agent at depth 1), else empty, which follows the
 * section's design.
 */
export const fromMicroApp = (doc: MicroApp, draft = false): CardItem => {
  const family = groupOf(doc)
  return {
    id: doc.id,
    title: doc.name,
    tagline: doc.tagline || null,
    text: doc.summary || null,
    icon: doc.icon || family?.icon || null,
    initial: initialOf(doc.name),
    badge: family?.name || null,
    flag: doc.status === 'pilot' ? 'Pilot' : doc.status === 'planned' ? 'Planned' : null,
    href: entryHref('microApps', doc, draft),
    preferredDesign: isItemCardDesign(doc.cardDesign)
      ? doc.cardDesign
      : isItemCardDesign(family?.cardDesign)
        ? family.cardDesign
        : null,
  }
}
