import React from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

// The CMS: the main Integrations master, with the hand-made page rebuilt in its Page layout.
const { getMany } = vi.hoisted(() => ({ getMany: vi.fn() }))
vi.mock('@/utilities/cms', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utilities/cms')>()),
  getMany,
}))
vi.mock('@/utilities/siteSettings', () => ({
  getSiteSettings: async () => ({ siteName: 'NeuronCx', titleSuffix: '' }),
  siteFileUrl: () => null,
}))

import IntegrationsPage, { generateMetadata } from '@/app/(frontend)/integrations/page'
import { pageSitemapEntries } from '@/utilities/pages'
import { redirects } from '../../redirects'

const toHtml = async (node: React.ReactNode): Promise<string> => {
  const stream = await renderToReadableStream(React.createElement(React.Fragment, null, node))
  await stream.allReady
  return (await new Response(stream).text()).replace(/<!-- -->/g, '')
}

const master = {
  id: 'm1',
  name: 'Main integrations page',
  isMain: true,
  h1: 'WhatsApp CRM integration for the systems you already use',
  heroDesign: 'blockHero',
  layout: [
    { blockType: 'statHero', headline: 'Plugged into the systems you already run' },
    { blockType: 'integrationsClosingSection' },
  ],
  closing: { heading: "Tell us what you're running" },
  meta: { title: 'Integrations: Telephony, Booking and Payments | NeuronCx', description: 'NeuronCx connects to your systems.' },
}

describe('/integrations from the main Integrations master', () => {
  beforeEach(() => {
    getMany.mockReset()
    getMany.mockImplementation(async (collection: string, query: Record<string, unknown>) =>
      collection === 'integrationsMaster' && query['where[isMain][equals]'] === true ? [master] : [],
    )
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://neuroncx.in')
  })
  afterEach(() => vi.unstubAllEnvs())

  it("draws the master's Page layout with the breadcrumbs in its hero block and one H1", async () => {
    const html = await toHtml(await IntegrationsPage())
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(html).toContain('<h1>Plugged into the systems you already run</h1>')
    expect(html.indexOf('aria-label="Breadcrumb"')).toBeLessThan(html.indexOf('Plugged into the systems'))
    expect(html).toContain("Tell us what you&#x27;re running")
  })

  it("takes the master's SEO title and description, with /integrations as canonical", async () => {
    const meta = await generateMetadata()
    expect(meta.title).toBe('Integrations: Telephony, Booking and Payments | NeuronCx')
    expect(meta.description).toBe('NeuronCx connects to your systems.')
    expect(meta.alternates?.canonical).toBe('https://neuroncx.in/integrations')
  })

  it('sends /integration and the old preview to /integrations for good, and lists neither CMS page in the sitemap', async () => {
    const list = await redirects!()
    expect(list).toContainEqual({ source: '/integration', destination: '/integrations', permanent: true })
    expect(list).toContainEqual({ source: '/integrations-preview', destination: '/integrations', permanent: true })
    const entries = pageSitemapEntries([{ slug: 'integrations' }, { slug: 'integration' }, { slug: 'contact' }] as never, 'https://neuroncx.in')
    expect(entries.map((e) => e.loc)).toEqual(['https://neuroncx.in/contact'])
  })
})
