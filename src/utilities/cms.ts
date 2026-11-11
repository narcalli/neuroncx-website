/**
 * Talks to the Payload CMS over HTTP.
 *
 * Replaces the direct `payload.find()` calls the site used when the CMS lived
 * in the same app. Everything here runs on the server — none of it should be
 * imported into a 'use client' component.
 */

import { notFound } from 'next/navigation'
import { cache } from 'react'

import { getPayloadURL } from './getURL'
import { currentVersionTarget } from './versionCookie'

type Query = Record<string, string | number | boolean | undefined>

const buildUrl = (path: string, query?: Query): string => {
  // Throws when no CMS address is set; request() catches it and returns null.
  const url = new URL(path.replace(/^\//, ''), `${getPayloadURL()}/`)
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

// Draft requests come from preview, where an editor expects to see work that
// is not published yet. The CMS only shows drafts to a signed-in user, so a
// draft request carries this API key when it is set. It stays on the server:
// never rename it with a NEXT_PUBLIC_ prefix. Without it, preview shows
// published content only, as before.
const PREVIEW_API_KEY = process.env.CMS_PREVIEW_API_KEY

// Failed CMS requests in this render. React's cache() keeps one count per
// server request, so a route can tell "not in the CMS" from "the CMS did not
// answer". Outside a render (route handlers) each call gets a fresh count,
// which nothing reads.
const failures = cache(() => ({ count: 0 }))

// A 4xx is the CMS answering (a missing route, a refused read); these mean it
// did not, or could not right now.
const isOutage = (status: number) => status >= 500 || status === 408 || status === 429

/** Thrown in place of a 404 when the page could not be looked up at all. */
export class CmsUnavailableError extends Error {
  constructor() {
    super('The CMS did not answer, so this page could not be looked up.')
    this.name = 'CmsUnavailableError'
  }
}

/**
 * notFound(), unless a CMS request failed in this render: then the page may
 * well exist, and a 404 would be cached by the CDN and shown to everyone for
 * minutes. It throws instead, so the route's error page shows, uncached.
 */
// A declaration, not an arrow function: TypeScript only narrows after a call
// that returns never when it is one.
export function notFoundUnlessCmsDown(): never {
  if (failures().count > 0) throw new CmsUnavailableError()
  notFound()
}

const request = async <T>(path: string, query?: Query, opts: FetchOptions = {}): Promise<T | null> => {
  const { revalidate = 60, tags, draft } = opts

  try {
    const res = await fetch(buildUrl(path, query), {
      headers: {
        'Content-Type': 'application/json',
        ...(draft && PREVIEW_API_KEY ? { Authorization: `users API-Key ${PREVIEW_API_KEY}` } : {}),
      },
      // A draft request must never be served from cache.
      ...(draft
        ? { cache: 'no-store' as const }
        : { next: { revalidate, ...(tags ? { tags } : {}) } }),
    })

    if (!res.ok) {
      console.error(`CMS ${res.status} for ${path}`)
      if (isOutage(res.status)) failures().count++
      return null
    }

    const data = (await res.json()) as T
    return draft ? withPreviewedVersion(path, query, data) : data
  } catch (err) {
    console.error(`CMS request failed for ${path}:`, err)
    failures().count++
    return null
  }
}

type VersionDoc = { parent: string; doc: Record<string, unknown> }

/**
 * One version of an entry, as the CMS History tab's Preview shows it: its
 * content at that point, populated to the same depth as the page asks for.
 * Needs the preview API key, like any draft. Fetched once per request.
 */
export const getVersion = cache(
  async (collection: string, versionId: string, depth: number): Promise<VersionDoc | null> => {
    if (!PREVIEW_API_KEY) return null
    try {
      const res = await fetch(buildUrl(`/api/${collection}/versions/${versionId}`, { depth }), {
        headers: { 'Content-Type': 'application/json', Authorization: `users API-Key ${PREVIEW_API_KEY}` },
        cache: 'no-store',
      })
      if (!res.ok) {
        console.error(`CMS ${res.status} for version ${versionId} of ${collection}`)
        return null
      }
      const json = (await res.json()) as { parent?: unknown; version?: Record<string, unknown> }
      const parent = typeof json.parent === 'object' && json.parent ? (json.parent as { id?: unknown }).id : json.parent
      return parent && json.version ? { parent: String(parent), doc: json.version } : null
    } catch (err) {
      console.error(`CMS request failed for version ${versionId} of ${collection}:`, err)
      return null
    }
  },
)

/**
 * In an old-version preview (utilities/versionCookie.ts), the previewed entry
 * in a draft list from its collection becomes that version, keeping its id.
 * Every other entry, and every other request, is left as it was.
 */
const withPreviewedVersion = async <T>(path: string, query: Query | undefined, data: T): Promise<T> => {
  const docs = (data as { docs?: unknown })?.docs
  if (!Array.isArray(docs)) return data
  const target = await currentVersionTarget()
  if (!target || path.replace(/^\//, '') !== `api/${target.collection}`) return data
  const version = await getVersion(target.collection, target.id, Number(query?.depth ?? 2))
  if (!version) return data
  return {
    ...data,
    docs: docs.map((d: { id?: unknown }) =>
      String(d?.id) === version.parent ? { ...version.doc, id: d.id } : d,
    ),
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
