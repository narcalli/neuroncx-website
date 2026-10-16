import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { BotSwarmHub } from '@/components/botSwarm/BotSwarmHub'
import { loadMicroAppsMaster } from '@/utilities/microApps'

/**
 * Preview of the bot swarm hub from the main bot swarm master record. Kept
 * off the menu and out of search; /bot-swarm itself stays the CMS page.
 */

export async function generateMetadata(): Promise<Metadata> {
  const m = await loadMicroAppsMaster()
  return {
    title: m?.meta?.title || m?.h1 || 'Bot swarm',
    description: m?.meta?.description || undefined,
    robots: { index: false, follow: false },
  }
}

export default async function BotSwarmPreviewPage() {
  const m = await loadMicroAppsMaster()
  if (!m) notFound()
  return <BotSwarmHub record={m} />
}
