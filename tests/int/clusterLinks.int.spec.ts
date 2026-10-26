import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { ClusterLinksBlock } from '@/blocks/ClusterLinks/Component'
import { closingSlot } from '@/blocks/closingSlot'
import { ClusterFooter } from '@/components/ClusterFooter'
import { backLinkOf, clusterGroups, nextStage, type ClusterPage } from '@/utilities/clusters'

/** Cluster links block, the cluster footer and where it goes. */

let draft = false
vi.mock('next/headers', () => ({ draftMode: async () => ({ isEnabled: draft }) }))

const pillar = {
  id: 'p1',
  title: 'Higher education',
  slug: 'higher-education',
  parent: null,
  meta: { primaryKeyword: 'education CRM' },
} as any

const cluster = (slug: string, title: string, stage: string | null, stageOrder: number | null, extra: object = {}): ClusterPage =>
  ({
    id: slug,
    title,
    slug,
    parent: pillar,
    stage,
    stageOrder,
    meta: { description: `${title} in one line.` },
    breadcrumbs: [
      { label: 'Higher education', url: '/higher-education' },
      { label: title, url: `/higher-education/${slug}` },
    ],
    ...extra,
  }) as any

const qualify = cluster('qualify', 'Student lead qualification', 'Qualification', 1)
const apply = cluster('apply', 'Application follow-up', 'Application', 2)
const docs = cluster('docs', 'Document collection', 'Application', 3)
const loose = cluster('loose', 'Glossary', null, null)

describe('grouping', () => {
  it('groups by stage in stage order, pages by stage order, pages with no stage last', () => {
    const groups = clusterGroups(
      [loose, docs, apply, qualify].map((page) => ({ page, stage: page.stage ?? null, stageOrder: page.stageOrder ?? null })),
    )
    expect(groups.map((g) => [g.stage, g.entries.map((e) => e.page.title)])).toEqual([
      ['Qualification', ['Student lead qualification']],
      ['Application', ['Application follow-up', 'Document collection']],
      [null, ['Glossary']],
    ])
  })

  it('lists a page once, and leaves out a page with no address', () => {
    const groups = clusterGroups([
      { page: qualify, stage: 'Qualification', stageOrder: 1 },
      { page: qualify, stage: 'Other', stageOrder: 9 },
      { page: { ...qualify, id: 'x', slug: null } as any, stage: 'Qualification', stageOrder: 1 },
    ])
    expect(groups).toHaveLength(1)
    expect(groups[0].entries).toHaveLength(1)
  })
})

describe('next stage', () => {
  it('is the sibling with the next stage order', () => {
    expect(nextStage(qualify, [docs, apply, qualify])?.title).toBe('Application follow-up')
    expect(nextStage(apply, [docs, apply, qualify])?.title).toBe('Document collection')
  })

  it('is left out on the last stage, and for a page with no stage order', () => {
    expect(nextStage(docs, [docs, apply, qualify])).toBeNull()
    expect(nextStage(loose, [docs, apply, qualify])).toBeNull()
  })
})

describe('back link', () => {
  it("names the pillar by its primary keyword, else its title, else the stored breadcrumb", () => {
    expect(backLinkOf(qualify)).toEqual({ href: '/higher-education', label: 'education CRM' })
    expect(backLinkOf({ ...qualify, parent: { ...pillar, meta: {} } } as any)).toEqual({ href: '/higher-education', label: 'Higher education' })
    expect(backLinkOf({ ...qualify, parent: 'p1' } as any)).toEqual({ href: '/higher-education', label: 'Higher education' })
    expect(backLinkOf({ ...qualify, parent: 'p1', breadcrumbs: [] } as any)).toBeNull()
  })
})

describe('where the footer goes', () => {
  it('just before the first closing call to action shown, else at the end', () => {
    expect(closingSlot([{ blockType: 'content' }, { blockType: 'closingCta' }, { blockType: 'content' }])).toBe(1)
    expect(closingSlot([{ blockType: 'content' }, { blockType: 'closingCta', hidden: true }])).toBe(2)
    expect(closingSlot([{ blockType: 'content' }])).toBe(1)
    expect(closingSlot(null)).toBe(0)
  })
})

describe('the footer', () => {
  it('links back to the pillar by its keyword, and on to the next stage with its stage and title', () => {
    const html = renderToStaticMarkup(React.createElement(ClusterFooter, { page: qualify, siblings: [qualify, apply, docs] }))
    expect(html).toContain('<nav class="ncx-clusterfoot ncx-container" aria-label="More in this topic">')
    expect(html).toMatch(/<a class="back" href="\/higher-education">.*Back to education CRM<\/span><\/a>/)
    expect(html).toMatch(/<a class="next" href="\/higher-education\/apply"><span class="next-label">Next stage: Application<\/span><span class="next-title">Application follow-up/)
  })

  it('leaves the next-stage link out on the last stage, and draws nothing with neither link', () => {
    const last = renderToStaticMarkup(React.createElement(ClusterFooter, { page: docs, siblings: [qualify, apply, docs] }))
    expect(last).toContain('Back to education CRM')
    expect(last).not.toContain('class="next"')
    const none = renderToStaticMarkup(
      React.createElement(ClusterFooter, { page: { ...docs, parent: 'p1', breadcrumbs: [] } as any, siblings: [docs] }),
    )
    expect(none).toBe('')
  })

  it('uses brand variables only, no colour codes', () => {
    const html = renderToStaticMarkup(React.createElement(ClusterFooter, { page: qualify, siblings: [apply] }))
    const sheet = html.slice(html.indexOf('<style>'), html.indexOf('</style>'))
    expect(sheet).not.toMatch(/#[0-9a-fA-F]{3,8}\b|rgba?\(/)
  })
})

describe('the block', () => {
  let asked: string[] = []
  beforeEach(() => {
    draft = false
    asked = []
    vi.stubEnv('CMS_URL', 'http://cms.test')
    vi.stubGlobal(
      'fetch',
      vi.fn(async (input: string) => {
        const url = decodeURIComponent(String(input))
        asked.push(url)
        const docs = url.includes('where[parent][equals]=p1') ? [apply, qualify] : []
        return new Response(JSON.stringify({ docs, totalDocs: docs.length, totalPages: 1, page: 1 }), { status: 200 })
      }),
    )
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.unstubAllGlobals()
  })

  const render = async (props: object) => {
    const el = await ClusterLinksBlock({ blockType: 'clusterLinks', pageId: 'p1', ...props } as any)
    return el ? renderToStaticMarkup(el) : ''
  }

  it('lists the pages under the page it sits on and the extra pages, by stage, each with its description and link', async () => {
    const extra = { id: 'faq', title: 'Admissions FAQ', slug: 'admissions-faq', parent: null, _status: 'published', meta: { description: 'Common questions.' } }
    const html = await render({ heading: 'The admissions journey', extraPages: [{ page: extra, stage: 'Enquiry', stageOrder: 0 }] })
    expect(asked.some((u) => u.includes('/api/pages?') && u.includes('where[parent][equals]=p1') && u.includes('sort=stageOrder'))).toBe(true)
    const stages = [...html.matchAll(/<h3 class="stage">([^<]*)<\/h3>/g)].map((m) => m[1])
    expect(stages).toEqual(['Enquiry', 'Qualification', 'Application'])
    expect(html).toContain('<h2>The admissions journey</h2>')
    for (const [title, text, href] of [
      ['Admissions FAQ', 'Common questions.', '/admissions-faq'],
      ['Student lead qualification', 'Student lead qualification in one line.', '/higher-education/qualify'],
      ['Application follow-up', 'Application follow-up in one line.', '/higher-education/apply'],
    ]) {
      expect(html).toContain(title)
      expect(html).toContain(text)
      expect(html).toContain(`href="${href}"`)
    }
  })

  it('leaves out an extra page that is not published, outside draft mode', async () => {
    const extra = { id: 'd', title: 'Draft extra', slug: 'draft-extra', parent: null, _status: 'draft' }
    expect(await render({ extraPages: [{ page: extra, stage: 'Enquiry', stageOrder: 0 }] })).not.toContain('Draft extra')
  })

  it('is not drawn when there are no pages to show', async () => {
    expect(await render({ pageId: 'nobody', heading: 'Nothing here' })).toBe('')
  })
})
