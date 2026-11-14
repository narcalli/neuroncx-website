import type { AgenticFlowDemoBlock, List, MicroApp } from '@/payload-types'

import { resolveLink } from './eventLinks'
import type { EventLink } from './FlowDemo'

/**
 * Agent features mode, as plain data for the page: the families to offer,
 * each with its Live and Pilot agents, by order. Built on the server from
 * the agents themselves, so the block holds no agent copy. Groups mode fills
 * the same shape from what is typed on the block (groupsToFamilies).
 */

export type FeatureAgent = {
  id: string
  name: string
  pilot: boolean
  summary: string | null
  /** "Works on WhatsApp", "Works on call recordings". */
  channels: string[]
  /** Up to 3. */
  keyPoints: string[]
  /** The agent hands over to a person (its handsOver field is filled). */
  humanTeam: boolean
  records: string | null
  teamControls: string | null
  // Groups mode. Each one, when absent, leaves the item as Agent features draws it.
  /** The item button's chip, in place of "Pilot". */
  chip?: string | null
  /** The second card's pills. Absent: the Virtual agent pill, and Human team after a hand-over. */
  handlerTags?: ('agent' | 'human')[]
  /** The third card's icon, from the site's icon library (BlockIcon). */
  icon?: string | null
  /** A link under the third card. */
  link?: EventLink | null
}

export type FeatureFamily = { id: string; name: string; agents: FeatureAgent[] }

const CHANNEL_TAGS: Record<string, string> = {
  whatsapp: 'Works on WhatsApp',
  calls: 'Works on call recordings',
}

const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)

/** Only Live and Pilot agents are shown, in a draft preview too. */
export const isShownAgent = (doc: Pick<MicroApp, 'status'>): boolean => doc.status === 'live' || doc.status === 'pilot'

export const toFeatureAgent = (doc: MicroApp): FeatureAgent => ({
  id: doc.id,
  name: doc.name,
  pilot: doc.status === 'pilot',
  summary: text(doc.summary),
  channels: (doc.channel ?? []).map((c) => CHANNEL_TAGS[c]).filter((t): t is string => Boolean(t)),
  keyPoints: (doc.keyPoints ?? [])
    .map((k) => text(k?.line))
    .filter((l): l is string => Boolean(l))
    .slice(0, 3),
  humanTeam: Boolean(text(doc.handsOver)),
  records: text(doc.records),
  teamControls: text(doc.teamControls),
})

const idOf = (v: unknown): string | null =>
  typeof v === 'string' ? v : v && typeof v === 'object' && 'id' in v ? String((v as { id: unknown }).id) : null

/**
 * The industries a block shows agents for: its chosen ones when "Show agents
 * for" is Chosen industries, else none, which means every agent.
 */
export const chosenIndustries = (block: { agentsFor?: string | null; industries?: string[] | null }): string[] =>
  block.agentsFor === 'industries' ? (block.industries ?? []).filter(Boolean) : []

/** Whether an agent is used in at least one of the industries; any agent when none are chosen. */
export const inIndustries = (doc: Pick<MicroApp, 'verticals'>, industries: readonly string[]): boolean =>
  !industries.length || (doc.verticals ?? []).some((v) => industries.includes(v))

/**
 * The families to show: the block's picks in their order, else every family
 * by order. Each gets its shown agents, in the order they arrive (order,
 * then name), limited to the chosen industries when there are any. A family
 * with no agent to show is left out.
 */
export const featureFamilies = (
  picked: unknown[] | null | undefined,
  lists: Pick<List, 'id' | 'name'>[],
  agents: MicroApp[],
  industries: readonly string[] = [],
): FeatureFamily[] => {
  const pickedIds = (picked ?? []).map(idOf).filter((id): id is string => Boolean(id))
  const families = pickedIds.length
    ? pickedIds.map((id) => lists.find((l) => l.id === id)).filter((l): l is Pick<List, 'id' | 'name'> => Boolean(l))
    : lists
  return families
    .map((f) => ({
      id: f.id,
      name: f.name,
      agents: agents
        .filter((a) => isShownAgent(a) && inIndustries(a, industries) && idOf(a.family) === f.id)
        .map(toFeatureAgent),
    }))
    .filter((f) => f.agents.length)
}

type Group = NonNullable<AgenticFlowDemoBlock['groups']>[number]

/**
 * Groups mode: the groups and items typed on the block, as families and
 * agents. Tags are the item's own words, not channel names; every feature
 * line is kept. An id is the panel's DOM id, its button's aria-controls and
 * the key its animations follow, so ids are unique across all groups: the
 * rows' own ids, else their position.
 */
export const groupsToFamilies = (groups: Group[] | null | undefined, draft = false): FeatureFamily[] => {
  const used = new Set<string>()
  const unique = (id: string | null | undefined, fallback: string) => {
    let key = id || fallback
    while (used.has(key)) key = `${key}-${used.size}`
    used.add(key)
    return key
  }
  return (groups ?? []).flatMap((group, gi) => {
    const name = text(group?.label)
    if (!name) return []
    const agents = (group.items ?? []).flatMap((item, ii): FeatureAgent[] => {
      const itemName = text(item?.name)
      if (!itemName) return []
      return [
        {
          id: unique(item.id, `group-${gi + 1}-item-${ii + 1}`),
          name: itemName,
          pilot: false,
          summary: text(item.summary),
          channels: (item.tags ?? []).map((t) => text(t?.label)).filter((t): t is string => Boolean(t)),
          keyPoints: (item.features ?? []).map((f) => text(f?.line)).filter((l): l is string => Boolean(l)),
          humanTeam: false,
          records: text(item.lands),
          teamControls: text(item.youSet),
          chip: text(item.chip),
          handlerTags: (item.handlerTags ?? []).filter((h): h is 'agent' | 'human' => h === 'agent' || h === 'human'),
          icon: text(item.icon),
          link: resolveLink(item.link, draft),
        },
      ]
    })
    return agents.length ? [{ id: unique(group.id, `group-${gi + 1}`), name, agents }] : []
  })
}
