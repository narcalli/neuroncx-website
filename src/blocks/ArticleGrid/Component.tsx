import React from 'react'
import Link from 'next/link'
import { getMany, CMS_TAG } from '@/utilities/cms'

type Props = {
  heading?: string | null
  intro?: string | null
  limit?: number | null
}

export const ArticleGridBlock: React.FC<Props> = async ({ heading, intro, limit }) => {
  const posts = await getMany<any>(
    'posts',
    {
      'where[_status][equals]': 'published',
      sort: '-publishedAt',
      limit: limit || 3,
      depth: 1,
    },
    { tags: [CMS_TAG, 'posts'] },
  )

  if (!posts.length) return null

  return (
    <section className="ncx-articles">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-articles{--ink:#1A1A2E;--ink-soft:#4A5573;--paper:#F5F5F7;--rule:#DFE3EA;
          max-width:1120px;margin:0 auto;padding:56px 32px 72px;
          font-family:Inter,Arial,sans-serif;color:var(--ink);
          border-top:1px solid var(--rule)}
        .ncx-articles h2{font-family:Poppins,Arial,sans-serif;font-weight:500;
          font-size:34px;letter-spacing:-.025em;margin:0 0 8px}
        .ncx-articles .lede{color:var(--ink-soft);margin:0 0 40px;max-width:52ch;font-size:17px}
        .ncx-articles .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:1px;
          background:var(--rule);border:1px solid var(--rule)}
        .ncx-articles .card{background:#fff;padding:26px 24px;text-decoration:none;color:inherit;
          display:block}
        .ncx-articles .card:hover{background:var(--paper)}
        .ncx-articles .meta{font-family:Poppins,Arial,sans-serif;font-size:13px;
          color:var(--ink-soft);margin-bottom:12px}
        .ncx-articles h4{font-family:Poppins,Arial,sans-serif;font-weight:500;
          font-size:19px;line-height:1.25;letter-spacing:-.015em;margin:0}
        .ncx-articles .excerpt{font-size:16px;color:var(--ink-soft);margin:10px 0 0;line-height:1.55}
        @media(max-width:900px){
          .ncx-articles{padding:40px 20px 48px}
          .ncx-articles .grid{grid-template-columns:1fr}
        }
      `}</style>

      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className="lede">{intro}</p> : null}

      <div className="grid">
        {posts.map((post: any) => {
          const date = post?.publishedAt
            ? new Date(post.publishedAt).toLocaleDateString('en-GB', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
              })
            : null

          return (
            <Link className="card" key={post.id} href={`/posts/${post.slug}`}>
              {date ? <div className="meta">{date}</div> : null}
              <h4>{post.title}</h4>
              {post?.meta?.description ? (
                <p className="excerpt">{post.meta.description}</p>
              ) : null}
            </Link>
          )
        })}
      </div>
    </section>
  )
}
