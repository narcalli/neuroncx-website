import React from 'react'
import { renderToReadableStream } from 'react-dom/server'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { getPaginated } = vi.hoisted(() => ({ getPaginated: vi.fn() }))
vi.mock('@/utilities/cms', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@/utilities/cms')>()),
  getPaginated,
}))
vi.mock('@/utilities/siteSettings', () => ({
  getSiteSettings: async () => ({ siteName: 'NeuronCx', titleSuffix: '' }),
  siteFileUrl: () => null,
}))

import PostsIndexPage from '@/app/(frontend)/posts/page'
import PostsPage, { generateMetadata } from '@/app/(frontend)/posts/page/[pageNumber]/page'
import { redirects } from '../../redirects'

const toHtml = async (node: React.ReactNode): Promise<string> => {
  const stream = await renderToReadableStream(React.createElement(React.Fragment, null, node))
  await stream.allReady
  return (await new Response(stream).text()).replace(/<!-- -->/g, '')
}

const post = (n: number) => ({ id: `p${n}`, slug: `post-${n}`, title: `Post ${n}`, publishedAt: '2026-09-17T05:00:00.000Z' })
// 14 posts: page 1 holds 12, page 2 the other 2.
const pageOf = (page: number) => ({
  docs: page === 1 ? Array.from({ length: 12 }, (_, i) => post(i + 1)) : page === 2 ? [post(13), post(14)] : [],
  page,
  totalDocs: 14,
  totalPages: 2,
})
const params = (pageNumber: string) => ({ params: Promise.resolve({ pageNumber }) })

describe('the blog index pages', () => {
  beforeEach(() => {
    getPaginated.mockReset()
    getPaginated.mockImplementation(async (_c: string, query: { page: number }) => pageOf(query.page))
    vi.stubEnv('NEXT_PUBLIC_SERVER_URL', 'https://neuroncx.in')
  })
  afterEach(() => vi.unstubAllEnvs())

  it('links page 2 from /posts as /posts/page/2, and never links /posts/page/1', async () => {
    const html = await toHtml(await PostsIndexPage())
    expect(html).toContain('href="/posts/page/2"')
    expect(html).toContain('rel="next"')
    expect(html).toContain('<span class="pager-num is-current" aria-current="page">1</span>')
    expect(html).not.toContain('/posts/page/1')
  })

  it("draws page 2 with /posts's template, its posts, and Home, Blog, Page 2 breadcrumbs", async () => {
    const html = await toHtml(await PostsPage(params('2')))
    expect(html.match(/<h1[\s>]/g)).toHaveLength(1)
    expect(html).toContain('<h1>Articles and guides</h1>')
    expect(html).toContain('href="/posts/post-13"')
    expect(html).not.toContain('href="/posts/post-1"')
    expect(html).toContain('href="/posts"')
    expect(html).toContain('Page 2')
    // Back to page 1 is /posts itself.
    expect(html).toMatch(/<a class="pager-step" rel="prev" href="\/posts">|<a class="pager-step" href="\/posts" rel="prev">/)
    expect(html).not.toContain('/posts/page/1')
  })

  it('gives page 2 its own title, description and canonical through generateMeta', async () => {
    const meta = await generateMetadata(params('2'))
    expect(meta.title).toBe('Blog, page 2 | NeuronCx')
    expect(meta.description).toMatch(/^Page 2 of the articles and guides/)
    expect(meta.alternates?.canonical).toBe('https://neuroncx.in/posts/page/2')
  })

  it('redirects page 1 to /posts, and has no page past the last or that is not a number', async () => {
    await expect(PostsPage(params('1'))).rejects.toMatchObject({ digest: expect.stringContaining('/posts') })
    await expect(PostsPage(params('3'))).rejects.toMatchObject({ digest: expect.stringContaining('404') })
    await expect(PostsPage(params('two'))).rejects.toMatchObject({ digest: expect.stringContaining('404') })
    await expect(PostsPage(params('0'))).rejects.toMatchObject({ digest: expect.stringContaining('404') })
    const list = await redirects!()
    expect(list).toContainEqual({ source: '/posts/page/1', destination: '/posts', permanent: true })
  })
})
