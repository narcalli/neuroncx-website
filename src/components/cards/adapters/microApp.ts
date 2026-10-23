import type { ProductSuiteProduct } from '@/blocks/ProductSuite/Component'
import type { MicroApp } from '@/payload-types'
import { hrefOf, type LinkValue } from '@/utilities/cmsValues'
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

/**
 * The agent's steps for a Product suite card, in Panel order. Where the
 * field's text leaves out its verb (the field label says it), the label
 * leads, as on the agent's own page ("Starts when: ..."). What the team
 * controls comes last, labelled unless it already says "Your team ...".
 */
const SUITE_STEPS: [keyof MicroApp, string | null][] = [
  ['startsWhen', 'Starts when'],
  ['hears', 'Hears'],
  ['checks', 'Checks'],
  ['acts', null],
  ['handsOver', null],
  ['records', 'Records'],
  ['teamControls', 'Team controls'],
]

/** Labels left off when the text already starts with what they say. */
const SAYS_IT: Partial<Record<keyof MicroApp, RegExp>> = { teamControls: /^your team\b/i }

/**
 * A bot swarm agent as a card in the Product suite design (a hub grouping
 * section whose design is Product suite): its name, its steps as pills, and
 * its summary, result and proof as one paragraph. The link is the agent's
 * own page, else its button, if either is set.
 */
export const toSuiteProduct = (doc: MicroApp, draft = false): ProductSuiteProduct => {
  const page = entryHref('microApps', doc, draft)
  const button = doc.cta?.label ? hrefOf(doc.cta.link as LinkValue) : null
  return {
    id: doc.id,
    name: doc.name,
    flag: doc.status === 'pilot' ? 'Pilot' : doc.status === 'planned' ? 'Planned' : null,
    summary: [doc.summary, doc.result, doc.proof].filter(Boolean).join(' ') || null,
    points: SUITE_STEPS.flatMap(([key, label], i) => {
      const text = doc[key]
      if (typeof text !== 'string' || !text.trim()) return []
      const lead = label && !SAYS_IT[key]?.test(text.trim()) ? `${label}: ` : ''
      return [{ id: `${doc.id}-${i}`, text: lead + text }]
    }),
    linkHref: page ?? button,
    linkLabel: doc.cta?.label || null,
  }
}
