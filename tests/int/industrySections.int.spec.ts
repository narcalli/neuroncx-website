import React from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { INDUSTRY_HEADINGS, IndustrySections, industrySectionContent, statValue } from '@/components/industry/IndustrySections'
import type { Sector } from '@/payload-types'

/** The industry page sections, drawn from the entry with each block's own component. */

let draft = false
vi.mock('next/headers', () => ({ draftMode: async () => ({ isEnabled: draft }) }))
// RenderBlocks loads every block, some with admin styles this runner cannot
// read; the stand-in shows the blocks it is given.
vi.mock('@/blocks/RenderBlocks', () => ({
  RenderBlocks: ({ blocks }: { blocks: unknown[] }) => React.createElement('pre', { 'data-blocks': '' }, JSON.stringify(blocks)),
}))

const entry = {
  id: 'i1',
  name: 'Higher education',
  slug: 'higher-education',
  verticals: ['education'],
  problems: [{ id: 'p1', title: 'Leads go cold', description: 'Nobody calls back within a day.' }, { id: 'p2', title: 'Documents arrive late' }],
  episodeName: 'Admission',
  episodePoints: [
    { id: 'e1', title: 'Enquiry', caption: 'A lead comes in.' },
    { id: 'e2', title: 'Scholarship check', caption: 'Not confirmed yet.', pending: true },
    { id: 'e3', title: 'Enrolment', caption: 'The student joins.' },
  ],
  keyDates: [{ id: 'k1', label: 'Applications open' }, { id: 'k2', label: 'Results day' }],
  stats: [
    { id: 's1', value: '40%', label: 'fewer missed calls' },
    { id: 's2', value: '3x', label: 'ZZ unconfirmed stat', pending: true },
    { id: 's3', value: 'Same day', label: 'cannot count up' },
  ],
  roles: [{ id: 'r1', name: 'Counsellor', caption: 'Calls qualified leads.' }, { id: 'r2', name: 'Applicant', caption: 'Applies and pays.' }],
  audiences: [{ id: 'a1', label: 'Leadership', points: [{ text: 'Sees the whole intake' }, { text: 'Compares sources' }] }],
  recordLabel: 'Student record',
  entities: [{ id: 'n1', label: 'Fees', fields: [{ name: 'Balance', source: 'ERP' }] }],
  columns: [{ label: 'CRM' }, { label: 'NeuronCx', highlight: true }],
  rows: [{ label: 'Record', cells: [{ text: 'A lead' }, { text: 'A student' }] }],
  footnote: 'Typical setups.',
  carts: { heading: 'One cart per student', carts: [{ name: 'MBA', historyCount: 2 }] },
  reporting: { heading: 'Reports', cards: [] },
} as unknown as Sector

// What the stand-in CMS holds, by collection.
const cms: Record<string, Record<string, unknown>[]> = {
  lists: [{ id: 'book', name: 'Book and get paid' }, { id: 'docs', name: 'Read and match documents' }],
  microApps: [
    { id: 'fees', name: 'Fee reminders', slug: 'fees', family: 'book', status: 'live', verticals: ['education'], summary: 'Chases fees.' },
    { id: 'marks', name: 'Marksheet match', slug: 'marks', family: 'docs', status: 'pilot', verticals: ['education'], summary: 'Reads marksheets.' },
    { id: 'rx', name: 'Prescription reader', slug: 'rx', family: 'docs', status: 'live', verticals: ['healthcare'], summary: 'Reads prescriptions.' },
  ],
  integrations: [
    { id: 'erp', name: 'Campus ERP', slug: 'campus-erp', status: 'live', hasOwnPage: true, verticals: ['education'] },
    { id: 'lms', name: 'Learning portal', slug: 'lms', status: 'pilot', hasOwnPage: true, verticals: ['education'] },
  ],
  customers: [{ id: 'c1', name: 'A university in Pune', summary: 'Halved the time to admit.', sectors: ['i1'] }],
  industryTopics: [
    { id: 't1', name: 'Fee collection', slug: 'fee-collection', path: '/higher-education/fee-collection', hasOwnPage: true, industry: 'i1', stage: 'Enrolment', stageOrder: 2, summary: 'Fees, collected on time.' },
    { id: 't2', name: 'Lead qualification', slug: 'lead-qualification', path: '/higher-education/lead-qualification', hasOwnPage: true, industry: 'i1', stage: 'Enquiry', stageOrder: 1, summary: 'Which leads to call first.' },
    { id: 't3', name: 'No page yet', slug: 'no-page', path: '/higher-education/no-page', hasOwnPage: false, industry: 'i1', stage: 'Enquiry', stageOrder: 3, summary: 'Not linked.' },
  ],
}

// Answers a CMS list request: the collection's documents matching the query's
// verticals, sectors or industry filter.
let asked: string[] = []
const answer = (url: URL) => {
  const collection = url.pathname.split('/').pop() ?? ''
  const q = url.searchParams
  const inList = (key: string) => q.get(key)?.split(',') ?? null
  let docs = cms[collection] ?? []
  const verticals = inList('where[verticals][in]')
  if (verticals) docs = docs.filter((d) => ((d.verticals as string[]) ?? []).some((v) => verticals.includes(v)))
  const sectors = inList('where[sectors][in]')
  if (sectors) docs = docs.filter((d) => ((d.sectors as string[]) ?? []).some((s) => sectors.includes(s)))
  const industry = q.get('where[industry][equals]')
  if (industry) docs = docs.filter((d) => d.industry === industry)
  return docs
}

beforeEach(() => {
  draft = false
  asked = []
  vi.stubEnv('CMS_URL', 'http://cms.test')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      const url = new URL(String(input))
      asked.push(decodeURIComponent(url.toString()))
      const docs = answer(url)
      return new Response(JSON.stringify({ docs, totalDocs: docs.length, totalPages: 1, page: 1 }), { status: 200 })
    }),
  )
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

// Server rendering, async components included.
const toHtml = async (node: React.ReactNode): Promise<string> => {
  const stream = await renderToReadableStream(React.createElement(React.Fragment, null, node))
  await stream.allReady
  return new Response(stream).text()
}

const html = async (key: string, block: object = {}, from: Sector = entry) => {
  const node = await industrySectionContent(key, { blockType: `${key}Section`, ...block }, from)
  return node ? toHtml(node) : ''
}

describe('stat values', () => {
  it('splits a number from what follows it, and leaves out a value that cannot count up', () => {
    expect(statValue('40%')).toEqual({ value: 40, suffix: '%' })
    expect(statValue('1,300+')).toEqual({ value: 1300, suffix: '+' })
    expect(statValue('2x')).toEqual({ value: 2, suffix: 'x' })
    expect(statValue('12')).toEqual({ value: 12, suffix: null })
    expect(statValue('Same day')).toBeNull()
  })
})

describe('each section', () => {
  it('problems: the problem statement block, with the layout row heading, eyebrow and intro', async () => {
    const out = await html('industryProblems', { heading: 'Why {name} loses students', eyebrow: 'The problem', intro: 'Three things go wrong.' })
    expect(out).toContain('Why Higher education loses students')
    expect(out).toContain('The problem')
    expect(out).toContain('Leads go cold')
    expect(out).toContain('Documents arrive late')
  })

  it('episode: the points and key dates, never the pending point, then the stats that can count, never the pending one', async () => {
    const out = await html('industryEpisode')
    expect(out).toContain(INDUSTRY_HEADINGS.industryEpisode)
    expect(out).toContain('Enquiry')
    expect(out).toContain('Enrolment')
    expect(out).toContain('Admission opens')
    expect(out).toContain('Key dates: Applications open, Results day')
    expect(out).not.toContain('Scholarship check')
    expect(out).toContain('fewer missed calls')
    expect(out).not.toContain('ZZ unconfirmed stat')
    expect(out).not.toContain('cannot count up')
  })

  it('roles, by team, record and comparison: their blocks, from the entry', async () => {
    expect(await html('industryRoles')).toContain('Counsellor')
    expect(await html('industryRoles')).toContain('Admission')
    expect(await html('industryAudiences')).toContain('Leadership')
    expect(await html('industryRecord')).toContain('Student record')
    expect(await html('industryComparison')).toContain('A student')
    expect(await html('industryComparison')).toContain('Typical setups.')
  })

  it('interim: the group with its own heading, unless the layout row sets one', async () => {
    expect(await html('industryCarts')).toContain('One cart per student')
    const out = await html('industryCarts', { heading: 'Every course, one record' })
    expect(out).toContain('Every course, one record')
    expect(out).not.toContain('One cart per student')
  })

  it('draws nothing when there is nothing to show', async () => {
    expect(await html('industryReporting')).toBe('')
    expect(await html('industryCampaigns')).toBe('')
    for (const key of Object.keys(INDUSTRY_HEADINGS)) {
      expect(await industrySectionContent(key, { blockType: `${key}Section` }, { id: 'x', name: 'Empty' } as Sector), key).toBeNull()
    }
  })

  it('draws nothing for an episode whose only point and stat are pending', async () => {
    const pendingOnly = { ...entry, episodePoints: [{ title: 'Later', pending: true }], stats: [{ value: '9%', label: 'x', pending: true }] } as unknown as Sector
    expect(await industrySectionContent('industryEpisode', { blockType: 'industryEpisodeSection' }, pendingOnly)).toBeNull()
  })
})

describe('sections drawn from other collections', () => {
  it('agents: the Live and Pilot agents for the industry, by family, with the eyebrow', async () => {
    const out = await html('industryAgents', { eyebrow: 'Bot swarm', intro: 'Each one does one job.' })
    expect(asked.some((u) => u.includes('/api/microApps?') && u.includes('where[status][in]=live,pilot'))).toBe(true)
    expect(out).toContain('The agents that work here')
    expect(out).toContain('Bot swarm')
    expect(out).toContain('Each one does one job.')
    expect(out).toContain('Book and get paid')
    expect(out).toContain('Fee reminders')
    expect(out).toContain('Marksheet match')
    expect(out).not.toContain('Prescription reader')
  })

  it('agents and integrations: not drawn for an industry with no verticals, or none that match', async () => {
    const none = { ...entry, verticals: [] } as unknown as Sector
    expect(await html('industryAgents', {}, none)).toBe('')
    expect(await html('industryIntegrations', {}, none)).toBe('')
    const hospitality = { ...entry, verticals: ['hospitality'] } as unknown as Sector
    expect(await html('industryAgents', {}, hospitality)).toBe('')
    expect(await html('industryIntegrations', {}, hospitality)).toBe('')
  })

  it('integrations: the Live and Pilot ones for the industry, each linking to its own page when it has one', async () => {
    const out = await html('industryIntegrations', { eyebrow: 'Integrations' })
    const ask = asked.find((u) => u.includes('/api/integrations?'))!
    expect(ask).toContain('where[verticals][in]=education')
    expect(ask).toContain('where[status][in]=live,pilot')
    expect(ask).toContain('where[_status][equals]=published')
    expect(out).toContain('Works with the systems you run')
    expect(out).toContain('<a class="cell" href="/integrations/campus-erp">')
    // A Pilot integration has no page of its own yet, so it is not a link.
    expect(out).toContain('Learning portal')
    expect(out).not.toContain('href="/integrations/lms"')
  })

  it('customers: the published ones for this industry, read as a visitor reads them', async () => {
    draft = true
    const out = await html('industryCustomers', { heading: 'Who runs {name} on it' })
    const ask = asked.find((u) => u.includes('/api/customers?'))!
    expect(ask).toContain('where[sectors][in]=i1')
    expect(ask).toContain('where[_status][equals]=published')
    expect(ask).not.toContain('draft=true')
    expect(out).toContain('Who runs Higher education on it')
    expect(out).toContain('A university in Pune')
  })

  it('topics: the topics with their own page, by stage and stage order, plus the extra pages', async () => {
    const extra = { id: 'faq', title: 'Admissions FAQ', slug: 'admissions-faq', parent: null, _status: 'published', meta: { description: 'Common questions.' } }
    const out = await html('industryTopics', { extraPages: [{ page: extra, stage: 'Enquiry', stageOrder: 0 }] })
    const ask = asked.find((u) => u.includes('/api/industryTopics?'))!
    expect(ask).toContain('where[industry][equals]=i1')
    expect(ask).toContain('sort=stageOrder')
    expect([...out.matchAll(/<h3 class="stage">([^<]*)<\/h3>/g)].map((m) => m[1])).toEqual(['Enquiry', 'Enrolment'])
    expect(out).toContain('href="/higher-education/lead-qualification"')
    expect(out).toContain('Which leads to call first.')
    expect(out).toContain('href="/higher-education/fee-collection"')
    expect(out).toContain('href="/admissions-faq"')
    expect(out.indexOf('Admissions FAQ')).toBeLessThan(out.indexOf('Lead qualification'))
    expect(out).not.toContain('No page yet')
  })

  it('topics: the extra pages alone are enough to draw it', async () => {
    const extra = { id: 'faq', title: 'Admissions FAQ', slug: 'admissions-faq', parent: null, _status: 'published' }
    const other = { ...entry, id: 'other' } as unknown as Sector
    expect(await html('industryTopics', {}, other)).toBe('')
    expect(await html('industryTopics', { extraPages: [{ page: extra }] }, other)).toContain('Admissions FAQ')
  })

  it("shared: the record's block through RenderBlocks, with the row's text, background and anchor ID", async () => {
    const item = {
      id: 'sc1',
      _status: 'published',
      block: [{ blockType: 'bentoGrid', title: 'Own title', background: 'white', cards: [{ title: 'Kept on your servers', colSpan: '8' }] }],
    }
    const given = async (block: object) => {
      const out = await html('shared', block)
      const m = out.match(/<pre data-blocks="">([^<]*)<\/pre>/)
      return m ? JSON.parse(m[1].replace(/&quot;/g, '"').replace(/&amp;/g, '&')) : null
    }
    expect(await given({ item })).toEqual(item.block)
    expect(await given({ item, heading: 'Trust at {name}', eyebrow: 'Security', intro: 'Short.', background: 'muted', htmlId: 'trust' })).toEqual([
      { ...item.block[0], title: 'Trust at Higher education', eyebrow: 'Security', description: 'Short.', background: 'muted', htmlId: 'trust' },
    ])
    // The stat band has no heading to replace.
    const band = { ...item, block: [{ blockType: 'statBand', stats: [{ value: '4', label: 'industries' }] }] }
    expect(await given({ item: band, heading: 'Ignored' })).toEqual(band.block)
    expect(await html('shared', { item: { ...item, _status: 'draft' } })).toBe('')
    draft = true
    expect(await given({ item: { ...item, _status: 'draft' } })).toEqual(item.block)
    expect(await html('shared', { item: 'sc1' })).toBe('')
  })
})

describe('the page sections', () => {
  it('follow the layout, skip what is not an industry section, and apply only background and anchor ID', async () => {
    const out = await toHtml(
      await IndustrySections({
        entry,
        blocks: [
          { blockType: 'industryEpisodeSection', background: 'navy', htmlId: 'episode', width: 'narrow' },
          { blockType: 'content' },
          { blockType: 'industryProblemsSection' },
          { blockType: 'industryReportingSection' },
        ],
      }),
    )
    expect(out.indexOf('Enrolment')).toBeLessThan(out.indexOf('Leads go cold'))
    expect(out).toContain('id="episode"')
    expect(out).not.toContain('Reports')
  })
})
