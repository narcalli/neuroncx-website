import { timingSafeEqual } from 'crypto'
import { revalidatePath, revalidateTag } from 'next/cache'

import { CONTENT_COLLECTIONS } from '@/content/registry'

/**
 * Called by the CMS when content changes (neuroncx-cms
 * src/content/revalidate.ts), with the shared REVALIDATE_SECRET in the
 * x-revalidate-secret header and a JSON body:
 *
 *   { "paths": ["/bot-swarm/payment-services", "/bot-swarm"], "collection": "microApps" }
 *
 * Refreshes each path, and the collection's cached content so hub cards and
 * lists on other pages catch up. Anything else is refused.
 */

const MAX_PATHS = 50

/** Collections outside the content registry whose cached content is tagged content-{collection}. */
const TAGGED = ['sectors', 'industryTopics']

const secretMatches = (given: string | null): boolean => {
  const expected = process.env.REVALIDATE_SECRET
  if (!expected || !given) return false
  const a = Buffer.from(given)
  const b = Buffer.from(expected)
  return a.length === b.length && timingSafeEqual(a, b)
}

const json = (body: unknown, status: number) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } })

export async function POST(request: Request) {
  if (!secretMatches(request.headers.get('x-revalidate-secret'))) {
    return json({ error: 'Not allowed' }, 401)
  }

  let body: { paths?: unknown; collection?: unknown }
  try {
    body = await request.json()
  } catch {
    return json({ error: 'The body must be JSON' }, 400)
  }

  const paths = Array.isArray(body.paths) ? body.paths : []
  const valid = paths.filter(
    (p): p is string => typeof p === 'string' && p.startsWith('/') && !p.startsWith('//') && p.length <= 300,
  )
  if (valid.length !== paths.length || valid.length > MAX_PATHS) {
    return json({ error: `Paths must start with / and number ${MAX_PATHS} at most` }, 400)
  }

  for (const path of valid) revalidatePath(path)

  const collection = typeof body.collection === 'string' ? body.collection : null
  // The content collections, and industries and industry topics (utilities/industries.ts).
  const known = collection && (collection in CONTENT_COLLECTIONS || TAGGED.includes(collection))
  if (known) revalidateTag(`content-${collection}`, 'max')

  // Site Settings reach every page (the Animations switch, utilities/siteSettings.ts):
  // refresh the cached settings and everything under the root layout.
  if (collection === 'siteSettings') {
    revalidateTag('site-settings', 'max')
    revalidatePath('/', 'layout')
    return json({ revalidated: valid, tag: 'site-settings', layout: '/' }, 200)
  }

  return json({ revalidated: valid, ...(known ? { tag: `content-${collection}` } : {}) }, 200)
}
