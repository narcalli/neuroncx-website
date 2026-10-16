import type { AgentFamily, MicroApp, MicroAppsMaster } from '@/payload-types'
import { CMS_TAG, getMany } from '@/utilities/cms'

/**
 * Reads the bot swarm from the CMS: the master records (hub copy and agent
 * page labels), the agent families and the agents (micro-apps). Server only.
 *
 * Visitors only ever get published Live and Pilot agents and published
 * families and master records; the CMS enforces the same, so these filters
 * are a second line of defence. Planned agents never arrive, and a linked
 * planned agent comes back as a bare id, which the pages drop.
 */

type Ref = string | { id: string } | null | undefined

// A linked entry arrives as its id or, when read with depth, as the whole
// entry. Either way only the id is needed.
export const idOf = (v: Ref): string | null =>
  typeof v === 'string' ? v : v && typeof v === 'object' ? v.id : null

export const idsOf = (list?: Ref[] | null): string[] =>
  (list || []).map(idOf).filter((id): id is string => Boolean(id))

/** The populated entries of a relationship field, dropping bare ids. */
export const populated = <T extends { id: string }>(
  list?: (string | T | null | undefined)[] | null,
): T[] => (list || []).filter((x): x is T => Boolean(x && typeof x === 'object'))

const byOrderThenName = (
  a: { order?: number | null; name: string },
  b: { order?: number | null; name: string },
) => (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name)

/** A live or pilot agent, as visitors may see it. */
export const isPublicAgent = (a?: Partial<MicroApp> | null): a is MicroApp =>
  Boolean(
    a &&
    a.name &&
    (a.status === 'live' || a.status === 'pilot') &&
    (a._status ?? 'published') === 'published',
  )

/**
 * The main bot swarm master record (Is main on), or, with a slug, the
 * published record with that slug.
 */
export const loadMicroAppsMaster = async (slug?: string): Promise<MicroAppsMaster | null> => {
  const docs = await getMany<MicroAppsMaster>(
    'microAppsMaster',
    {
      ...(slug ? { 'where[slug][equals]': slug } : { 'where[isMain][equals]': true }),
      'where[_status][equals]': 'published',
      limit: 1,
      depth: 2,
    },
    { tags: [CMS_TAG, 'micro-apps-master'] },
  )
  return docs[0] || null
}

/** Published agent families, by order then name. */
export const loadAgentFamilies = async (): Promise<AgentFamily[]> => {
  const docs = await getMany<AgentFamily>(
    'agentFamilies',
    { 'where[_status][equals]': 'published', sort: 'order,name', limit: 100, depth: 0 },
    { tags: [CMS_TAG, 'agent-families'] },
  )
  return [...docs].sort(byOrderThenName)
}

/** Which agents a hub shows: the master record's filter. Empty means every agent. */
export type AgentFilter = {
  families?: Ref[] | null
  sectors?: Ref[] | null
  channel?: string[] | null
}

const publicAgents = {
  'where[status][in]': 'live,pilot',
  'where[_status][equals]': 'published',
}

/** Live and pilot agents, by order then name, narrowed by families, sectors and channel. */
export const loadAgents = async (filter: AgentFilter = {}): Promise<MicroApp[]> => {
  const query: Record<string, string | number> = {
    ...publicAgents,
    sort: 'order,name',
    limit: 200,
    depth: 1,
  }
  const families = idsOf(filter.families)
  const sectors = idsOf(filter.sectors)
  const channel = (filter.channel || []).filter(Boolean)
  if (families.length) query['where[family][in]'] = families.join(',')
  if (sectors.length) query['where[verticals][in]'] = sectors.join(',')
  if (channel.length) query['where[channel][in]'] = channel.join(',')
  const docs = await getMany<MicroApp>('microApps', query, { tags: [CMS_TAG, 'micro-apps'] })
  return docs.filter(isPublicAgent).sort(byOrderThenName)
}

/** Live and pilot agents whose Passes to includes this agent, by order then name. */
export const loadAgentsPassingTo = async (id: string): Promise<MicroApp[]> => {
  const docs = await getMany<MicroApp>(
    'microApps',
    { ...publicAgents, 'where[passesTo][in]': id, sort: 'order,name', limit: 20, depth: 0 },
    { tags: [CMS_TAG, 'micro-apps'] },
  )
  return docs.filter(isPublicAgent).sort(byOrderThenName)
}

/** An agent with its own page: published, Live, Own page on. Otherwise null. */
export const loadAgent = async (slug: string): Promise<MicroApp | null> => {
  const docs = await getMany<MicroApp>(
    'microApps',
    {
      'where[slug][equals]': slug,
      'where[status][equals]': 'live',
      'where[_status][equals]': 'published',
      'where[hasOwnPage][equals]': true,
      limit: 1,
      depth: 2,
    },
    { tags: [CMS_TAG, 'micro-apps', `micro-app-${slug}`] },
  )
  return docs[0] || null
}

/**
 * The address of an agent's own page, or null when it has none. The page
 * exists only for a Live agent with Own page on and a slug; a Pilot agent
 * never has one.
 */
export const microAppHref = (a?: Partial<MicroApp> | null): string | null =>
  a && a.status === 'live' && a.hasOwnPage && a.slug ? `/bot-swarm/${a.slug}` : null
