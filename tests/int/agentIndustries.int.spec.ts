import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AgenticFlowDemoBlock } from '@/blocks/AgenticFlowDemo/Component'
import { chosenIndustries, featureFamilies, inIndustries } from '@/blocks/AgenticFlowDemo/featureData'
import type { MicroApp } from '@/payload-types'

/** Agentic Flow Demo, Agent features mode: "Show agents for" Chosen industries. */

vi.mock('next/headers', () => ({ draftMode: async () => ({ isEnabled: false }) }))

const agent = (id: string, family: string, verticals: MicroApp['verticals'], status: MicroApp['status'] = 'live'): MicroApp =>
  ({ id, name: `Agent ${id}`, slug: id, family, status, verticals, summary: `${id} summary` }) as unknown as MicroApp

const lists = [
  { id: 'book', name: 'Book and get paid' },
  { id: 'docs', name: 'Read and match documents' },
  { id: 'coach', name: 'Check and coach your team' },
]
const agents = [
  agent('fees', 'book', ['education']),
  agent('slots', 'book', ['healthcare', 'diagnostics']),
  agent('marks', 'docs', ['education'], 'pilot'),
  agent('rx', 'docs', ['healthcare']),
  agent('planned', 'coach', ['education'], 'planned'),
  agent('untagged', 'coach', null),
]

describe('choosing industries', () => {
  it('reads the chosen industries only when "Show agents for" is Chosen industries', () => {
    expect(chosenIndustries({ agentsFor: 'industries', industries: ['education'] })).toEqual(['education'])
    expect(chosenIndustries({ agentsFor: 'all', industries: ['education'] })).toEqual([])
    expect(chosenIndustries({})).toEqual([])
  })

  it('matches an agent used in at least one chosen industry, and any agent when none are chosen', () => {
    expect(inIndustries(agents[1], ['education', 'diagnostics'])).toBe(true)
    expect(inIndustries(agents[1], ['education'])).toBe(false)
    expect(inIndustries(agents[5], ['education'])).toBe(false)
    expect(inIndustries(agents[5], [])).toBe(true)
  })
})

describe('the families shown', () => {
  const shape = (f: ReturnType<typeof featureFamilies>) => f.map((x) => [x.name, x.agents.map((a) => a.name)])

  it('keeps today’s behaviour for all agents: every Live and Pilot agent, by family', () => {
    expect(shape(featureFamilies(null, lists, agents))).toEqual([
      ['Book and get paid', ['Agent fees', 'Agent slots']],
      ['Read and match documents', ['Agent marks', 'Agent rx']],
      ['Check and coach your team', ['Agent untagged']],
    ])
  })

  it('shows only Live and Pilot agents in a chosen industry, grouped by family, leaving out empty families', () => {
    expect(shape(featureFamilies(null, lists, agents, ['education']))).toEqual([
      ['Book and get paid', ['Agent fees']],
      ['Read and match documents', ['Agent marks']],
    ])
    expect(shape(featureFamilies(null, lists, agents, ['diagnostics', 'hospitality']))).toEqual([
      ['Book and get paid', ['Agent slots']],
    ])
    expect(featureFamilies(null, lists, agents, ['hospitality'])).toEqual([])
  })
})

describe('the block', () => {
  beforeEach(() => {
    vi.stubEnv('CMS_URL', 'http://cms.test')
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        const url = decodeURIComponent(String(input))
        const docs = url.includes('/api/lists') ? lists : url.includes('/api/microApps') ? agents : []
        return new Response(JSON.stringify({ docs, totalDocs: docs.length, totalPages: 1, page: 1 }), { status: 200 })
      }),
    )
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  const block = (over: object) =>
    AgenticFlowDemoBlock({ blockType: 'agenticFlowDemo', heading: 'Agents', mode: 'agentFeatures', ...over } as any) as Promise<any>

  it('hands over only the matching agents when industries are chosen', async () => {
    const el = await block({ agentsFor: 'industries', industries: ['healthcare'] })
    expect(el.props.families.map((f: any) => [f.name, f.agents.map((a: any) => a.name)])).toEqual([
      ['Book and get paid', ['Agent slots']],
      ['Read and match documents', ['Agent rx']],
    ])
  })

  it('is not drawn when no agent matches the chosen industries', async () => {
    expect(await block({ agentsFor: 'industries', industries: ['hospitality'] })).toBeNull()
  })

  it('shows every family for all agents, as before', async () => {
    const el = await block({ agentsFor: 'all', industries: ['hospitality'] })
    expect(el.props.families).toHaveLength(3)
  })
})
