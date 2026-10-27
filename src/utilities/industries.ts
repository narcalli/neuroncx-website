import { cache } from 'react'

import type { IndustryTopic, Sector } from '@/payload-types'
import { CMS_TAG, getMany } from '@/utilities/cms'

/**
 * Industries (CMS slug sectors) and industry topics: their pages live at
 * /{industry} and /{industry}/{topic}, at the path the CMS stores
 * (neuroncx-cms src/content/paths.ts). Server only.
 *
 * Outside draft mode: published entries with status Live or Pilot and Own
 * page on. In draft mode: the latest draft of each, any status.
 */

export type IndustryCollection = 'sectors' | 'industryTopics'

/** Cache tags: everything from the CMS, all content, and this collection (api/revalidate). */
export const industryTags = (collection: IndustryCollection): string[] => [CMS_TAG, 'content', `content-${collection}`]

const shownEntries = (draft: boolean): Record<string, string> =>
  draft ? { draft: 'true' } : { 'where[_status][equals]': 'published', 'where[status][in]': 'live,pilot' }

const byPath = async <T>(collection: IndustryCollection, path: string, draft: boolean): Promise<T | null> =>
  (
    await getMany<T>(
      collection,
      { ...shownEntries(draft), 'where[path][equals]': path, 'where[hasOwnPage][equals]': true, limit: 1, depth: 2 },
      { draft, tags: industryTags(collection) },
    )
  )[0] ?? null

/** The industry whose page is at this path, or null. */
export const getIndustryByPath = cache((path: string, draft: boolean) => byPath<Sector>('sectors', path, draft))

/** The industry topic whose page is at this path, or null. */
export const getTopicByPath = cache((path: string, draft: boolean) => byPath<IndustryTopic>('industryTopics', path, draft))

/** The topics with a page under an industry, in stage order. */
export const getIndustryTopicPages = (industryId: string, draft: boolean): Promise<IndustryTopic[]> =>
  getMany<IndustryTopic>(
    'industryTopics',
    { ...shownEntries(draft), 'where[industry][equals]': industryId, 'where[hasOwnPage][equals]': true, sort: 'stageOrder', limit: 100, depth: 0 },
    { draft, tags: industryTags('industryTopics') },
  )

/** Every page of both collections, for the sitemap. */
export const getIndustryPages = async (collection: IndustryCollection): Promise<(Sector | IndustryTopic)[]> =>
  getMany<Sector | IndustryTopic>(
    collection,
    { ...shownEntries(false), 'where[hasOwnPage][equals]': true, limit: 500, depth: 0 },
    { tags: industryTags(collection) },
  )

/**
 * An industry's own page address, when a visitor can reach it: Own page on,
 * and outside draft mode published and Live or Pilot.
 */
export const industryHref = (industry: unknown, draft = false): string | null => {
  if (!industry || typeof industry !== 'object') return null
  const d = industry as Partial<Sector>
  const shown = draft || ((d._status ?? 'published') === 'published' && (d.status === 'live' || d.status === 'pilot'))
  return shown && d.hasOwnPage && typeof d.path === 'string' && d.path ? d.path : null
}
