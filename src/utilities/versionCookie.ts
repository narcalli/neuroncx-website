import { cookies, draftMode } from 'next/headers'
import { cache } from 'react'

/**
 * Old-version preview: the CMS History tab's Preview link opens
 * /next/preview with version=<collection>:<versionId>, which turns draft mode
 * on and keeps the version in this cookie. While both are on, that one entry
 * is shown as it was in that version (utilities/cms.ts and
 * utilities/versionPreview.ts); everything else on the page is the usual
 * draft preview. A normal preview link or Exit preview clears it.
 */

export const VERSION_COOKIE = 'ncx-version'

/** The collections whose History offers a Preview link (neuroncx-cms src/history). */
export const VERSION_COLLECTIONS = [
  'pages',
  'posts',
  'sectors',
  'industryTopics',
  'microApps',
  'hubs',
  'lists',
  'integrations',
  'customers',
] as const

export type VersionTarget = { collection: string; id: string; at: string | null }

/** The version and its date from a preview link, or null when either is not a real one. */
export const parseVersionParam = (version: string | null, at: string | null): VersionTarget | null => {
  const m = /^([A-Za-z]+):([a-f0-9]{24})$/.exec(version ?? '')
  if (!m || !(VERSION_COLLECTIONS as readonly string[]).includes(m[1])) return null
  const time = at ? Date.parse(at) : NaN
  return { collection: m[1], id: m[2], at: Number.isNaN(time) ? null : new Date(time).toISOString() }
}

export const encodeVersionTarget = (t: VersionTarget): string => [t.collection, t.id, t.at ?? ''].join('|')

export const decodeVersionTarget = (value: string | undefined): VersionTarget | null => {
  const [collection, id, at] = (value ?? '').split('|')
  return parseVersionParam(collection && id ? `${collection}:${id}` : null, at || null)
}

/** The version this request previews: only in draft mode, which needs the preview secret. */
export const currentVersionTarget = cache(async (): Promise<VersionTarget | null> => {
  try {
    if (!(await draftMode()).isEnabled) return null
    return decodeVersionTarget((await cookies()).get(VERSION_COOKIE)?.value)
  } catch {
    // Outside a request (a build, a sitemap): there is no preview.
    return null
  }
})
