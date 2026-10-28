import { draftMode } from 'next/headers'
import React from 'react'

import type { AgenticFlowDemoBlock as AgenticFlowDemoProps, List, MicroApp } from '@/payload-types'
import { CMS_TAG, getMany } from '@/utilities/cms'
import { getEntries } from '@/utilities/content'

import { AgentFeatures } from './AgentFeatures'
import { resolveDesign } from './design'
import { eventLinks } from './eventLinks'
import { chosenIndustries, featureFamilies, type FeatureFamily } from './featureData'
import { FlowDemo } from './FlowDemo'

/**
 * The Agentic Flow Demo block. Flow mode (the default, and every block saved
 * before the mode existed) is the event walkthrough. Agent features mode
 * reads the families and their Live and Pilot agents here, on the server, so
 * every agent is in the page's HTML; a draft preview reads their latest
 * drafts. Both modes take the Design tab's options (design.ts).
 */
/**
 * Agent features mode's families with their shown agents: the block's picks,
 * limited to its chosen industries when there are any. Also read by the
 * industry page's agents section (components/industry/IndustrySections.tsx).
 */
export const loadAgentFamilies = async (
  props: Pick<AgenticFlowDemoProps, 'families' | 'agentsFor' | 'industries'>,
  draft: boolean,
): Promise<FeatureFamily[]> => {
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
  return featureFamilies(props.families, lists, agents, chosenIndustries(props))
}

export const AgenticFlowDemoBlock = async (props: AgenticFlowDemoProps) => {
  const draft = (await draftMode()).isEnabled

  if (props.mode !== 'agentFeatures') {
    const events = (props.events || []).filter((e) => e && e.label)
    return (
      <FlowDemo
        heading={props.heading}
        intro={props.intro}
        events={props.events}
        footnote={props.footnote}
        design={resolveDesign(props, events.length)}
        links={eventLinks(events, draft)}
        motion={props.motion}
      />
    )
  }

  // "Show agents for" Chosen industries: only agents used in one of them.
  // With industries chosen and no agent to show, the block is not drawn.
  const families = await loadAgentFamilies(props, draft)
  if (chosenIndustries(props).length && !families.length) return null

  return (
    <AgentFeatures
      heading={props.heading}
      intro={props.intro}
      families={families}
      pickFamilyLabel={props.pickFamilyLabel || 'Pick a family'}
      pickAgentLabel={props.pickAgentLabel || 'Agents'}
      design={resolveDesign(props)}
      motion={props.motion}
    />
  )
}
