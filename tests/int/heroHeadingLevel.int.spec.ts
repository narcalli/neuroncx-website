import React from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

vi.mock('@/components/PayloadRedirects', () => ({ PayloadRedirects: () => null }))
vi.mock('@/components/LivePreviewListener', () => ({ LivePreviewListener: () => null }))
vi.mock('@/utilities/clusters', () => ({ loadClusterPages: async () => [] }))

import { PageView } from '@/components/PageView'
import { AgenticHeroBlock } from '@/blocks/AgenticHero/Component'
import { ConversationHeroBlock } from '@/blocks/ConversationHero/Component'
import { HeroCustomBlock } from '@/blocks/HeroCustom/Component'
import { HeroFullBackgroundBlock } from '@/blocks/HeroFullBackground/Component'
import { HeroHarnessBlock } from '@/blocks/HeroHarness/Component'
import { HeroRightPlacementBlock } from '@/blocks/HeroRightPlacement/Component'
import { HeroStackBlock } from '@/blocks/HeroStack/Component'
import { HeroWorkforceGridBlock } from '@/blocks/HeroWorkforceGrid/Component'
import { StatHeroBlock } from '@/blocks/StatHero/Component'
import { IntegrationsLandingBlock } from '@/blocks/IntegrationsLanding/Component'
import type { IntegrationsMaster, Page } from '@/payload-types'

const toHtml = async (node: React.ReactNode): Promise<string> => {
  const stream = await renderToReadableStream(React.createElement(React.Fragment, null, node))
  await stream.allReady
  return (await new Response(stream).text()).replace(/<!-- -->/g, '')
}

describe('hero block heading levels', () => {
  it('renders h1 on the first hero block and h2 on the second hero block when the page hero is none', async () => {
    const page = {
      id: 'omni',
      title: 'Omnichannel CX',
      slug: 'omnichannel-cx',
      hero: { type: 'none' },
      layout: [
        {
          blockType: 'statHero',
          headline: 'Every conversation handled, on the channel they chose',
        },
        {
          blockType: 'conversationHero',
          headline: 'From slot enquiry to booked',
          subhead: 'Checks availability.',
        },
      ],
    } as unknown as Page

    const html = await toHtml(await PageView({ page, url: '/omnichannel-cx', draft: false }))
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(html).toContain('<h1>Every conversation handled, on the channel they chose</h1>')
    expect(html).toContain('<h2>From slot enquiry to booked</h2>')
  })

  it('renders h2 on a hero block when the page has its own hero', async () => {
    const page = {
      id: 'with-hero',
      title: 'With Page Hero',
      slug: 'with-hero',
      hero: {
        type: 'lowImpact',
        richText: {
          root: {
            type: 'root',
            children: [
              {
                type: 'heading',
                tag: 'h1',
                children: [{ type: 'text', text: 'Page level hero heading', version: 1 }],
                version: 1,
              },
            ],
            direction: null,
            format: '',
            indent: 0,
            version: 1,
          },
        },
      },
      layout: [
        {
          blockType: 'statHero',
          headline: 'Section hero below page hero',
        },
      ],
    } as unknown as Page

    const html = await toHtml(await PageView({ page, url: '/with-hero', draft: false }))
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(html).toContain('<h2>Section hero below page hero</h2>')
  })

  it('switches between h1 and h2 across all 10 hero blocks', async () => {
    const master = { id: 'm1', h1: 'Connect your stack' } as unknown as IntegrationsMaster
    const cases: [string, (level: 'h1' | 'h2') => Promise<React.ReactNode> | React.ReactNode][] = [
      ['agenticHero', (headingLevel) => React.createElement(AgenticHeroBlock, { blockType: 'agenticHero', headline: 'Title', headingLevel })],
      ['conversationHero', (headingLevel) => React.createElement(ConversationHeroBlock, { headline: 'Title', headingLevel })],
      ['heroCustom', (headingLevel) => React.createElement(HeroCustomBlock, { blockType: 'heroCustom', headline: 'Title', headingLevel } as never)],
      ['heroFullBackground', (headingLevel) => React.createElement(HeroFullBackgroundBlock, { headline: 'Title', headingLevel })],
      ['heroHarness', (headingLevel) => React.createElement(HeroHarnessBlock, { blockType: 'heroHarness', headline: 'Title', headingLevel } as never)],
      ['heroRightPlacement', (headingLevel) => React.createElement(HeroRightPlacementBlock, { headline: 'Title', headingLevel })],
      ['heroStack', (headingLevel) => React.createElement(HeroStackBlock, { blockType: 'heroStack', heading: 'Title', products: [], headingLevel })],
      ['heroWorkforceGrid', (headingLevel) => React.createElement(HeroWorkforceGridBlock, { headline: 'Title', headingLevel })],
      ['statHero', (headingLevel) => React.createElement(StatHeroBlock, { headline: 'Title', headingLevel })],
      ['integrationsLanding', async (headingLevel) => await IntegrationsLandingBlock({ record: master, headingLevel })],
    ]

    for (const [name, build] of cases) {
      const h1Html = await toHtml(await build('h1'))
      const h2Html = await toHtml(await build('h2'))
      expect(h1Html, `${name} h1`).toMatch(/<h1[\s>]/)
      expect(h2Html, `${name} h2`).not.toMatch(/<h1[\s>]/)
      expect(h2Html, `${name} h2`).toMatch(/<h2[\s>]/)
    }
  })
})
