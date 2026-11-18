import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { Breadcrumbs } from '@/components/Breadcrumbs'
import type { Post } from '@/payload-types'
import { CMS_TAG, getPaginated } from '@/utilities/cms'
import { generateMeta } from '@/utilities/generateMeta'

/**
 * The blog index: /posts is page 1 and /posts/page/N the later pages, one
 * template for both. /posts/page/1 redirects to /posts (redirects.ts), so the
 * first page has one address, and the page links here are real links that
 * never point at /posts/page/1.
 */

export const POSTS_PER_PAGE = 12

/** A page of the index: /posts for the first, /posts/page/N for the rest. */
export const postsPageHref = (page: number): string =>
  page <= 1 ? '/posts' : `/posts/page/${page}`

export const loadPostsPage = (page: number) =>
  getPaginated<Post>(
    'posts',
    {
      depth: 1,
      limit: POSTS_PER_PAGE,
      page,
      sort: '-publishedAt',
      'where[_status][equals]': 'published',
    },
    { tags: [CMS_TAG, 'posts'] },
  )

const BLOG_TITLE = 'Blog: Conversational AI and WhatsApp Flows | NeuronCx'
const BLOG_DESCRIPTION =
  'Articles and guides from the NeuronCx team on WhatsApp Flows, chatbots and AI agents on WhatsApp, for healthcare, higher education and retail.'

/** Each page's title, description and canonical, through generateMeta like every other page. */
export const postsMetadata = (page: number): Promise<Metadata> =>
  generateMeta({
    doc: {
      title: 'Blog',
      slug: 'posts',
      meta:
        page <= 1
          ? { title: BLOG_TITLE, description: BLOG_DESCRIPTION }
          : {
              title: `Blog, page ${page} | NeuronCx`,
              description: `Page ${page} of the articles and guides from the NeuronCx team on WhatsApp Flows, chatbots and AI agents on WhatsApp.`,
            },
    },
    path: postsPageHref(page),
  })

type RichNode = { type?: string; text?: string; children?: RichNode[] }

/** A node's text, including the words inside links and other inline nodes. */
const textOf = (node: RichNode): string =>
  typeof node.text === 'string'
    ? node.text
    : Array.isArray(node.children)
      ? node.children.map(textOf).join('')
      : ''

const wordsOf = (s: string): string[] =>
  s
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean)

/** Most of its words (four in five) are already in the title, so the card would say it twice. */
const repeatsTitle = (text: string, title: string): boolean => {
  const own = wordsOf(text)
  const inTitle = new Set(wordsOf(title))
  return !own.length || own.filter((w) => inTitle.has(w)).length / own.length >= 0.8
}

const shorten = (text: string): string =>
  text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text

/** The first paragraph that adds something to the title (many posts open by restating it). */
const firstParagraph = (
  content: Post['content'] | null | undefined,
  title: string,
): string | null => {
  const children = content?.root?.children as RichNode[] | undefined
  if (!Array.isArray(children)) return null
  for (const node of children) {
    if (node.type !== 'paragraph') continue
    const text = textOf(node).replace(/\s+/g, ' ').trim()
    if (text && !repeatsTitle(text, title)) return shorten(text)
  }
  return null
}

/**
 * The SEO description when it says something of its own; otherwise the first paragraph that does. A
 * short one ("Omnichannel Cx") or one that repeats the title would say nothing the card's title does not.
 */
const excerptOf = (post: Post): string | null => {
  const desc = post.meta?.description?.trim()
  if (desc && desc.length >= 25 && !repeatsTitle(desc, post.title)) return desc
  return firstParagraph(post.content, post.title)
}

/** Previous, every page number and next, as links. Nothing when there is one page. */
const PostsPagination: React.FC<{ page: number; totalPages: number }> = ({ page, totalPages }) => {
  if (totalPages <= 1) return null
  const pages = Array.from({ length: totalPages }, (_, i) => i + 1)
  return (
    <nav className="pager" aria-label="Blog pages">
      {page > 1 ? (
        <Link className="pager-step" href={postsPageHref(page - 1)} rel="prev">
          Previous
        </Link>
      ) : null}
      {pages.map((n) =>
        n === page ? (
          <span key={n} className="pager-num is-current" aria-current="page">
            {n}
          </span>
        ) : (
          <Link key={n} className="pager-num" href={postsPageHref(n)}>
            {n}
          </Link>
        ),
      )}
      {page < totalPages ? (
        <Link className="pager-step" href={postsPageHref(page + 1)} rel="next">
          Next
        </Link>
      ) : null}
    </nav>
  )
}

export const PostsIndex: React.FC<{
  page: number
  posts: Awaited<ReturnType<typeof loadPostsPage>>
}> = ({ page, posts }) => (
  <article className="ncx-posts-index">
    <style>{`
        .ncx-posts-index{
          padding:calc(64px + 28px) 0 88px;
          font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-posts-index .eyebrow{
          font-family:var(--font-display),Arial,sans-serif;font-size:13px;font-weight:600;
          letter-spacing:.08em;text-transform:uppercase;color:var(--ncx-crimson-ink);margin:0 0 12px}
        .ncx-posts-index h1{
          font-family:var(--font-display),Arial,sans-serif;font-weight:600;
          font-size:clamp(34px,4.4vw,52px);line-height:1.08;letter-spacing:-.025em;
          color:var(--ncx-ink);margin:0;max-width:var(--ncx-heading-max)}
        .ncx-posts-index .lede{
          color:var(--ncx-muted);margin:18px 0 44px;max-width:58ch;font-size:18px;line-height:1.6}
        .ncx-posts-index .grid{
          display:grid;grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:1px;
          background:var(--ncx-rule);border:1px solid var(--ncx-rule);
          border-radius:var(--ncx-r-card);overflow:hidden}
        .ncx-posts-index .card{
          background:var(--ncx-white);padding:28px 26px;text-decoration:none;color:inherit;
          display:flex;flex-direction:column;transition:background .15s ease}
        .ncx-posts-index .card:hover{background:var(--ncx-cloud)}
        .ncx-posts-index .card:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:-2px}
        .ncx-posts-index .meta{
          font-family:var(--font-display),Arial,sans-serif;font-size:13px;
          color:var(--ncx-muted);margin-bottom:12px}
        .ncx-posts-index .card h2{
          font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:20px;line-height:1.3;letter-spacing:-.015em;color:var(--ncx-ink);margin:0}
        .ncx-posts-index .excerpt{
          font-size:16px;color:var(--ncx-muted);margin:12px 0 0;line-height:1.55}
        .ncx-posts-index .pager{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:48px}
        .ncx-posts-index .pager-num,.ncx-posts-index .pager-step{
          min-width:40px;height:40px;padding:0 14px;display:inline-flex;align-items:center;justify-content:center;
          border:1px solid var(--ncx-rule);border-radius:8px;background:var(--ncx-white);
          font-family:var(--font-display),Arial,sans-serif;font-size:14px;color:var(--ncx-ink);text-decoration:none}
        .ncx-posts-index a.pager-num:hover,.ncx-posts-index .pager-step:hover{border-color:var(--ncx-rule-strong)}
        .ncx-posts-index .pager .is-current{background:var(--ncx-navy);border-color:var(--ncx-navy);color:var(--ncx-on-navy)}
        .ncx-posts-index .pager a:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:2px}
        @media(max-width:900px){
          .ncx-posts-index{padding-bottom:64px}
          .ncx-posts-index .grid{grid-template-columns:1fr}
        }
      `}</style>

    <div className="ncx-container">
      <Breadcrumbs
        items={
          page <= 1
            ? [{ label: 'Home', href: '/' }, { label: 'Blog' }]
            : [
                { label: 'Home', href: '/' },
                { label: 'Blog', href: '/posts' },
                { label: `Page ${page}` },
              ]
        }
      />
      <p className="eyebrow">{page <= 1 ? 'Blog' : `Blog, page ${page}`}</p>
      <h1>Articles and guides</h1>
      <p className="lede">
        Practical guides to WhatsApp Flows, chatbots and AI agents on WhatsApp, for healthcare,
        higher education and retail.
      </p>

      {posts.docs.length ? (
        <div className="grid">
          {posts.docs.map((post) => {
            const date = post.publishedAt
              ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })
              : null
            const excerpt = excerptOf(post)

            return (
              <Link className="card" key={post.id} href={`/posts/${post.slug}`}>
                {date ? <div className="meta">{date}</div> : null}
                <h2>{post.title}</h2>
                {excerpt ? <p className="excerpt">{excerpt}</p> : null}
              </Link>
            )
          })}
        </div>
      ) : null}

      <PostsPagination page={page} totalPages={posts.totalPages} />
    </div>
  </article>
)
