import { draftMode } from 'next/headers'

import { CONTENT_COLLECTIONS, sectionKeyOf, type ContentCollectionSlug } from '@/content/registry'
import type { Hub, List, MicroApp } from '@/payload-types'
import { CMS_TAG, getMany } from '@/utilities/cms'

/**
 * Reads content collections and their hubs from the CMS (foundation.md in
 * the CMS docs, section 7.1). Server only.
 *
 * Outside draft mode: published only, entries with status Live or Pilot,
 * hubs that are published. The CMS enforces the same for visitors; the
 * queries say so too, so nothing else can slip through.
 *
 * In draft mode (entered through /next/preview with the preview secret):
 * the latest drafts of everything, Planned entries included, so an editor
 * can review before publishing. Draft requests are never cached, and only
 * see drafts when CMS_PREVIEW_API_KEY is set (utilities/cms.ts).
 */

export type ContentEntry = MicroApp

/** Whether this request is a draft preview. */
export const isDraft = async (): Promise<boolean> => (await draftMode()).isEnabled

/** Cache tags: everything from the CMS, all content, and this collection. */
export const contentTags = (collection: ContentCollectionSlug): string[] => [
  CMS_TAG,
  'content',
  `content-${collection}`,
]

const PUBLIC_ENTRY = {
  'where[_status][equals]': 'published',
  'where[status][in]': 'live,pilot',
} as const

/** Statuses a visitor sees, and what a draft preview adds. */
const SHOWN = ['live', 'pilot']
const SHOWN_IN_DRAFT = [...SHOWN, 'planned']

/**
 * Entries by order then name, depth 2: Live or Pilot and published, or in
 * draft mode the latest draft of every entry.
 */
export const getEntries = async (
  collection: ContentCollectionSlug,
  query: Record<string, string | number | boolean | undefined> = {},
  draft = false,
): Promise<ContentEntry[]> =>
  getMany<ContentEntry>(
    collection,
    { ...(draft ? { draft: 'true' } : PUBLIC_ENTRY), sort: 'order,name', limit: 100, depth: 2, ...query },
    { tags: contentTags(collection), draft },
  )

/** The entry with its own page at this slug, or null. */
export const getEntryPage = async (
  collection: ContentCollectionSlug,
  slug: string,
  draft = false,
): Promise<ContentEntry | null> =>
  (
    await getEntries(
      collection,
      { 'where[slug][equals]': slug, 'where[hasOwnPage][equals]': true, limit: 1 },
      draft,
    )
  )[0] ?? null

/** The collection's published hub record, or in draft mode its latest draft, or null. */
export const getHub = async (collection: ContentCollectionSlug, draft = false): Promise<Hub | null> =>
  (
    await getMany<Hub>(
      'hubs',
      {
        'where[forCollection][equals]': collection,
        ...(draft ? { draft: 'true' } : { 'where[_status][equals]': 'published' }),
        limit: 1,
        depth: 2,
      },
      { tags: [...contentTags(collection), 'hubs'], draft },
    )
  )[0] ?? null

/**
 * An entry that arrived as a whole record and may be shown: published, Live
 * or Pilot; in draft mode, any status, Planned included.
 */
export const isPublicEntry = (v: unknown, draft = false): v is ContentEntry =>
  Boolean(
    v &&
      typeof v === 'object' &&
      (draft ? SHOWN_IN_DRAFT : SHOWN).includes((v as ContentEntry).status) &&
      (draft || ((v as ContentEntry)._status ?? 'published') === 'published'),
  )

/** Populated entries from a relationship that may be shown, in its order. */
export const publicEntries = (list: unknown, draft = false): ContentEntry[] =>
  (Array.isArray(list) ? list : [])
    .map((v) => (v && typeof v === 'object' && 'value' in v ? (v as { value: unknown }).value : v))
    .filter((v): v is ContentEntry => isPublicEntry(v, draft))

/** An entry's own page, or null when it has none (in draft mode, Planned entries too). */
export const entryHref = (
  collection: ContentCollectionSlug,
  doc?: Partial<ContentEntry> | null,
  draft = false,
): string | null =>
  doc && (draft ? SHOWN_IN_DRAFT : SHOWN).includes(String(doc.status)) && doc.hasOwnPage && doc.slug
    ? `${CONTENT_COLLECTIONS[collection].route}/${doc.slug}`
    : null

/** The entry's grouping, when it arrived as a whole record. */
export const groupOf = (doc?: Partial<ContentEntry> | null): List | null =>
  doc?.family && typeof doc.family === 'object' ? (doc.family as List) : null

type LayoutBlock = NonNullable<ContentEntry['layout']>[number]

/**
 * The layout an entry page draws. While the entry uses the page defaults, the
 * published hub's default layout; otherwise, or with no published hub, the
 * entry's own layout field (the CMS keeps it equal to the default while the
 * entry follows it). Hidden rows are left out.
 */
export const effectiveLayout = (entry: ContentEntry, hub: Hub | null): LayoutBlock[] => {
  const fromHub = (hub?.defaultLayout ?? []) as unknown as LayoutBlock[]
  const blocks = entry.usePageDefaults !== false && fromHub.length ? fromHub : (entry.layout ?? [])
  return blocks.filter((b) => b && !(b as { hidden?: boolean | null }).hidden)
}

/** Whether a layout has a section, by key. */
export const hasSection = (blocks: { blockType?: string | null }[], key: string): boolean =>
  blocks.some((b) => sectionKeyOf(b.blockType) === key)

const isLocalHost = (host: string) =>
  ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1'].includes(host.toLowerCase())

/**
 * The public site address from NEXT_PUBLIC_SERVER_URL, or null when it is
 * unset or this machine, so no link points at localhost.
 */
export const siteOrigin = (): string | null => {
  const raw = process.env.NEXT_PUBLIC_SERVER_URL
  if (!raw) return null
  try {
    const url = new URL(raw)
    return isLocalHost(url.hostname) ? null : url.origin
  } catch {
    return null
  }
}

export { isLocalHost }
