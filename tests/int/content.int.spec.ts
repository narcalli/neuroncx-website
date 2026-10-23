import { describe, expect, it } from 'vitest'

import { fromMicroApp } from '@/components/cards/adapters/microApp'
import type { MicroApp } from '@/payload-types'
import { entryHref, isPublicEntry, publicEntries } from '@/utilities/content'

/**
 * What the bot swarm pages may show: published Live and Pilot entries for
 * visitors; in a draft preview, every entry, Planned ones flagged.
 */

const agent = (status: string, extra: Partial<MicroApp> = {}) =>
  ({ id: status, name: `Agent ${status}`, slug: `agent-${status}`, status, _status: 'published', hasOwnPage: true, ...extra }) as MicroApp

describe('visitors', () => {
  it('see published Live and Pilot entries only', () => {
    expect(isPublicEntry(agent('live'))).toBe(true)
    expect(isPublicEntry(agent('pilot'))).toBe(true)
    expect(isPublicEntry(agent('planned'))).toBe(false)
    expect(isPublicEntry(agent('live', { _status: 'draft' }))).toBe(false)
  })

  it('get no link to a Planned page', () => {
    expect(entryHref('microApps', agent('live'))).toBe('/bot-swarm/agent-live')
    expect(entryHref('microApps', agent('planned'))).toBeNull()
    expect(fromMicroApp(agent('planned')).href).toBeNull()
  })
})

describe('draft preview', () => {
  it('shows every entry, drafts and Planned included', () => {
    const list = [agent('live'), agent('pilot'), agent('planned', { _status: 'draft' })]
    expect(publicEntries(list).map((d) => d.status)).toEqual(['live', 'pilot'])
    expect(publicEntries(list, true).map((d) => d.status)).toEqual(['live', 'pilot', 'planned'])
  })

  it('links Planned entries with a page, and flags them on cards', () => {
    expect(fromMicroApp(agent('planned'), true)).toMatchObject({ flag: 'Planned', href: '/bot-swarm/agent-planned' })
    expect(fromMicroApp(agent('pilot'))).toMatchObject({ flag: 'Pilot' })
    expect(fromMicroApp(agent('live')).flag).toBeNull()
  })
})
