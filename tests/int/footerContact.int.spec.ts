import React from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

/**
 * The footer's contact heading: plain text by default, and a link when the CMS
 * is set to link it (Footer global: contactHeading, linkContactHeading, contactLink).
 */

const globals: Record<string, any> = {}

vi.mock('@/utilities/cms', async () => {
  const actual = await vi.importActual<typeof import('@/utilities/cms')>('@/utilities/cms')
  return { ...actual, getGlobal: async (slug: string) => globals[slug] ?? null }
})

const footer = (over: Record<string, unknown> = {}) => ({
  email: 'team@neuroncx.in',
  columns: [],
  legalItems: [],
  ...over,
})

const render = async () => {
  const { Footer } = await import('@/Footer/Component')
  const stream = await renderToReadableStream(React.createElement(React.Fragment, null, await Footer()))
  await stream.allReady
  return (await new Response(stream).text()).replace(/<!-- -->/g, '')
}

/** The contact heading's own markup. The inline stylesheet mentions the same class names. */
const contactHeading = (html: string) => (html.match(/<h2 class="ncx-footer__h">(?:(?!<\/h2>).)*<\/h2>/g) ?? []).at(-1) ?? ''

beforeEach(() => {
  globals.footer = footer()
  globals.header = { logo: null }
  vi.stubEnv('CMS_URL', 'http://cms.test')
})
afterEach(() => {
  vi.unstubAllEnvs()
  vi.resetModules()
})

describe('the footer contact heading', () => {
  it('is plain text when the CMS does not link it', async () => {
    const heading = contactHeading(await render())
    expect(heading).toBe('<h2 class="ncx-footer__h">Contact</h2>')
  })

  it('uses the heading the CMS gives it', async () => {
    globals.footer = footer({ contactHeading: 'Talk to us' })
    expect(contactHeading(await render())).toContain('Talk to us')
  })

  it('links the heading to the chosen page', async () => {
    globals.footer = footer({
      linkContactHeading: true,
      contactLink: { type: 'reference', reference: { relationTo: 'pages', value: { slug: 'contact' } } },
    })
    const heading = contactHeading(await render())
    expect(heading).toContain('href="/contact"')
    expect(heading).toContain('ncx-footer__hlink')
    expect(heading).toContain('>Contact</a>')
  })

  it('links the heading to a custom address, and opens a new tab when asked', async () => {
    globals.footer = footer({
      linkContactHeading: true,
      contactLink: { type: 'custom', url: 'https://help.example.test', newTab: true },
    })
    const heading = contactHeading(await render())
    expect(heading).toContain('href="https://help.example.test"')
    expect(heading).toContain('target="_blank"')
    expect(heading).toContain('rel="noopener noreferrer"')
  })

  it('falls back to Contact when the heading is left empty', async () => {
    globals.footer = footer({ contactHeading: '', linkContactHeading: true, contactLink: { type: 'custom', url: '/contact' } })
    expect(contactHeading(await render())).toContain('>Contact</a>')
  })

  it('still shows the email and phone as their own links', async () => {
    globals.footer = footer({ phone: '+911234567890' })
    const html = await render()
    expect(html).toContain('href="mailto:team@neuroncx.in"')
    expect(html).toContain('href="tel:+911234567890"')
  })
})
