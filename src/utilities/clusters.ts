import type { Page } from '@/payload-types'
import { CMS_TAG, getMany } from '@/utilities/cms'
import { pagePathOf } from '@/utilities/pages'

/**
 * Pillar and cluster pages: the pages under a pillar, grouped by stage for
 * the cluster links block, and the links at the foot of a cluster page.
 */

export type ClusterPage = Pick<Page, 'id' | 'title' | 'slug' | 'parent' | 'breadcrumbs' | 'meta' | 'stage' | 'stageOrder'> & {
  _status?: Page['_status']
  /** The address of an entry that is not a page, such as an industry topic. */
  href?: string | null
}

/** Where a cluster entry links to: its own address, else its page's. */
export const clusterHref = (page: ClusterPage): string | null => page.href || pagePathOf(page)

/** One page in the cluster, with the stage it is listed under. */
export type ClusterEntry = { page: ClusterPage; stage: string | null; stageOrder: number | null }

export type StageGroup = { stage: string | null; entries: ClusterEntry[] }

const orderOf = (n: number | null | undefined): number => (typeof n === 'number' && Number.isFinite(n) ? n : Infinity)
const stageOf = (s: string | null | undefined): string | null => (typeof s === 'string' && s.trim() ? s.trim() : null)

/**
 * The pages under a pillar: published ones, or in draft mode the latest
 * draft of each, in stage order.
 */
export const loadClusterPages = async (pillarId: string, draft: boolean): Promise<ClusterPage[]> =>
  getMany<ClusterPage>(
    'pages',
    {
      'where[parent][equals]': pillarId,
      sort: 'stageOrder',
      limit: 100,
      depth: 0,
      ...(draft ? { draft: 'true' } : {}),
    },
    { draft, tags: [CMS_TAG, `clusters-${pillarId}`] },
  )

/**
 * The cluster's pages grouped by stage: groups in the order of their first
 * stage order, pages by stage order then title. Pages with no stage come
 * last, in one group without a name. A page listed twice (under the pillar
 * and as an extra page) keeps its place under the pillar.
 */
export const clusterGroups = (entries: ClusterEntry[]): StageGroup[] => {
  const seen = new Set<string>()
  const unique = entries.filter((e) => {
    const id = String(e.page.id)
    if (seen.has(id)) return false
    seen.add(id)
    return Boolean(clusterHref(e.page))
  })
  const sorted = [...unique].sort(
    (a, b) => orderOf(a.stageOrder) - orderOf(b.stageOrder) || a.page.title.localeCompare(b.page.title),
  )
  const groups: StageGroup[] = []
  for (const entry of sorted) {
    const stage = stageOf(entry.stage)
    let group = groups.find((g) => g.stage === stage)
    if (!group) {
      group = { stage, entries: [] }
      groups.push(group)
    }
    group.entries.push(entry)
  }
  // The unnamed group goes last, whatever its pages' order.
  return [...groups.filter((g) => g.stage), ...groups.filter((g) => !g.stage)]
}

/**
 * The sibling with the next stage order after this page's, or null on the
 * last stage, or when this page has no stage order.
 */
export const nextStage = (page: ClusterPage, siblings: ClusterPage[]): ClusterPage | null => {
  const own = orderOf(page.stageOrder)
  if (own === Infinity) return null
  const later = siblings
    .filter((s) => String(s.id) !== String(page.id) && orderOf(s.stageOrder) > own && clusterHref(s))
    .sort((a, b) => orderOf(a.stageOrder) - orderOf(b.stageOrder) || a.title.localeCompare(b.title))
  return later[0] ?? null
}

/**
 * The "Back to" link of a cluster page: its pillar's address, named by the
 * pillar's primary keyword, else its title. An industry topic's pillar is
 * its industry (components/industry/TopicFooter.tsx). Read from the pillar record when
 * it arrived whole, else from the page's stored breadcrumbs.
 */
export const backLinkOf = (page: ClusterPage): { href: string; label: string } | null => {
  const pillar = page.parent && typeof page.parent === 'object' ? page.parent : null
  const crumb = page.breadcrumbs?.length && page.breadcrumbs.length > 1 ? page.breadcrumbs[0] : null
  const href = (pillar && clusterHref(pillar as ClusterPage)) || (crumb?.url ?? null)
  const label = pillar?.meta?.primaryKeyword?.trim() || pillar?.title?.trim() || crumb?.label?.trim() || null
  return href && label ? { href, label } : null
}
