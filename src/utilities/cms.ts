/**
 * Talks to the Payload CMS over HTTP.
 *
 * Replaces the direct `payload.find()` calls the site used when the CMS lived
 * in the same app. Everything here runs on the server — none of it should be
 * imported into a 'use client' component.
 */

const CMS_URL = process.env.CMS_URL || 'http://localhost:3001'

type Query = Record<string, string | number | boolean | undefined>

const buildUrl = (path: string, query?: Query): string => {
  const url = new URL(path.replace(/^\//, ''), CMS_URL.replace(/\/?$/, '/'))
  if (query) {
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null) url.searchParams.append(k, String(v))
    })
  }
  return url.toString()
}

type FetchOptions = {
  /** Seconds before the cached copy is considered stale. 0 disables caching. */
  revalidate?: number
  /** Cache tag, so a webhook from the CMS can clear just this content. */
  tags?: string[]
  draft?: boolean
}

const request = async <T>(path: string, query?: Query, opts: FetchOptions = {}): Promise<T | null> => {
  const { revalidate = 60, tags, draft } = opts

  try {
    const res = await fetch(buildUrl(path, query), {
      headers: { 'Content-Type': 'application/json' },
      // A draft request must never be served from cache.
      ...(draft
        ? { cache: 'no-store' as const }
        : { next: { revalidate, ...(tags ? { tags } : {}) } }),
    })

    if (!res.ok) {
      console.error(`CMS ${res.status} for ${path}`)
      return null
    }

    return (await res.json()) as T
  } catch (err) {
    console.error(`CMS request failed for ${path}:`, err)
    return null
  }
}

export type Paginated<T> = {
  docs: T[]
  totalDocs: number
  totalPages: number
  page: number
  hasNextPage: boolean
  hasPrevPage: boolean
}

/** One document from a collection by slug, or null. */
export const getBySlug = async <T>(
  collection: string,
  slug: string,
  opts: FetchOptions & { depth?: number } = {},
): Promise<T | null> => {
  const { depth = 2, ...rest } = opts
  const data = await request<Paginated<T>>(
    `/api/${collection}`,
    {
      'where[slug][equals]': slug,
      limit: 1,
      depth,
      ...(rest.draft ? { draft: 'true' } : {}),
    },
    rest,
  )
  return data?.docs?.[0] || null
}

/** A page of documents from a collection. */
export const getMany = async <T>(
  collection: string,
  query: Query = {},
  opts: FetchOptions = {},
): Promise<T[]> => {
  const data = await request<Paginated<T>>(`/api/${collection}`, query, opts)
  return data?.docs || []
}

/**
 * Like getMany, but keeps the pagination envelope — needed wherever the page
 * renders page numbers or a total count.
 */
export const getPaginated = async <T>(
  collection: string,
  query: Query = {},
  opts: FetchOptions = {},
): Promise<Paginated<T>> => {
  const data = await request<Paginated<T>>(`/api/${collection}`, query, opts)
  return (
    data || {
      docs: [],
      totalDocs: 0,
      totalPages: 0,
      page: 1,
      hasNextPage: false,
      hasPrevPage: false,
    }
  )
}

/** A global — header, footer. */
export const getGlobal = async <T>(
  slug: string,
  opts: FetchOptions & { depth?: number } = {},
): Promise<T | null> => {
  const { depth = 2, ...rest } = opts
  return request<T>(`/api/globals/${slug}`, { depth }, rest)
}

/** Everything the CMS serves, for revalidation by tag. */
export const CMS_TAG = 'cms'
