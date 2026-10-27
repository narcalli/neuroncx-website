import React from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { LogoWallBlock } from '@/blocks/LogoWall/Component'
import { IndustryEntryPage, pageRows } from '@/components/industry/IndustryEntryPage'
import { industrySectionContent, sharedBlockHasContent } from '@/components/industry/IndustrySections'
import type { IndustryTopic, Sector } from '@/payload-types'

/**
 * Industry and topic pages with every page block: the hero from the layout,
 * free blocks drawn as on a Page, one closing panel, and the fixes to the
 * logo wall and empty shared content.
 */

vi.mock('next/headers', () => ({ draftMode: async () => ({ isEnabled: true }) }))
// The code block's copy button loads admin styles this runner cannot read.
vi.mock('@/blocks/Code/CopyButton', () => ({ CopyButton: () => null }))
// The live preview listener needs the app router, which a server render has not got.
vi.mock('@/components/LivePreviewListener', () => ({ LivePreviewListener: () => null }))

beforeEach(() => {
  vi.stubEnv('CMS_URL', 'http://cms.test')
  vi.stubGlobal('fetch', vi.fn(async () => new Response(JSON.stringify({ docs: [], totalDocs: 0, totalPages: 1, page: 1 }), { status: 200 })))
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.unstubAllGlobals()
})

const toHtml = async (node: React.ReactNode): Promise<string> => {
  const stream = await renderToReadableStream(React.createElement(React.Fragment, null, node))
  await stream.allReady
  return (await new Response(stream).text()).replace(/<!-- -->/g, '')
}

const industry = { id: 'edu', name: 'Higher education', slug: 'higher-education', path: '/higher-education', status: 'live', hasOwnPage: true, meta: {} }
const topic = (extra: object) =>
  ({
    id: 't1',
    name: 'Admission CRM',
    slug: 'admission-crm',
    path: '/higher-education/admission-crm',
    status: 'live',
    hasOwnPage: true,
    industry,
    stageOrder: 1,
    summary: 'Every applicant, from enquiry to enrolment.',
    overview: 'What the admission CRM does.',
    heroDesign: 'conversation',
    heroHeading: 'Admission CRM for universities',
    ...extra,
  }) as unknown as IndustryTopic

const page = (entry: IndustryTopic, footer?: React.ReactNode) =>
  toHtml(
    React.createElement(IndustryEntryPage, {
      collection: 'industryTopics',
      entry,
      trail: [{ label: 'Home', href: '/' }, { label: 'Higher education', href: '/higher-education' }, { label: entry.name }],
      draft: true,
      footer,
    }),
  )

const bento = { blockType: 'bentoGrid', title: 'Result-day campaigns', cards: [{ title: 'ZZ bento card', description: 'One message per applicant.', colSpan: '8' }] }
const carts = { blockType: 'agenticCartsDemo', heading: 'ZZ one cart per course', carts: [{ name: 'MBA', historyCount: 2 }, { name: 'BBA', historyCount: 0 }] }

describe('a draft topic with free blocks', () => {
  it('draws a bento grid and the carts demo among its sections, as on a Page', async () => {
    const out = await page(topic({ layout: [{ blockType: 'topicOverviewSection' }, bento, carts] }))
    expect(out).toContain('What the admission CRM does.')
    expect(out).toContain('Result-day campaigns')
    expect(out).toContain('ZZ bento card')
    expect(out).toContain('ZZ one cart per course')
    expect(out).toContain('MBA')
    expect(out.indexOf('What the admission CRM does.')).toBeLessThan(out.indexOf('ZZ bento card'))
    expect(out.indexOf('ZZ bento card')).toBeLessThan(out.indexOf('ZZ one cart per course'))
    expect(out.match(/<h1[\s>]/g)).toHaveLength(1)
  })
})

describe('the hero from the layout', () => {
  const hero = { blockType: 'statHero', headline: 'ZZ stat hero headline', stats: [{ value: 40, suffix: '%', label: 'fewer missed calls' }] }

  it('draws the first row as the hero, in place of the hero fields, with the breadcrumb bar', async () => {
    const out = await page(topic({ heroDesign: 'blockHero', layout: [hero, bento] }))
    expect(out).toContain('ZZ stat hero headline')
    expect(out).not.toContain('Admission CRM for universities')
    expect(out).toContain('aria-label="Breadcrumb"')
    expect(out.match(/<h1[\s>]/g)).toHaveLength(1)
  })

  it('keeps one H1: a hero row elsewhere, or with another hero design, is left out', async () => {
    expect(pageRows({ heroDesign: 'blockHero', layout: [hero, bento, { blockType: 'agenticHero' }] }).rows.map((r) => r.blockType)).toEqual(['statHero', 'bentoGrid'])
    expect(pageRows({ heroDesign: 'conversation', layout: [hero, bento] })).toEqual({ rows: [bento], heroFromLayout: false })
    // Hero block from the layout with no hero row: the hero fields draw the hero.
    expect(pageRows({ heroDesign: 'blockHero', layout: [bento] }).heroFromLayout).toBe(false)
    const out = await page(topic({ heroDesign: 'conversation', layout: [hero, bento] }))
    expect(out).not.toContain('ZZ stat hero headline')
    expect(out).toContain('Admission CRM for universities')
    expect(out.match(/<h1[\s>]/g)).toHaveLength(1)
  })
})

describe('one closing panel', () => {
  it('a closing call to action block is the closing panel: none is added, and the footer comes before it', async () => {
    const cta = { blockType: 'closingCta', heading: 'ZZ talk to admissions', primaryLabel: 'Book a call', primaryLink: '/contact' }
    const out = await page(topic({ showClosing: true, layout: [bento, cta] }), React.createElement('nav', { id: 'zz-footer' }, 'footer'))
    expect(out.match(/ZZ talk to admissions/g)).toHaveLength(1)
    expect(out).not.toContain('See Admission CRM at work')
    expect(out.indexOf('zz-footer')).toBeLessThan(out.indexOf('ZZ talk to admissions'))
  })

  it('without one, the closing panel follows the sections when switched on, after the footer', async () => {
    const out = await page(topic({ showClosing: true, layout: [bento] }), React.createElement('nav', { id: 'zz-footer' }, 'footer'))
    expect(out).toContain('See Admission CRM at work')
    expect(out.indexOf('zz-footer')).toBeLessThan(out.indexOf('See Admission CRM at work'))
  })
})

describe('the logo wall', () => {
  it('names without a logo use the muted text token, and the heading follows the alignment', async () => {
    const logos = [{ id: 'a', name: 'Campus ERP' }]
    const centred = await toHtml(React.createElement(LogoWallBlock, { heading: 'Works with', logos }))
    expect(centred).toContain('color:var(--ncx-muted)')
    expect(centred).not.toContain('var(--ncx-faint)')
    expect(centred).toContain('data-align="center"')
    expect(await toHtml(React.createElement(LogoWallBlock, { heading: 'Works with', logos, align: 'left' }))).toContain('data-align="left"')
  })
})

describe('shared content', () => {
  const entry = { id: 'edu', name: 'Higher education' } as unknown as Sector
  const shared = (block: object, status = 'published') => industrySectionContent('shared', { blockType: 'sharedSection', item: { id: 's', _status: status, block: [block] } }, entry)

  it('an empty record renders nothing, so no wrapper or spacing is left', async () => {
    expect(sharedBlockHasContent({ blockType: 'trustPanel', cards: [] })).toBe(false)
    expect(sharedBlockHasContent({ blockType: 'howItWorks2', steps: [] })).toBe(false)
    expect(sharedBlockHasContent({ blockType: 'trustPanel', heading: 'Your data stays yours', cards: [] })).toBe(true)
    expect(await shared({ blockType: 'trustPanel', buttonHref: '/contact', cards: [] })).toBeNull()
    expect(await shared({ blockType: 'howItWorks2', steps: [] }, 'draft')).toBeNull()
    expect(await shared({ blockType: 'howItWorks2', steps: [{ title: 'Connect' }] })).not.toBeNull()
  })
})
