import React from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getPaginated } = vi.hoisted(() => ({
  getPaginated: vi.fn(),
}))

vi.mock('@/utilities/cms', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/utilities/cms')>()
  return {
    ...actual,
    getPaginated,
  }
})

vi.mock('@/utilities/siteSettings', () => ({
  getSiteSettings: async () => ({ siteName: 'NeuronCx', titleSuffix: '' }),
  siteFileUrl: () => null,
}))

import PostsIndexPage, { generateMetadata } from '@/app/(frontend)/posts/page'
import { redirects } from '../../redirects'

const toHtml = async (node: React.ReactNode): Promise<string> => {
  const stream = await renderToReadableStream(React.createElement(React.Fragment, null, node))
  await stream.allReady
  return (await new Response(stream).text()).replace(/<!-- -->/g, '')
}

describe('the /posts index page', () => {
  beforeEach(() => {
    getPaginated.mockReset()
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://neuroncx.in')
  })

  afterEach(() => {
    vi.unstubAllEnvs()
  })

  it('lists published posts sorted by -publishedAt with h1 "Articles and guides" and paragraph fallback for short meta descriptions', async () => {
    getPaginated.mockResolvedValue({
      docs: [
        {
          id: 'p1',
          slug: 'four-essential-whatsapp-flows-for-healthcare',
          title: 'Four Essential Whatsapp Flows for Healthcare Establishments',
          publishedAt: '2026-09-17T05:39:19.418Z',
          meta: { description: 'Omnichannel Cx' },
          content: {
            root: {
              children: [
                {
                  type: 'paragraph',
                  children: [
                    {
                      type: 'text',
                      text: 'Customized transactional WhatsApp forms that use the WhatsApp Business API.',
                    },
                  ],
                },
              ],
            },
          },
        },
        {
          id: 'p2',
          slug: 'can-whatsapp-flow-api-form-compare-with-native-apps-experience',
          title: 'Whatsapp Flows vs Native App Carts',
          publishedAt: '2026-09-17T05:43:50.422Z',
          meta: { description: 'Are They Ready to Replace Native App Carts in production?' },
        },
      ],
      page: 1,
      totalDocs: 2,
      totalPages: 1,
      hasNextPage: false,
      hasPrevPage: false,
    })

    const html = await toHtml(await PostsIndexPage())
    expect(getPaginated).toHaveBeenCalledWith(
      'posts',
      expect.objectContaining({
        depth: 1,
        limit: 12,
        page: 1,
        sort: '-publishedAt',
        'where[_status][equals]': 'published',
      }),
      expect.objectContaining({ tags: ['cms', 'posts'] }),
    )
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(html).toContain('<h1>Articles and guides</h1>')
    expect(html).toContain('aria-label="Breadcrumb"')
    expect(html).toContain('href="/posts/four-essential-whatsapp-flows-for-healthcare"')
    expect(html).toContain('<h2>Four Essential Whatsapp Flows for Healthcare Establishments</h2>')
    expect(html).toContain('Customized transactional WhatsApp forms that use the WhatsApp Business API.')
    expect(html).not.toContain('>Omnichannel Cx<')
    expect(html).toContain('Are They Ready to Replace Native App Carts in production?')
  })

  it('skips a description or opening paragraph that repeats the title, and keeps the words inside links', async () => {
    getPaginated.mockResolvedValue({
      docs: [
        {
          id: 'p3',
          slug: 'leverage-whatsapp-flows',
          title: 'Leverage WhatsApp Flows for Transactional Forms | NeuronCX',
          meta: { description: 'Leverage WhatsApp Flows for Transactional Forms' },
          content: {
            root: {
              children: [
                { type: 'paragraph', children: [{ type: 'text', text: 'Leverage WhatsApp Flows for Transactional Forms' }] },
                {
                  type: 'paragraph',
                  children: [
                    { type: 'text', text: 'Flows now carry ' },
                    { type: 'link', children: [{ type: 'text', text: 'multi-step forms' }] },
                    { type: 'text', text: ' with validation inside the chat.' },
                  ],
                },
              ],
            },
          },
        },
        { id: 'p4', slug: 'no-body', title: 'A post with no body', meta: { description: 'Omnichannel Cx' } },
      ],
      page: 1,
      totalDocs: 2,
      totalPages: 1,
    })

    const html = await toHtml(await PostsIndexPage())
    expect(html).toContain('<p class="excerpt">Flows now carry multi-step forms with validation inside the chat.</p>')
    expect(html).not.toContain('<p class="excerpt">Leverage WhatsApp Flows')
    // Nothing worth showing: no excerpt at all rather than "Omnichannel Cx".
    expect(html).toContain('<h2>A post with no body</h2></a>')
  })

  it('builds metadata through generateMeta with canonical /posts', async () => {
    const meta = await generateMetadata()
    expect(meta.title).toBe('Blog: Conversational AI and WhatsApp Flows | NeuronCx')
    expect(meta.alternates?.canonical).toBe('https://neuroncx.in/posts')
  })

  it('redirects /blog permanently to /posts in redirects.ts', async () => {
    const list = await redirects!()
    expect(list).toContainEqual({
      source: '/blog',
      destination: '/posts',
      permanent: true,
    })
  })
})
