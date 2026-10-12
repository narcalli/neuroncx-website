import { draftMode } from 'next/headers'

import type { Integration, IntegrationsBlock } from '@/payload-types'
import { CMS_TAG, getMany } from '@/utilities/cms'

/**
 * The "Show" switch shared by every block that lists integrations
 * (Integrations, Integrations Marquee, Partner Strip). Server only.
 */
export type IntegrationSource = Pick<
  IntegrationsBlock,
  'populateBy' | 'categories' | 'products' | 'featuredOnly' | 'selectedDocs' | 'limit'
>

/** Blocks saved before populateBy existed have no value: they use their own typed list. */
export const usesCollection = (populateBy?: IntegrationSource['populateBy']): boolean =>
  Boolean(populateBy) && populateBy !== 'manual'

// A linked entry arrives as its id or, when the page was read with depth, as
// the whole entry. Either way only the id is needed.
const idOf = (v: string | { id: string } | null | undefined): string | null =>
  typeof v === 'string' ? v : v && typeof v === 'object' ? v.id : null

const idsOf = (list?: (string | { id: string } | null)[] | null): string[] =>
  (list || []).map(idOf).filter((id): id is string => Boolean(id))

const byOrderThenName = (a: Integration, b: Integration) =>
  (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name)

/**
 * Entries from the Integrations collection, for a block whose switch is not
 * manual. Only Live entries are ever asked for. Outside preview only published
 * ones are, and the CMS enforces the same for visitors. In preview, drafts are
 * included so an editor can check a new entry before publishing it.
 *
 * max is the block's own ceiling (24, 40 or 8); the editor's "How many" can
 * only lower it.
 */
export const loadIntegrations = async (source: IntegrationSource, max: number): Promise<Integration[]> => {
  const draft = (await draftMode()).isEnabled
  const query: Record<string, string | number | boolean | undefined> = {
    'where[status][equals]': 'live',
    depth: 1,
    ...(draft ? { draft: 'true' } : { 'where[_status][equals]': 'published' }),
  }
  const opts = { draft, tags: [CMS_TAG, 'integrations'] }

  if (source.populateBy === 'selection') {
    // Hand-picked: fetch just those, then put them back in the editor's order.
    const ids = (source.selectedDocs || []).map(idOf).filter((id): id is string => Boolean(id)).slice(0, max)
    if (!ids.length) return []
    const docs = await getMany<Integration>(
      'integrations',
      { ...query, 'where[id][in]': ids.join(','), limit: ids.length },
      opts,
    )
    const found = new Map(docs.map((d) => [d.id, d]))
    return ids.map((id) => found.get(id)).filter((d): d is Integration => Boolean(d))
  }

  // Categories and products are linked entries; the CMS filters by their ids.
  if (source.populateBy === 'filter') {
    const categories = idsOf(source.categories)
    const products = idsOf(source.products)
    if (categories.length) query['where[category][in]'] = categories.join(',')
    if (products.length) query['where[products][in]'] = products.join(',')
  }
  if (source.featuredOnly) query['where[featured][equals]'] = true
  query.sort = 'order,name'
  query.limit = Math.min(Math.max(source.limit || max, 1), max)

  const docs = await getMany<Integration>('integrations', query, opts)
  return [...docs].sort(byOrderThenName)
}
