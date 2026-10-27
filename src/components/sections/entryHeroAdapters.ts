import type { ComponentProps } from 'react'

import type { ConversationHeroBlock } from '@/blocks/ConversationHero/Component'
import type { HeroCustomBlock } from '@/blocks/HeroCustom/Component'
import type { HeroRightPlacementBlock } from '@/blocks/HeroRightPlacement/Component'
import type { StatHeroBlock } from '@/blocks/StatHero/Component'
import type { MicroApp } from '@/payload-types'
import { hrefOf, type LinkValue } from '@/utilities/cmsValues'
import { isPublicEntry } from '@/utilities/content'

/**
 * An entry's own page hero, by its hero design (heroDesign in the CMS's Own
 * page group, fields_reference.md section 4). The hero fields are written
 * once; each adapter maps them to the props of one existing hero block, so
 * the blocks stay exactly as they are on pages.
 *
 * - conversation: ConversationHero (chat, chips, chain as workflow steps, stats)
 * - rightPlacement: HeroRightPlacement (picture on the right, motion)
 * - stats: StatHero (2 to 4 stats)
 * - customCss: HeroCustom (the entry's own HTML and CSS visual, sanitised and
 *   sealed exactly as on the page block)
 */

export type HeroDesign = 'conversation' | 'rightPlacement' | 'stats' | 'customCss'

const DESIGNS: HeroDesign[] = ['conversation', 'rightPlacement', 'stats', 'customCss']

/** The entry's design; an entry saved before the field existed draws the conversation hero. */
export const heroDesignOf = (doc: { heroDesign?: string | null }): HeroDesign =>
  DESIGNS.includes(doc.heroDesign as HeroDesign) ? (doc.heroDesign as HeroDesign) : 'conversation'

/** A button: its label and where it goes. */
export type HeroButton = { label: string; href: string }

/** What every design shares, worked out once from the entry and the page. */
export type HeroInput = {
  entry: MicroApp
  /** The grouping's name: the eyebrow when the entry has none. */
  groupName?: string | null
  /** The page's main button: the entry's own, else the hub's, else contact. */
  primary: HeroButton
  /** The agents before and after this one in its chain, for the conversation hero's workflow steps. */
  chain?: { before: MicroApp[]; next: MicroApp[] }
  /** A draft preview: Planned agents may be named. */
  draft?: boolean
}

type ConversationProps = ComponentProps<typeof ConversationHeroBlock>
type RightPlacementProps = ComponentProps<typeof HeroRightPlacementBlock>
type StatsProps = ComponentProps<typeof StatHeroBlock>
type CustomProps = ComponentProps<typeof HeroCustomBlock>

const shared = ({ entry, groupName }: HeroInput) => ({
  eyebrow: entry.heroEyebrow || groupName || null,
  headline: entry.heroHeading || entry.name,
  subhead: entry.heroSubheading || entry.summary || null,
})

/** The second button, when it has a label and somewhere to go. */
export const secondaryOf = (entry: MicroApp): HeroButton | null => {
  const b = entry.heroSecondaryCta
  const href = b?.label ? hrefOf(b.link as LinkValue) : null
  return b?.label && href ? { label: b.label, href } : null
}

/** The chips: the entry's own, else its key points, 4 at most. */
export const chipsOf = (entry: MicroApp): { label: string }[] => {
  const own = (entry.heroChips ?? []).filter((c) => c?.label).map((c) => ({ label: c.label }))
  const from = own.length ? own : (entry.keyPoints ?? []).filter((k) => k?.line).map((k) => ({ label: k.line }))
  return from.slice(0, 4)
}

/** The stats with both a value and a label. */
export const statsOf = (entry: MicroApp) =>
  (entry.heroStats ?? []).filter((s) => s?.value && s?.label).map((s) => ({ value: s.value, label: s.label, id: s.id }))

/** One message per line, as the conversation hero reads it; a line break inside a message would split it. */
const oneLine = (text: string) => text.replace(/\s*\n\s*/g, ' ').trim()

/**
 * The chat as the conversation hero's lines: the customer's messages as
 * "them:", the business's and the team's as "us:", then the agents that
 * reply, named once each, in order, as "tag:" lines (listed under the chat:
 * the hero cannot show which agent sent which message).
 */
export const conversationLines = (entry: MicroApp, draft = false): string => {
  const rows = (entry.heroChat ?? []).filter((m) => m?.text?.trim())
  const agents = rows.flatMap((m) => {
    const agent = m.sender === 'business' && m.entry && typeof m.entry === 'object' ? m.entry.value : null
    return agent && typeof agent === 'object' && isPublicEntry(agent, draft) ? [agent.name] : []
  })
  return [
    ...rows.map((m) => `${m.sender === 'customer' ? 'them' : 'us'}: ${oneLine(m.text)}`),
    ...[...new Set(agents)].map((name) => `tag: ${name}`),
  ].join('\n')
}

/** This agent and the agents in its chain, by name and card icon, each once, in chain order. */
export const chainSteps = (entry: MicroApp, chain?: HeroInput['chain']) => {
  const seen = new Set<string>()
  return [...(chain?.before ?? []), entry, ...(chain?.next ?? [])]
    .filter((a) => a && !seen.has(a.id) && seen.add(a.id))
    .map((a) => ({ label: a.name, icon: a.icon || null, id: a.id }))
}

export const toConversationHero = (input: HeroInput): ConversationProps => {
  const { entry, primary, chain, draft } = input
  const secondary = secondaryOf(entry)
  return {
    ...shared(input),
    primaryButtonLabel: primary.label,
    primaryButtonLink: primary.href,
    secondaryButtonLabel: secondary?.label ?? null,
    secondaryButtonLink: secondary?.href ?? null,
    chips: chipsOf(entry),
    conversationLabel: entry.heroChatCaption || null,
    conversation: conversationLines(entry, draft),
    workflowSteps: entry.heroWorkflowFromChain ? chainSteps(entry, chain) : [],
    stats: statsOf(entry),
  }
}

export const toRightPlacementHero = (input: HeroInput): RightPlacementProps => {
  const { entry, primary } = input
  const secondary = secondaryOf(entry)
  const media = entry.heroMedia && typeof entry.heroMedia === 'object' ? entry.heroMedia : null
  return {
    ...shared(input),
    primaryCta: { type: 'custom', url: primary.href, label: primary.label },
    secondaryCta: secondary ? { type: 'custom', url: secondary.href, label: secondary.label } : null,
    media: media as RightPlacementProps['media'],
    mediaAlt: entry.heroMediaAlt || media?.alt || null,
    animation: entry.heroMotion === 'off' ? 'off' : 'on',
  }
}

export const toStatsHero = (input: HeroInput): StatsProps => {
  const { entry, primary } = input
  const secondary = secondaryOf(entry)
  return {
    ...shared(input),
    primaryLabel: primary.label,
    primaryLink: primary.href,
    secondaryLabel: secondary?.label ?? null,
    secondaryLink: secondary?.href ?? null,
    stats: statsOf(entry),
  }
}

/**
 * The Custom CSS visual design: the Hero (custom CSS) block with the entry's
 * eyebrow, heading, subheading, chips and buttons, and its visual on the
 * right, on the light stage. The block sanitises the HTML and CSS
 * (HeroCustom/safety.ts) and seals the visual, as on pages.
 */
export const toCustomHero = (input: HeroInput): CustomProps => {
  const { entry, primary } = input
  const secondary = secondaryOf(entry)
  const button = (b: HeroButton | null) => (b ? { label: b.label, type: 'custom' as const, url: b.href } : undefined)
  return {
    blockType: 'heroCustom',
    ...shared(input),
    primaryCta: button(primary),
    secondaryCta: button(secondary),
    chips: chipsOf(entry),
    visualPosition: 'right',
    split: '50',
    height: 'natural',
    phoneVisual: 'below',
    background: 'cloud',
    visualHtml: entry.visualHtml ?? null,
    visualCss: entry.visualCss ?? null,
    visualAlt: entry.visualAlt ?? null,
    aspect: entry.aspect ?? 'auto',
    maxWidth: entry.maxWidth ?? null,
  }
}
