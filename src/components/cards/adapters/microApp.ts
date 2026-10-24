import type { DetailedProductSuiteCard } from '@/blocks/DetailedProductSuite/Component'
import type { ProductSuiteProduct } from '@/blocks/ProductSuite/Component'
import type { ProductSuite2Card } from '@/blocks/ProductSuite2/Component'
import type { BentoGridCard } from '@/components/blocks/BentoGrid/types'
import type { MicroApp } from '@/payload-types'
import { hrefOf, type LinkValue } from '@/utilities/cmsValues'
import { entryHref, groupOf } from '@/utilities/content'

import type { BentoSize } from '../bentoPattern'
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
    keyPoints: (doc.keyPoints ?? []).map((k) => k?.line).filter((line): line is string => Boolean(line)),
    preferredDesign: isItemCardDesign(doc.cardDesign)
      ? doc.cardDesign
      : isItemCardDesign(family?.cardDesign)
        ? family.cardDesign
        : null,
  }
}

/**
 * A bot swarm agent as a card in its family's section on the hub: the
 * summary as the card's text (the tagline only when there is no summary),
 * and no family pill, since the section's eyebrow already names the family.
 */
export const familyCard = (doc: MicroApp, draft = false): CardItem => ({
  ...fromMicroApp(doc, draft),
  tagline: null,
  text: doc.summary || doc.tagline || null,
  badge: null,
})

/** A status pill after the name: Pilot, or Planned in a draft preview. */
const flagOf = (doc: MicroApp): string | null =>
  doc.status === 'pilot' ? 'Pilot' : doc.status === 'planned' ? 'Planned' : null

/** Where a card links: the agent's own page, else its button, else nowhere. */
const linkOf = (doc: MicroApp, draft: boolean): { href: string; label: string | null } | null => {
  const href = entryHref('microApps', doc, draft) ?? (doc.cta?.label ? hrefOf(doc.cta.link as LinkValue) : null)
  return href ? { href, label: doc.cta?.label || null } : null
}

/** Summary, result and proof as one paragraph, the empty ones left out. */
const paragraphOf = (...parts: (string | null | undefined)[]): string | null =>
  parts.filter((p) => typeof p === 'string' && p.trim()).join(' ') || null

const CHANNELS: Record<string, string> = { whatsapp: 'WhatsApp', calls: 'Calls', web: 'Web' }

/**
 * The agent's steps, in Panel order. Where the field's text leaves out its
 * verb (the field label says it), the label leads, as on the agent's own
 * page ("Starts when: ..."). What the team controls comes last, labelled
 * unless it already says "Your team ...".
 */
const STEPS: [keyof MicroApp, string | null][] = [
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

const stepsOf = (doc: MicroApp, withTeam: boolean) =>
  STEPS.flatMap(([key, label], i) => {
    if (key === 'teamControls' && !withTeam) return []
    const text = doc[key]
    if (typeof text !== 'string' || !text.trim()) return []
    const lead = label && !SAYS_IT[key]?.test(text.trim()) ? `${label}: ` : ''
    return [{ id: `${doc.id}-${i}`, text: lead + text }]
  })

/**
 * A bot swarm agent as a Product suite card (a hub grouping section whose
 * design is one of the Product suite designs).
 *
 * - pills: its name, its steps as pills, and its summary, result and proof
 *   as one paragraph
 * - steps: a full-width card with its summary and result, the steps as a
 *   numbered flow, what the team controls in its own box, its proof as a
 *   note, and its picture beside them
 */
export const toSuiteProduct = (doc: MicroApp, draft = false, style: 'pills' | 'steps' = 'pills'): ProductSuiteProduct => {
  const link = linkOf(doc, draft)
  const base = { id: doc.id, name: doc.name, flag: flagOf(doc), linkHref: link?.href ?? null, linkLabel: link?.label ?? null }
  if (style === 'steps') {
    return {
      ...base,
      cardStyle: 'steps',
      summary: paragraphOf(doc.summary, doc.result),
      points: stepsOf(doc, false),
      teamControls: doc.teamControls || null,
      note: doc.proof || null,
      image: (doc.image as ProductSuiteProduct['image']) ?? null,
    }
  }
  return { ...base, summary: paragraphOf(doc.summary, doc.result, doc.proof), points: stepsOf(doc, true) }
}

/** A bot swarm agent as a Product suite 2 card: number, icon, name, summary and link. */
export const toSuite2Card = (doc: MicroApp, draft = false): ProductSuite2Card => {
  const link = linkOf(doc, draft)
  const flag = flagOf(doc)
  return {
    id: doc.id,
    icon: doc.icon || null,
    title: doc.name,
    description: paragraphOf(doc.summary, doc.result),
    link: link ? { url: link.href, label: link.label } : null,
    showNumber: true,
    tag: flag,
    showEyebrow: Boolean(flag),
  }
}

/**
 * A bot swarm agent as a Detailed product suite card: its channels as the
 * eyebrow, name, tagline, summary and result, its key points as highlights,
 * its icon as the watermark, and its link as the button.
 */
export const toDetailedCard = (doc: MicroApp, draft = false): DetailedProductSuiteCard => {
  const link = linkOf(doc, draft)
  return {
    id: doc.id,
    eyebrow: (doc.channel ?? []).map((c) => CHANNELS[c] ?? c).join(' and ') || null,
    title: doc.name,
    flag: flagOf(doc),
    tagline: doc.tagline || null,
    description: paragraphOf(doc.summary, doc.result),
    watermarkIcon: doc.icon || null,
    accentColor: 'crimson',
    highlights: (doc.keyPoints ?? []).filter((k) => k?.line).map((k, i) => ({ id: k.id || `${doc.id}-${i}`, label: k.line })),
    cta: link ? { url: link.href, label: link.label } : null,
  }
}

/**
 * A bot swarm agent as a Bento grid card, at the size its place in the
 * section's pattern gives it: icon, name, summary and picture. Wide or tall
 * cards add the result; tall cards add the key points as pills, or without
 * key points the steps as a list, so the extra height is not left empty.
 */
export const toBentoCard = (doc: MicroApp, size: BentoSize, draft = false): BentoGridCard => {
  const link = linkOf(doc, draft)
  const flag = flagOf(doc)
  const large = Number(size.colSpan) >= 8 || Number(size.rowSpan) >= 2
  const tall = Number(size.rowSpan) >= 2
  const keyPoints = (doc.keyPoints ?? []).filter((k) => k?.line).map((k) => ({ id: k.id, text: k.line }))
  const points = keyPoints.length ? keyPoints : stepsOf(doc, false)
  const image = doc.image && typeof doc.image === 'object' ? (doc.image as BentoGridCard['image']) : null
  return {
    id: doc.id,
    icon: doc.icon || null,
    title: doc.name,
    titleSize: large ? 'large' : 'regular',
    body: paragraphOf(doc.summary, large ? doc.result : null),
    image,
    imagePosition: 'top',
    colSpan: size.colSpan,
    rowSpan: size.rowSpan,
    tabletColSpan: 'auto',
    link: link ? { url: link.href, label: link.label } : null,
    tag: flag,
    showEyebrow: Boolean(flag),
    points: tall ? points : null,
    showPoints: tall && points.length > 0,
    listStyle: keyPoints.length ? 'pills' : 'bullets',
  }
}
