import type { AgenticFlowDemoBlock } from '@/payload-types'
import { entryHref } from '@/utilities/content'

import type { EventLink } from './FlowDemo'

type DemoEvent = NonNullable<AgenticFlowDemoBlock['events']>[number]

/**
 * Each Flow mode event's link under the resolve card, by event id: its text
 * and where it goes. A page goes to its slug (home to /); an agent goes to
 * its own page, so only once it has one; a URL as written. A link with no
 * text, or nowhere to go, is left out.
 */
export const eventLinks = (events: DemoEvent[] | null | undefined, draft = false): Record<string, EventLink> => {
  const out: Record<string, EventLink> = {}
  for (const e of events ?? []) {
    const link = e?.link
    const label = link?.label?.trim()
    if (!e?.id || !link || !label) continue
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
    if (href) out[e.id] = { label, href, newTab: Boolean(link.newTab) }
  }
  return out
}
