import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AgentFeatures } from '@/blocks/AgenticFlowDemo/AgentFeatures'
import { resolveDesign } from '@/blocks/AgenticFlowDemo/design'
import { featureFamilies, toFeatureAgent } from '@/blocks/AgenticFlowDemo/featureData'
import type { MicroApp } from '@/payload-types'

/** The Agentic Flow Demo in Agent features mode. */

const agent = (over: Partial<MicroApp>): MicroApp =>
  ({
    id: 'a',
    name: 'Agent',
    slug: 'agent',
    status: 'live',
    family: 'f1',
    channel: ['whatsapp'],
    summary: 'Does the job.',
    keyPoints: [{ line: 'One' }, { line: 'Two' }, { line: 'Three' }, { line: 'Four' }],
    handsOver: null,
    records: 'The booking on the record.',
    teamControls: 'Services and slots.',
    ...over,
  }) as MicroApp

const lists = [
  { id: 'f1', name: 'Book and get paid' },
  { id: 'f2', name: 'Read and match documents' },
  { id: 'f3', name: 'Empty family' },
]
const agents = [
  agent({ id: 'a1', name: 'Appointment assistance', handsOver: '' }),
  agent({ id: 'a2', name: 'Payment services', status: 'pilot', handsOver: 'Hands a dispute to your team.' }),
  agent({ id: 'a3', name: 'Prescription understanding', family: 'f2', channel: ['whatsapp', 'calls', 'web'] }),
  agent({ id: 'a4', name: 'Recover', status: 'planned' }),
]

describe('the agents', () => {
  it('take name, summary, channel tags, the first 3 key points and what they save', () => {
    expect(toFeatureAgent(agents[2])).toEqual({
      id: 'a3',
      name: 'Prescription understanding',
      pilot: false,
      summary: 'Does the job.',
      channels: ['Works on WhatsApp', 'Works on call recordings'],
      keyPoints: ['One', 'Two', 'Three'],
      humanTeam: false,
      records: 'The booking on the record.',
      teamControls: 'Services and slots.',
    })
  })

  it('show "Human team" only when handsOver is filled, and mark Pilot agents', () => {
    expect(toFeatureAgent(agents[0])).toMatchObject({ pilot: false, humanTeam: false })
    expect(toFeatureAgent(agents[1])).toMatchObject({ pilot: true, humanTeam: true })
  })
})

describe('the families', () => {
  it('are every family by order when none are picked, each with its Live and Pilot agents, empty ones left out', () => {
    const fams = featureFamilies([], lists, agents)
    expect(fams.map((f) => [f.name, f.agents.map((a) => a.name)])).toEqual([
      ['Book and get paid', ['Appointment assistance', 'Payment services']],
      ['Read and match documents', ['Prescription understanding']],
    ])
  })

  it("are the block's picks, in its order, whether stored as ids or records", () => {
    expect(featureFamilies(['f2', { id: 'f1' }], lists, agents).map((f) => f.id)).toEqual(['f2', 'f1'])
  })
})

describe('the panel', () => {
  const html = renderToStaticMarkup(
    React.createElement(AgentFeatures, {
      heading: 'What each agent in the bot swarm does',
      intro: 'Pick a family, then an agent.',
      families: featureFamilies([], lists, agents),
      pickFamilyLabel: 'Pick a family',
      pickAgentLabel: 'Agents',
      design: resolveDesign({ mode: 'agentFeatures' }),
    }),
  )

  it('selects the first family and its first agent, with real buttons', () => {
    expect(html).toMatch(/<button type="button" class="tb" aria-pressed="true">Book and get paid<\/button>/)
    expect(html).toMatch(/<button type="button" class="tb" aria-pressed="false">Read and match documents<\/button>/)
    expect(html).toMatch(/class="chip" aria-pressed="true" aria-controls="ncx-agent-a1">Appointment assistance</)
    expect(html).toMatch(/aria-pressed="false" aria-controls="ncx-agent-a2">Payment services<span class="pilot">Pilot<\/span>/)
  })

  it("puts every agent's panel in the HTML, only the selected one shown", () => {
    for (const id of ['a1', 'a2', 'a3']) expect(html).toContain(`id="ncx-agent-${id}"`)
    expect(html).toMatch(/id="ncx-agent-a1" class="stage" role="region" aria-label="Appointment assistance">/)
    expect(html).toMatch(/id="ncx-agent-a2" class="stage" role="region" aria-label="Payment services" hidden="">/)
    expect(html).toMatch(/id="ncx-agent-a3" class="stage" role="region" aria-label="Prescription understanding" hidden="">/)
    expect(html).not.toContain('Recover')
  })

  it('draws the three cards: what it does, features, saves to your systems (teal)', () => {
    const a2 = html.slice(html.indexOf('id="ncx-agent-a2"'), html.indexOf('id="ncx-agent-a3"'))
    expect(a2).toMatch(/<div class="node on" style="[^"]*"><span class="tag">What it does<\/span><b>Payment services<\/b><small>Does the job.<\/small><div class="hch"><span>Works on WhatsApp<\/span><\/div>/)
    expect(a2).toMatch(/<span class="tag">Features<\/span>[^]*class="ncx-keypts"[^]*<span>One<\/span>[^]*<span>Three<\/span><\/li><\/ul>/)
    expect(a2).not.toContain('<span>Four</span>')
    expect(a2).toContain('<span class="on">Virtual agent</span><span class="on">Human team</span>')
    expect(a2).toMatch(/<div class="node ok on" style="[^"]*"><span class="tag">Saves to your systems<\/span><small>The booking on the record.<\/small><small class="you-set"><strong>You set:<\/strong> Services and slots.<\/small>/)
    // No hand-over: no Human team tag.
    const a1 = html.slice(html.indexOf('id="ncx-agent-a1"'), html.indexOf('id="ncx-agent-a2"'))
    expect(a1).toContain('<span class="on">Virtual agent</span></div>')
    expect(a1).not.toContain('Human team')
  })

  it('stacks the cards below 900px and keeps hidden panels hidden', () => {
    expect(html).toContain('@media (max-width:899.98px)')
    expect(html).toContain('.ncx-flow--features .stage[hidden],.ncx-flow--features .chips[hidden]{display:none}')
  })

  it('draws nothing without a family to show', () => {
    expect(
      renderToStaticMarkup(
        React.createElement(AgentFeatures, { heading: 'H', families: [], pickFamilyLabel: 'P', pickAgentLabel: 'A', design: resolveDesign({ mode: 'agentFeatures' }) }),
      ),
    ).toBe('')
  })
})
