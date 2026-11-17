import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { Breadcrumbs } from '@/components/Breadcrumbs'
import { Pagination } from '@/components/Pagination'
import type { Post } from '@/payload-types'
import { CMS_TAG, getPaginated } from '@/utilities/cms'
import { generateMeta } from '@/utilities/generateMeta'

export const dynamic = 'force-dynamic'

type RichNode = { type?: string; text?: string; children?: RichNode[] }

/** A node's text, including the words inside links and other inline nodes. */
const textOf = (node: RichNode): string =>
  typeof node.text === 'string' ? node.text : Array.isArray(node.children) ? node.children.map(textOf).join('') : ''

const wordsOf = (s: string): string[] => s.toLowerCase().split(/[^a-z0-9]+/).filter(Boolean)

/** Most of its words (four in five) are already in the title, so the card would say it twice. */
const repeatsTitle = (text: string, title: string): boolean => {
  const own = wordsOf(text)
  const inTitle = new Set(wordsOf(title))
  return !own.length || own.filter((w) => inTitle.has(w)).length / own.length >= 0.8
}

const shorten = (text: string): string => (text.length > 160 ? `${text.slice(0, 157).trimEnd()}...` : text)

/** The first paragraph that adds something to the title (many posts open by restating it). */
const firstParagraph = (content: Post['content'] | null | undefined, title: string): string | null => {
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

export default async function PostsIndexPage() {
  const posts = await getPaginated<Post>(
    'posts',
    {
      depth: 1,
      limit: 12,
      page: 1,
      sort: '-publishedAt',
      'where[_status][equals]': 'published',
    },
    { tags: [CMS_TAG, 'posts'] },
  )

  return (
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
        @media(max-width:900px){
          .ncx-posts-index{padding-bottom:64px}
          .ncx-posts-index .grid{grid-template-columns:1fr}
        }
      `}</style>

      <div className="ncx-container">
        <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Blog' }]} />
        <p className="eyebrow">Blog</p>
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

        {posts.page && posts.totalPages > 1 ? (
          <div className="mt-12">
            <Pagination page={posts.page} totalPages={posts.totalPages} />
          </div>
        ) : null}
      </div>
    </article>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  return generateMeta({
    doc: {
      title: 'Blog',
      slug: 'posts',
      meta: {
        title: 'Blog: Conversational AI and WhatsApp Flows | NeuronCx',
        description:
          'Articles and guides from the NeuronCx team on WhatsApp Flows, chatbots and AI agents on WhatsApp, for healthcare, higher education and retail.',
      },
    },
    path: '/posts',
  })
}
