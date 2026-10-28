import React from 'react'

import type { SwarmDiagramBlock as Props } from '@/payload-types'
import { getEntries, isDraft } from '@/utilities/content'

import { buildPairs, factFallback, type Agent } from './geometry'
import { SwarmDiagramClient } from './Diagram'

/**
 * The bot swarm diagram (docs/motion/bot-swarm-motion-demo.html, the swarm
 * section): every live and pilot microApps entry, read here, drawn on a
 * ring around the shared customer record by Diagram.tsx.
 */
export const SwarmDiagramBlock: React.FC<Props> = async ({ eyebrow, heading, intro, facts, caption, motion, autoplay, loop }) => {
  const draft = await isDraft()
  const entries = await getEntries('microApps', { limit: 100 }, draft)
  const agents: Agent[] = entries.map((e) => ({
    id: e.id,
    name: e.name,
    familyName: e.family && typeof e.family === 'object' ? e.family.name : null,
    passesTo: (e.passesTo ?? []).map((p) => (typeof p === 'object' ? p.id : p)),
  }))
  const pairs = buildPairs(agents)
  const rows = (facts ?? []).map((f, i) => ({ value: f.value?.trim() || factFallback(i, agents), label: f.label }))

  if (!agents.length) return null

  return (
    <SwarmDiagramClient
      eyebrow={eyebrow}
      heading={heading}
      intro={intro}
      facts={rows}
      caption={caption}
      agents={agents}
      pairs={pairs}
      motion={motion}
      autoplay={autoplay}
      loop={loop}
    />
  )
}
