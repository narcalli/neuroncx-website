import React from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { describe, expect, it, vi } from 'vitest'

// No CMS: no categories and no integration items, so the parts under test draw from the record alone.
vi.mock('@/utilities/cms', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utilities/cms')>()),
  getMany: async () => [],
}))

import { IntegrationsLandingBlock } from '@/blocks/IntegrationsLanding/Component'
import type { IntegrationsMaster } from '@/payload-types'

const toHtml = async (node: React.ReactNode): Promise<string> => {
  const stream = await renderToReadableStream(React.createElement(React.Fragment, null, node))
  await stream.allReady
  return (await new Response(stream).text()).replace(/<!-- -->/g, '')
}

const master = (over: Partial<IntegrationsMaster> = {}) =>
  ({
    id: 'm1',
    name: 'Main integrations page',
    h1: 'Master hero heading',
    fiveThingsHeading: 'Five things heading',
    fiveThings: [
      { id: 'f1', title: 'One', line: 'First line.' },
      { id: 'f2', title: 'Two', line: 'Second line.' },
      { id: 'f3', title: 'Three', line: 'Third line.' },
    ],
    apiCard: { heading: 'API card heading', line: 'Build on the API.' },
    closing: { heading: 'Closing heading' },
    ...over,
  }) as unknown as IntegrationsMaster

const crumbs = React.createElement('nav', { 'aria-label': 'Breadcrumb' }, 'TRAIL')
const render = async (m: IntegrationsMaster) => toHtml(await IntegrationsLandingBlock({ record: m, leading: crumbs }))
const at = (html: string, text: string) => html.indexOf(text)

describe('the Integrations master Page layout', () => {
  it('draws the standard page with no layout: the master hero, then every part in order, in one wrapper', async () => {
    const html = await render(master())
    expect(html).toContain('<h1>Master hero heading</h1>')
    expect(at(html, 'TRAIL')).toBeLessThan(at(html, 'Master hero heading'))
    expect(at(html, 'Five things heading')).toBeLessThan(at(html, 'API card heading'))
    expect(at(html, 'API card heading')).toBeLessThan(at(html, 'Closing heading'))
    expect(html.match(/class="ncx-ihub"/g)).toHaveLength(1)
  })

  it('draws exactly the layout rows, with a hero block first taking the H1 and the breadcrumbs', async () => {
    const html = await render(
      master({
        heroDesign: 'blockHero',
        layout: [
          { blockType: 'statHero', headline: 'Plugged into the systems you already run' },
          { blockType: 'integrationsClosingSection' },
          { blockType: 'integrationsFiveThingsSection' },
        ],
      } as Partial<IntegrationsMaster>),
    )
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(html).toContain('<h1>Plugged into the systems you already run</h1>')
    expect(html).not.toContain('Master hero heading')
    expect(at(html, 'TRAIL')).toBeLessThan(at(html, 'Plugged into the systems'))
    // In the editor's order, and only the parts placed.
    expect(at(html, 'Closing heading')).toBeLessThan(at(html, 'Five things heading'))
    expect(html).not.toContain('API card heading')
    // Each part has its own wrapper; the page block sits outside them.
    expect(html.match(/class="ncx-ihub"/g)).toHaveLength(2)
  })

  it("keeps the master's hero with Integrations hero, and leaves out hidden page blocks", async () => {
    const html = await render(
      master({
        heroDesign: 'fields',
        layout: [
          { blockType: 'integrationsApiCardSection' },
          { blockType: 'content', hidden: true, columns: [] },
        ],
      } as Partial<IntegrationsMaster>),
    )
    expect(html).toContain('<h1>Master hero heading</h1>')
    expect(html).toContain('API card heading')
    expect(html).not.toContain('Five things heading')
    expect(html).not.toContain('Closing heading')
  })
})
