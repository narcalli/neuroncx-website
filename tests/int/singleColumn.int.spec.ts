import React from 'react'
import { renderToStaticMarkup } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { AgenticHeroBlock } from '@/blocks/AgenticHero/Component'
import { AudienceTabsBlock } from '@/blocks/AudienceTabs/Component'
import { ContextEngineBlock } from '@/blocks/ContextEngine/Component'
import { ConversationHeroBlock } from '@/blocks/ConversationHero/Component'
import { DetailedProductSuiteBlock } from '@/blocks/DetailedProductSuite/Component'
import { FeatureThreadBlock } from '@/blocks/FeatureThread/Component'
import { HeroCustomBlock } from '@/blocks/HeroCustom/Component'
import { HeroStackBlock } from '@/blocks/HeroStack/Component'
import { HeroWorkforceGridBlock } from '@/blocks/HeroWorkforceGrid/Component'
import { ProblemStatementBlock } from '@/blocks/ProblemStatement/Component'
import { TrustPanelBlock } from '@/blocks/TrustPanel/Component'

/**
 * A two-column block with nothing beside its text (no visual, image, cards,
 * chat or diagram) marks itself single-column, and its text takes the full
 * width instead of half. With the second column filled it keeps two.
 */

const html = (Component: React.ComponentType<any>, props: Record<string, unknown>) =>
  renderToStaticMarkup(React.createElement(Component, props))
// The attribute on elements only; the blocks' own styles name it inside brackets.
const cols = (markup: string) => [...markup.matchAll(/\sdata-cols="(\d)"/g)].map((m) => m[1])

describe('a block with nothing beside its text goes single-column', () => {
  it('problem statement: without systems', () => {
    const base = { heading: 'What gets in the way', intro: 'Three things.', problems: [{ title: 'Leads go cold', description: 'No call back.' }] }
    const single = html(ProblemStatementBlock, base)
    expect(cols(single)).toEqual(['1'])
    expect(single).toContain('.ncx-prob .grid[data-cols="1"]{grid-template-columns:minmax(0,1fr)}')
    expect(single).toContain('.ncx-prob .grid[data-cols="1"] .intro{max-width:none}')
    expect(single).not.toContain('class="visual"')
    expect(cols(html(ProblemStatementBlock, { ...base, systems: [{ name: 'CRM' }, { name: 'ERP' }] }))).toEqual(['2'])
  })

  it('hero (custom CSS): without a visual, whatever its position', () => {
    for (const visualPosition of ['right', 'left', 'below', 'background']) {
      expect(cols(html(HeroCustomBlock, { headline: 'One record', visualPosition })), visualPosition).toEqual(['1'])
    }
    const withVisual = html(HeroCustomBlock, { headline: 'One record', visualHtml: '<div class="v">Visual</div>', visualAlt: 'A visual' })
    expect(cols(withVisual)).toEqual([])
    expect(withVisual).toContain('.ncx-hcx .hcx-grid[data-cols="1"] .hcx-copy,.ncx-hcx .hcx-grid[data-cols="1"] .hcx-sub{max-width:none}')
  })

  it('context engine: without satellites for the map', () => {
    const base = { heading: 'Every enquiry captured', points: [{ title: 'Web form', description: 'Saved.' }] }
    expect(cols(html(ContextEngineBlock, base))).toEqual(['1'])
    expect(cols(html(ContextEngineBlock, { ...base, satellites: [{ label: 'WhatsApp' }, { label: 'Calls' }] }))).toEqual(['2'])
  })

  it('trust panel: without cards', () => {
    expect(cols(html(TrustPanelBlock, { heading: 'Your data stays yours', intro: 'Hosted in India.' }))).toEqual(['1'])
    expect(cols(html(TrustPanelBlock, { heading: 'Your data stays yours', cards: [{ title: 'Encrypted', description: 'At rest.' }] }))).toEqual(['2'])
  })

  it('conversation hero: without a chat', () => {
    expect(cols(html(ConversationHeroBlock, { headline: 'Every lead answered', subhead: 'Day and night.' }))).toEqual(['1'])
    expect(cols(html(ConversationHeroBlock, { headline: 'Every lead answered', conversation: 'them: Is the MBA open?\nus: Yes, until June.' }))).toEqual(['2'])
  })

  it('audience tabs: a tab without points', () => {
    const tabs = [
      { id: 'a', label: 'Leadership', title: 'Leadership', intro: 'Sees the intake.' },
      { id: 'b', label: 'Counsellors', title: 'Counsellors', points: [{ text: 'Call scores.' }] },
    ]
    expect(cols(html(AudienceTabsBlock, { heading: 'What each team gets', tabs }))).toEqual(['1', '2'])
  })

  it('hero workforce grid: without cards, and no empty box is left', () => {
    const single = html(HeroWorkforceGridBlock, { headline: 'A workforce that never sleeps' })
    expect(cols(single)).toEqual(['1'])
    expect(single).not.toContain('class="grid-wrap"')
    const two = html(HeroWorkforceGridBlock, { headline: 'A workforce', cards: [{ title: 'Fees', label: 'Agent', description: 'Chases fees.' }] })
    expect(cols(two)).toEqual(['2'])
    expect(two).toContain('class="grid-wrap"')
  })

  it('agentic hero: without nodes for the diagram', () => {
    const single = html(AgenticHeroBlock, { headline: 'Agents that close the loop', intro: 'From enquiry to enrolment.' })
    expect(cols(single)).toEqual(['1'])
    expect(single).toContain('.ncx-hero[data-cols="1"] .hero-p{max-width:none}')
    expect(cols(html(AgenticHeroBlock, { headline: 'Agents', nodes: [{ label: 'Fees', kind: 'agent' }] }))).toEqual(['2'])
  })

  it('hero stack: without products that have a screenshot, keeping the intro on phones', () => {
    const single = html(HeroStackBlock, { heading: 'The platform', intro: 'One place.', products: [{ label: 'CRM', caption: 'No screenshot yet.' }] })
    expect(cols(single)).toEqual(['1'])
    expect(single).toContain('.ncx-hstack .hs-pin[data-cols="1"] .hs-intro{display:block}')
  })
})

describe('a two-column grid of cards', () => {
  it('detailed product suite: a card alone on the last row takes the full width', () => {
    const cards = [{ title: 'Fees' }, { title: 'Admissions' }, { title: 'Alumni' }]
    const out = html(DetailedProductSuiteBlock, { title: 'The suite', cards })
    expect(out).toContain('.ncx-dps .grid:not(.cols-1) > :last-child:nth-child(odd){grid-column:1 / -1}')
  })

  describe('feature thread', () => {
    let docs: object[] = []
    beforeEach(() => {
      vi.stubEnv('CMS_URL', 'http://cms.test')
      vi.stubGlobal(
        'fetch',
        vi.fn(async (input: string) => {
          const url = decodeURIComponent(String(input))
          const found = url.includes('where[category][equals]=omnichannel-cx') ? docs : []
          return new Response(JSON.stringify({ docs: found, totalDocs: found.length }), { status: 200 })
        }),
      )
    })
    afterEach(() => {
      vi.unstubAllEnvs()
      vi.unstubAllGlobals()
    })
    const render = async () => {
      const el = await (FeatureThreadBlock as any)({ heading: 'How it fits together', categories: ['omnichannel-cx'], limitPerCategory: 3 })
      return el ? renderToStaticMarkup(el) : ''
    }

    it('a single item: one column, the thread on its left', async () => {
      docs = [{ id: 'f1', title: 'One inbox', summary: 'Every channel.' }]
      const out = await render()
      expect(cols(out)).toEqual(['1'])
      expect(out).toContain('.ncx-thread .spine[data-cols="1"]{grid-template-columns:1fr}')
      docs = [
        { id: 'f1', title: 'One inbox' },
        { id: 'f2', title: 'Routing' },
      ]
      expect(cols(await render())).toEqual(['2'])
    })
  })
})
