import type { Metadata } from 'next'
import React from 'react'

import { HubPage, hubMetadata } from '@/components/sections/HubPage'
import { getHub, isDraft } from '@/utilities/content'

import CmsPage, { generateMetadata as cmsMetadata } from '../[slug]/page'

const COLLECTION = 'microApps' as const

/**
 * The bot swarm hub, from its hub record in the CMS (Hubs, for Bot swarm).
 *
 * Until a hub is published, this address keeps showing the CMS page with
 * slug bot-swarm, so the switch is safe in either order: content first or
 * code first. In draft mode the latest hub draft is shown.
 */

export const dynamic = 'force-dynamic'

const cmsArgs = { params: Promise.resolve({ slug: 'bot-swarm' }) }

export async function generateMetadata(): Promise<Metadata> {
  const hub = await getHub(COLLECTION, await isDraft())
  return hub ? hubMetadata(hub, COLLECTION) : cmsMetadata(cmsArgs)
}

export default async function BotSwarmPage() {
  const draft = await isDraft()
  const hub = await getHub(COLLECTION, draft)
  if (!hub) return CmsPage(cmsArgs)
  return <HubPage hub={hub} collection={COLLECTION} draft={draft} />
}
