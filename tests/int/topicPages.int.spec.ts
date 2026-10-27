import React from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { Breadcrumbs, buildTrail } from '@/components/Breadcrumbs'
import { EntrySectionBand, ownSectionKey } from '@/components/industry/EntrySectionBand'
import { cutOnWord, entryMetadata, fallbackTitle, TopicFooter, trailPageOf } from '@/components/industry/IndustryEntryPage'
import { agentEvent, TOPIC_HEADINGS, topicSectionContent } from '@/components/industry/TopicSections'
import type { IndustryTopic, MicroApp, Sector } from '@/payload-types'

/** Industry topic pages: their sections, cluster footer, breadcrumbs, metadata and routes. */

let draft = false
vi.mock('next/headers', () => ({ draftMode: async () => ({ isEnabled: draft }) }))
// RenderBlocks loads every block, some with admin styles this runner cannot read.
vi.mock('@/blocks/RenderBlocks', () => ({ RenderBlocks: () => null }))
vi.mock('@/blocks/Code/CopyButton', () => ({ CopyButton: () => null }))

// Route stand-ins: which of a Page, an entry or a redirect the route chose.
const found = { page: null as unknown, industry: null as unknown, topic: null as unknown }
vi.mock('@/components/PageView', () => ({ PageView: () => null }))
vi.mock('@/components/PayloadRedirects', () => ({ PayloadRedirects: () => null }))
vi.mock('@/utilities/pages', async (original) => ({
  ...(await original<typeof import('@/utilities/pages')>()),
  queryPageBySlug: async () => found.page,
  queryPageByPath: async () => found.page,
}))
vi.mock('@/utilities/industries', async (original) => ({
  ...(await original<typeof import('@/utilities/industries')>()),
  getIndustryByPath: async () => found.industry,
  getTopicByPath: async () => found.topic,
}))

const industry = {
  id: 'edu',
  name: 'Higher education',
  slug: 'higher-education',
  path: '/higher-education',
  status: 'live',
  hasOwnPage: true,
  _status: 'published',
  meta: { primaryKeyword: 'education CRM' },
} as unknown as Sector

const agent = (id: string, status: string, extra: object = {}) =>
  ({ id, name: `Agent ${id}`, slug: id, status, hasOwnPage: true, startsWhen: `${id} starts`, records: `${id} records`, _status: 'published', ...extra }) as unknown as MicroApp

const topic = {
  id: 't1',
  name: 'Fee collection',
  slug: 'fee-collection',
  path: '/higher-education/fee-collection',
  status: 'live',
  hasOwnPage: true,
  industry,
  stage: 'Enrolment',
  stageOrder: 2,
  summary: 'Fees, collected on time, without chasing by hand.',
  overview: 'Reminders go out before each due date.\n\nPayments reconcile against the student record.',
  steps: [
    { id: 's1', title: 'Remind', description: 'Before the due date.' },
    { id: 's2', title: 'Collect', description: 'By link.' },
  ],
  recorded: [{ id: 'r1', field: 'Amount paid', source: 'Payment gateway' }],
  comparison: { heading: 'Own heading', columns: [{ label: 'Spreadsheet' }, { label: 'NeuronCx' }], rows: [{ label: 'Reminders', cells: [{ text: 'By hand' }, { text: 'Automatic' }] }] },
  agents: [agent('fees', 'live'), agent('marks', 'pilot'), agent('later', 'planned'), agent('unpub', 'live', { _status: 'draft' }), 'bare-id', agent('blank', 'live', { records: '' })],
  integrations: [
    { id: 'erp', name: 'Campus ERP', slug: 'campus-erp', status: 'live', hasOwnPage: true },
    { id: 'lms', name: 'Learning portal', slug: 'lms', status: 'pilot', hasOwnPage: true },
    { id: 'old', name: 'Old system', slug: 'old', status: 'planned', hasOwnPage: true },
  ],
  meta: {},
} as unknown as IndustryTopic

const toHtml = async (node: React.ReactNode): Promise<string> => {
  const stream = await renderToReadableStream(React.createElement(React.Fragment, null, node))
  await stream.allReady
  return new Response(stream).text()
}
const html = (key: string, block: object = {}, from: IndustryTopic = topic) => {
  const node = topicSectionContent(key, { blockType: `${key}Section`, ...block }, from, draft)
  return node ? toHtml(node) : Promise.resolve('')
}

let asked: string[] = []
beforeEach(() => {
  draft = false
  asked = []
  found.page = found.industry = found.topic = null
  vi.stubEnv('CMS_URL', 'http://cms.test')
  vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://www.example.test')
  vi.stubGlobal(
    'fetch',
    vi.fn(async (input: string) => {
      const url = decodeURIComponent(String(input))
      asked.push(url)
      const docs = url.includes('/api/industryTopics?')
        ? [
            { id: 't0', name: 'Lead qualification', path: '/higher-education/leads', stage: 'Enquiry', stageOrder: 1 },
            { id: 't1', name: 'Fee collection', path: '/higher-education/fee-collection', stage: 'Enrolment', stageOrder: 2 },
            { id: 't3', name: 'Alumni giving', path: '/higher-education/alumni', stage: 'After', stageOrder: 3 },
          ]
        : []
      return new Response(JSON.stringify({ docs, totalDocs: docs.length, totalPages: 1, page: 1 }), { status: 200 })
    }),
  )
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

describe('the sections', () => {
  it('overview: a content section, one paragraph per paragraph, with the eyebrow and intro', async () => {
    const out = await html('topicOverview', { eyebrow: 'Overview', intro: 'In short.' })
    expect(out).toContain(`<h2 id="topicOverview-1">${TOPIC_HEADINGS.topicOverview}</h2>`)
    expect(out).toContain('Overview')
    expect(out).toContain('In short.')
    expect(out.match(/class="ncx-sec__lead"/g)).toHaveLength(2)
  })

  it('steps: the How it works 2 block, with the heading override', async () => {
    const out = await html('topicSteps', { heading: '{name} in two steps' })
    expect(out).toContain('ncx-how2')
    expect(out).toContain('Fee collection in two steps')
    expect(out).toContain('Remind')
    expect(out).toContain('By link.')
  })

  it('recorded: a real table with Field and Filled by column headers', async () => {
    const out = await html('topicRecorded')
    expect(out).toContain('<table class="ncx-rec">')
    expect(out).toContain('<th scope="col">Field</th><th scope="col">Filled by</th>')
    expect(out).toContain('<td>Amount paid</td><td>Payment gateway</td>')
  })

  it("comparison: the comparison table block; the row's heading, else the group's own", async () => {
    expect(await html('topicComparison')).toContain('Own heading')
    const out = await html('topicComparison', { heading: 'Against a spreadsheet' })
    expect(out).toContain('Against a spreadsheet')
    expect(out).not.toContain('Own heading')
    expect(out).toContain('Automatic')
  })

  it('agents: one flow demo event per Live or Pilot agent: starts when, handled by name, what it records', async () => {
    expect(agentEvent(agent('fees', 'live'))).toMatchObject({
      label: 'Agent fees',
      triggerTitle: 'Starts when',
      triggerText: 'fees starts',
      handlers: ['agent'],
      routeText: 'Handled by Agent fees',
      resolveTitle: 'Recorded',
      resolveText: 'fees records',
    })
    const out = await html('topicAgents', { eyebrow: 'Bot swarm' })
    expect(out).toContain('The agents that do it')
    expect(out).toContain('Bot swarm')
    for (const name of ['Agent fees', 'Agent marks']) expect(out).toContain(name)
    for (const name of ['Agent later', 'Agent unpub', 'Agent blank']) expect(out).not.toContain(name)
  })

  it('agents: the unpublished one only in a draft preview', async () => {
    draft = true
    expect(await html('topicAgents')).toContain('Agent unpub')
  })

  it('integrations: the Live and Pilot ones in the logo wall, linking to an own page', async () => {
    const out = await html('topicIntegrations')
    expect(out).toContain('<a class="cell" href="/integrations/campus-erp">')
    expect(out).toContain('Learning portal')
    expect(out).not.toContain('Old system')
  })

  it('draws nothing when there is nothing to show', async () => {
    const empty = { id: 'e', name: 'Empty' } as unknown as IndustryTopic
    for (const key of Object.keys(TOPIC_HEADINGS)) expect(topicSectionContent(key, { blockType: `${key}Section` }, empty), key).toBeNull()
  })
})

describe('on the page', () => {
  it('a topic or industry section draws its own band with only background and anchor ID; nothing when empty', async () => {
    expect(ownSectionKey('topicStepsSection')).toBe('topicSteps')
    expect(ownSectionKey('industryAgentsSection')).toBe('industryAgents')
    expect(ownSectionKey('sharedSection')).toBe('shared')
    expect(ownSectionKey('faqSection')).toBeNull()
    const out = await toHtml(
      await EntrySectionBand({ block: { blockType: 'topicRecordedSection', htmlId: 'recorded', background: 'cloud', width: 'narrow' }, entry: topic, index: 0, draft: false }),
    )
    expect(out).toContain('id="recorded"')
    expect(out).toContain('Amount paid')
    const none = await EntrySectionBand({ block: { blockType: 'topicRecordedSection' }, entry: { ...topic, recorded: [] } as IndustryTopic, index: 0, draft: false })
    expect(none).toBeNull()
  })
})

describe('the cluster footer', () => {
  it("back to the industry by its primary keyword, on to the published topic with the next stage order", async () => {
    const out = (await toHtml(await TopicFooter({ topic, draft: false }))).replace(/<!-- -->/g, '')
    const ask = asked.find((u) => u.includes('/api/industryTopics?'))!
    expect(ask).toContain('where[industry][equals]=edu')
    expect(ask).toContain('where[_status][equals]=published')
    expect(out).toContain('href="/higher-education"')
    expect(out).toContain('Back to education CRM')
    expect(out).toContain('href="/higher-education/alumni"')
    expect(out).toContain('Next stage: After')
    expect(out).not.toContain('Lead qualification')
  })

  it("names the industry when it has no primary keyword, and is left out when Hide cluster footer is on", async () => {
    const plain = { ...topic, industry: { ...industry, meta: {} } } as unknown as IndustryTopic
    expect((await toHtml(await TopicFooter({ topic: plain, draft: false }))).replace(/<!-- -->/g, '')).toContain('Back to Higher education')
    expect(await TopicFooter({ topic: { ...topic, hideClusterFooter: true } as IndustryTopic, draft: false })).toBeNull()
  })
})

describe('breadcrumbs and metadata', () => {
  it('Home / industry / topic, with BreadcrumbList data', async () => {
    const trail = buildTrail({ page: trailPageOf(topic, 'industryTopics') })
    expect(trail).toEqual([{ label: 'Home', href: '/' }, { label: 'Higher education', href: '/higher-education' }, { label: 'Fee collection' }])
    expect(buildTrail({ page: trailPageOf(industry, 'sectors') })).toEqual([{ label: 'Home', href: '/' }, { label: 'Higher education' }])
    const out = await toHtml(React.createElement(Breadcrumbs, { items: trail }))
    expect(out).toContain('"@type":"BreadcrumbList"')
    expect(out).toContain('https://www.example.test/higher-education')
  })

  it('an industry without a page of its own is a step without a link', () => {
    const hidden = { ...topic, industry: { ...industry, hasOwnPage: false } } as unknown as IndustryTopic
    expect(buildTrail({ page: trailPageOf(hidden, 'industryTopics') })[1]).toEqual({ label: 'Higher education' })
  })

  it('from the SEO tab, else the fallbacks; canonical from the stored path', () => {
    expect(fallbackTitle('Fee collection')).toBe('Fee collection | NeuronCx')
    expect(cutOnWord('one two three', 8)).toBe('one two')
    const meta = entryMetadata(topic)
    expect(meta.title).toBe('Fee collection | NeuronCx')
    expect(meta.description).toBe('Fees, collected on time, without chasing by hand.')
    expect(meta.alternates?.canonical).toBe('https://www.example.test/higher-education/fee-collection')
    const own = entryMetadata({ ...topic, meta: { title: 'Fee collection for colleges', description: 'Own words.' } } as IndustryTopic)
    expect([own.title, own.description]).toEqual(['Fee collection for colleges', 'Own words.'])
  })
})

describe('the routes', () => {
  const routeOf = async (which: 'slug' | 'cluster') =>
    (which === 'slug' ? await import('@/app/(frontend)/[slug]/page') : await import('@/app/(frontend)/[slug]/[cluster]/page')).default
  const params = (slug: string, cluster?: string) => ({ params: Promise.resolve({ slug, ...(cluster ? { cluster } : {}) }) }) as any
  const chosen = (el: any) => (el?.type?.name as string) || ''

  it('/{slug}: a Page first, then an industry, then redirects', async () => {
    const route = await routeOf('slug')
    found.industry = industry
    expect(chosen(await route(params('higher-education')))).toBe('IndustryEntryPage')
    found.page = { id: 'p', slug: 'higher-education', title: 'Page' }
    expect(chosen(await route(params('higher-education')))).toBe('PageView')
    found.page = found.industry = null
    expect(chosen(await route(params('nothing')))).toBe('PayloadRedirects')
  })

  it('/{slug}/{cluster}: a child Page first, then a topic under the industry with that slug, then redirects', async () => {
    const route = await routeOf('cluster')
    found.topic = topic
    const el: any = await route(params('higher-education', 'fee-collection'))
    expect(chosen(el)).toBe('IndustryEntryPage')
    expect(el.props.trail.map((c: { label: string }) => c.label)).toEqual(['Home', 'Higher education', 'Fee collection'])
    // A topic whose industry has another slug is not served here.
    expect(chosen(await route(params('healthcare', 'fee-collection')))).toBe('PayloadRedirects')
    found.page = { id: 'p', slug: 'fee-collection', title: 'Page' }
    expect(chosen(await route(params('higher-education', 'fee-collection')))).toBe('PageView')
  })
})
