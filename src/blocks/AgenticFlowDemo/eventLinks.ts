import type { AgenticFlowDemoBlock } from '@/payload-types'
import { entryHref } from '@/utilities/content'

import type { EventLink } from './FlowDemo'

type DemoEvent = NonNullable<AgenticFlowDemoBlock['events']>[number]
type LinkValue = DemoEvent['link']

/**
 * One link's text and where it goes, or null. A page goes to its slug (home
 * to /); an agent goes to its own page, so only once it has one; a URL as
 * written. A link with no text, or nowhere to go, is null. Flow mode's event
 * links and Groups mode's item links are the same field.
 */
export const resolveLink = (link: LinkValue | null | undefined, draft = false): EventLink | null => {
  const label = link?.label?.trim()
  if (!link || !label) return null
  let href: string | null = null
  if (link.type === 'custom') {
    href = link.url?.trim() || null
  } else {
    const ref = link.reference
    const doc = ref?.value
    if (doc && typeof doc === 'object') {
      if (ref.relationTo === 'pages') href = 'slug' in doc && doc.slug ? (doc.slug === 'home' ? '/' : `/${doc.slug}`) : null
      else if (ref.relationTo === 'microApps') href = entryHref('microApps', doc as never, draft)
    }
  }
  return href ? { label, href, newTab: Boolean(link.newTab) } : null
}

/** Each Flow mode event's link under the resolve card, by event id (resolveLink). */
export const eventLinks = (events: DemoEvent[] | null | undefined, draft = false): Record<string, EventLink> => {
  const out: Record<string, EventLink> = {}
  for (const e of events ?? []) {
    if (!e?.id) continue
    const link = resolveLink(e.link, draft)
    if (link) out[e.id] = link
  }
  return out
}
