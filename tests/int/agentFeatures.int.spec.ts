import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { AgentFeatures } from '@/blocks/AgenticFlowDemo/AgentFeatures'
import { resolveDesign } from '@/blocks/AgenticFlowDemo/design'
import { featureFamilies, groupsToFamilies, toFeatureAgent } from '@/blocks/AgenticFlowDemo/featureData'
import { resolveLink } from '@/blocks/AgenticFlowDemo/eventLinks'
import type { MicroApp } from '@/payload-types'
import { tallest } from '@/blocks/AgenticFlowDemo/useMeasured'

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
    expect(html).toMatch(/<button type="button" class="tb" aria-pressed="true"><span class="fam-ind"[^>]*><\/span><span class="fam-label">Book and get paid<\/span><\/button>/)
    expect(html).toMatch(/<button type="button" class="tb" aria-pressed="false"><span class="fam-label">Read and match documents<\/span><\/button>/)
    expect(html).toMatch(/class="chip" aria-pressed="true" aria-controls="ncx-agent-a1"[^>]*>Appointment assistance</)
    expect(html).toMatch(/aria-pressed="false" aria-controls="ncx-agent-a2"[^>]*>Payment services<span class="pilot">Pilot<\/span>/)
  })

  it("puts every agent's panel in the HTML (motion plan prompt 7: out of flow, not display:none), only the selected one laid out", () => {
    for (const id of ['a1', 'a2', 'a3']) expect(html).toContain(`id="ncx-agent-${id}"`)
    // Inactive panels sit top, left and right at their own height, so each can be measured where it is.
    // Each carries its opacity in the server HTML, so only the selected one shows before JavaScript runs.
    expect(html).toMatch(/id="ncx-agent-a1" class="stage" role="region" aria-label="Appointment assistance" aria-hidden="false" style="position:relative;pointer-events:auto;opacity:1;transform:none"/)
    expect(html).toMatch(/id="ncx-agent-a2" class="stage" role="region" aria-label="Payment services" aria-hidden="true" style="position:absolute;top:0;left:0;right:0;pointer-events:none;opacity:0;transform:none"/)
    expect(html).toMatch(/id="ncx-agent-a3" class="stage" role="region" aria-label="Prescription understanding" aria-hidden="true" style="position:absolute;top:0;left:0;right:0;pointer-events:none;opacity:0;transform:none"/)
    expect(html).not.toContain('Recover')
  })

  it('draws the three cards: what it does, features, saves to your systems (teal)', () => {
    const a2 = html.slice(html.indexOf('id="ncx-agent-a2"'), html.indexOf('id="ncx-agent-a3"'))
    expect(a2).toMatch(/<div class="node on" style="[^"]*"><span class="tag">What it does<\/span><b>Payment services<\/b><small>Does the job.<\/small><div class="hch"><span>Works on WhatsApp<\/span><\/div>/)
    expect(a2).toMatch(/<span class="tag">Features<\/span>[^]*class="feat"[^]*<span>One<\/span>[^]*<span>Three<\/span><\/li><\/ul>/)
    expect(a2).not.toContain('<span>Four</span>')
    expect(a2).toMatch(/<span class="on"[^>]*>Virtual agent<\/span><span class="on"[^>]*>Human team<\/span>/)
    expect(a2).toMatch(/<div class="node ok on" style="[^"]*"><span class="tag">Saves to your systems<\/span><div class="saves">[^]*<small>The booking on the record.<\/small><\/div><small class="you-set"><strong>You set:<\/strong> Services and slots.<\/small>/)
    // No hand-over: no Human team tag.
    const a1 = html.slice(html.indexOf('id="ncx-agent-a1"'), html.indexOf('id="ncx-agent-a2"'))
    expect(a1).toMatch(/<span class="on"[^>]*>Virtual agent<\/span><\/div>/)
    expect(a1).not.toContain('Human team')
  })

  it('stacks the cards below 900px, and the stage-outer tracks the active panel alone', () => {
    expect(html).toContain('@media (max-width:899.98px)')
    expect(html).toContain('.ncx-flow--features .stage-outer{position:relative}')
  })

  it('draws nothing without a family to show', () => {
    expect(
      renderToStaticMarkup(
        React.createElement(AgentFeatures, { heading: 'H', families: [], pickFamilyLabel: 'P', pickAgentLabel: 'A', design: resolveDesign({ mode: 'agentFeatures' }) }),
      ),
    ).toBe('')
  })
})

describe('reserving height (useMeasured)', () => {
  it('takes the tallest element, or nothing when there are none', () => {
    const el = (offsetHeight: number) => ({ offsetHeight }) as unknown as Element
    expect(tallest([el(234), el(254), el(197)])).toBe(254)
    expect(tallest([])).toBeUndefined()
    expect(tallest(null)).toBeUndefined()
  })
})

describe('Groups mode data (groupsToFamilies)', () => {
  const item = (over: Record<string, unknown> = {}) => ({
    id: 'i1',
    name: 'Customer 360',
    summary: 'One record per customer.',
    features: [{ line: 'One' }, { line: 'Two' }, { line: 'Three' }, { line: 'Four' }, { line: 'Five' }],
    lands: 'On the customer record.',
    ...over,
  })
  const groups = [
    {
      id: 'g1',
      label: 'CRM',
      items: [
        item({ chip: 'New', tags: [{ label: 'whatsapp' }, { label: 'Works with your ERP' }], handlerTags: ['human'], icon: 'database', youSet: 'Fields and stages.', link: { label: 'See the CRM', type: 'custom', url: '/crm' } }),
        item({ id: 'i2', name: 'Transactions' }),
      ],
    },
    { id: 'g2', label: 'CX', items: [item({ id: 'i3', name: 'Agent desk' })] },
  ]

  it('maps every item onto the explorer contract, keeping all five feature lines and the tags as typed', () => {
    const [crm] = groupsToFamilies(groups as never)
    expect(crm).toMatchObject({ id: 'g1', name: 'CRM' })
    expect(crm.agents[0]).toEqual({
      id: 'i1',
      name: 'Customer 360',
      pilot: false,
      summary: 'One record per customer.',
      // Not channel names: "whatsapp" stays as typed, not "Works on WhatsApp".
      channels: ['whatsapp', 'Works with your ERP'],
      keyPoints: ['One', 'Two', 'Three', 'Four', 'Five'],
      humanTeam: false,
      records: 'On the customer record.',
      teamControls: 'Fields and stages.',
      chip: 'New',
      handlerTags: ['human'],
      icon: 'database',
      link: { label: 'See the CRM', href: '/crm', newTab: false },
    })
    expect(crm.agents[1]).toMatchObject({ chip: null, handlerTags: [], icon: null, link: null, channels: [], teamControls: null })
  })

  it('gives every group and item an id no other has, even when the rows carry none or repeat one', () => {
    const noIds = [
      { label: 'A', items: [item({ id: undefined }), item({ id: undefined, name: 'Second' })] },
      { label: 'B', items: [item({ id: undefined })] },
    ]
    const ids = groupsToFamilies(noIds as never).flatMap((f) => [f.id, ...f.agents.map((a) => a.id)])
    expect(new Set(ids).size).toBe(ids.length)
    const repeated = [
      { id: 'same', label: 'A', items: [item({ id: 'same' })] },
      { id: 'same', label: 'B', items: [item({ id: 'same' })] },
    ]
    const again = groupsToFamilies(repeated as never).flatMap((f) => [f.id, ...f.agents.map((a) => a.id)])
    expect(new Set(again).size).toBe(again.length)
  })

  it('leaves out an item with no name and a group with no label or no items left', () => {
    const families = groupsToFamilies([
      { id: 'g1', label: 'Kept', items: [item(), item({ id: 'i9', name: '  ' })] },
      { id: 'g2', label: '', items: [item({ id: 'i3' })] },
      { id: 'g3', label: 'Empty', items: [item({ id: 'i4', name: '' })] },
    ] as never)
    expect(families.map((f) => f.name)).toEqual(['Kept'])
    expect(families[0].agents.map((a) => a.id)).toEqual(['i1'])
    expect(groupsToFamilies(null)).toEqual([])
  })

  it('leaves the agents exactly as before: none of the new fields appear on them', () => {
    const a = toFeatureAgent(agents[0])
    for (const key of ['chip', 'handlerTags', 'icon', 'link']) expect(a, key).not.toHaveProperty(key)
  })

  it('takes Agent features\' default eyebrows and line, and keeps unset as Flow', () => {
    expect(resolveDesign({ mode: 'groups' })).toMatchObject({
      stageLabels: ['What it does', 'Features', 'Saves to your systems'],
      lineStyle: 'static',
      lineColor: 'crimson',
      autoplay: null,
    })
    expect(resolveDesign({ mode: 'groups' })).toEqual(resolveDesign({ mode: 'agentFeatures' }))
    expect(resolveDesign({})).toEqual(resolveDesign({ mode: 'flow' }))
  })
})

describe('a link (resolveLink)', () => {
  it('goes to a page, home, a URL or an agent with its own page, and is nothing without text or a target', () => {
    expect(resolveLink({ label: 'Pricing', type: 'reference', reference: { relationTo: 'pages', value: { slug: 'pricing' } } } as never)).toEqual({ label: 'Pricing', href: '/pricing', newTab: false })
    expect(resolveLink({ label: 'Home', type: 'reference', reference: { relationTo: 'pages', value: { slug: 'home' } } } as never)?.href).toBe('/')
    expect(resolveLink({ label: 'Docs', type: 'custom', url: 'https://docs.example.com', newTab: true } as never)).toEqual({ label: 'Docs', href: 'https://docs.example.com', newTab: true })
    expect(resolveLink({ label: '', type: 'custom', url: '/x' } as never)).toBeNull()
    expect(resolveLink({ label: 'Nowhere', type: 'reference' } as never)).toBeNull()
    expect(resolveLink(null)).toBeNull()
  })
})

