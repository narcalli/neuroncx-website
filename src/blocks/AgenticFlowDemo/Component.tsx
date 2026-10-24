import { draftMode } from 'next/headers'
import React from 'react'

import type { AgenticFlowDemoBlock as AgenticFlowDemoProps, List, MicroApp } from '@/payload-types'
import { CMS_TAG, getMany } from '@/utilities/cms'
import { getEntries } from '@/utilities/content'

import { AgentFeatures } from './AgentFeatures'
import { featureFamilies } from './featureData'
import { FlowDemo } from './FlowDemo'

/**
 * The Agentic Flow Demo block. Flow mode (the default, and every block saved
 * before the mode existed) is the event walkthrough, unchanged. Agent
 * features mode reads the families and their Live and Pilot agents here, on
 * the server, so every agent is in the page's HTML; a draft preview reads
 * their latest drafts.
 */
export const AgenticFlowDemoBlock = async (props: AgenticFlowDemoProps) => {
  if (props.mode !== 'agentFeatures') return <FlowDemo {...props} />

  const draft = (await draftMode()).isEnabled
  const [lists, agents] = await Promise.all([
    getMany<List>(
      'lists',
      {
        'where[type][equals]': 'agentFamily',
        ...(draft ? { draft: 'true' } : { 'where[_status][equals]': 'published' }),
        sort: 'order',
        limit: 50,
        depth: 0,
      },
      { tags: [CMS_TAG, 'content', 'content-microApps'], draft },
    ),
    getEntries('microApps', { depth: 0 }, draft) as Promise<MicroApp[]>,
  ])

  return (
    <AgentFeatures
      heading={props.heading}
      intro={props.intro}
      families={featureFamilies(props.families, lists, agents)}
      pickFamilyLabel={props.pickFamilyLabel || 'Pick a family'}
      pickAgentLabel={props.pickAgentLabel || 'Agents'}
    />
  )
}
