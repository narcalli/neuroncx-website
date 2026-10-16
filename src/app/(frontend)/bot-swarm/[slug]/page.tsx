import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { AgentPage } from '@/components/botSwarm/AgentPage'
import { BotSwarmHub } from '@/components/botSwarm/BotSwarmHub'
import type { MicroApp, MicroAppsMaster } from '@/payload-types'
import { loadAgent, loadMicroAppsMaster } from '@/utilities/microApps'
import { ownPageMeta } from '@/utilities/ownPageMeta'

type Args = { params: Promise<{ slug: string }> }

/**
 * /bot-swarm/<slug>: a published bot swarm master record that is not the
 * main one, as a hub narrowed by its filter; otherwise an agent's own page
 * (published, Live, Own page on); otherwise a 404. The main record is not
 * served here: /bot-swarm stays the CMS page.
 */

type Resolved = { hub: MicroAppsMaster } | { agent: MicroApp } | null

const resolve = async (slug: string): Promise<Resolved> => {
  const hub = await loadMicroAppsMaster(slug)
  if (hub && !hub.isMain) return { hub }
  const agent = await loadAgent(slug)
  return agent ? { agent } : null
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const found = await resolve(slug)
  if (!found) return {}
  const path = `/bot-swarm/${slug}`
  if ('hub' in found) {
    const m = found.hub
    return ownPageMeta({
      title: m.meta?.title || m.h1,
      description: m.meta?.description,
      image: m.meta?.image as any,
      path,
    })
  }
  const a = found.agent
  return ownPageMeta({
    title: a.meta?.title || a.heroHeading || a.name,
    description: a.meta?.description || a.summary,
    image: a.meta?.image as any,
    path,
  })
}

export default async function BotSwarmSlugPage({ params }: Args) {
  const { slug } = await params
  const found = await resolve(slug)
  if (!found) notFound()
  if ('hub' in found) return <BotSwarmHub record={found.hub} />
  return <AgentPage agent={found.agent} master={await loadMicroAppsMaster()} />
}
