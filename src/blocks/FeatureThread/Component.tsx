import React from 'react'
import { getMany, CMS_TAG } from '@/utilities/cms'

type Props = {
  heading?: string | null
  categories?: string[] | null
  limitPerCategory?: number | null
  hideCategoryLinks?: boolean | null
}

const CATEGORY_LABELS: Record<string, string> = {
  'omnichannel-cx': 'Omnichannel CX',
  'knowledge-base': 'Knowledge base',
  'user-intelligence': 'User intelligence',
  integrations: 'Integrations',
}

const CATEGORY_PATHS: Record<string, string> = {
  'omnichannel-cx': '/omnichannel-cx',
  'knowledge-base': '/knowledge-base',
  'user-intelligence': '/user-intelligence',
  integrations: '/integrations',
}

export const FeatureThreadBlock: React.FC<Props> = async ({
  heading,
  categories,
  limitPerCategory,
  hideCategoryLinks,
}) => {
  const cats = categories?.length
    ? categories
    : ['omnichannel-cx', 'knowledge-base', 'user-intelligence', 'integrations']
  const limit = limitPerCategory || 1

  // One request per category, run together rather than in sequence — over HTTP
  // a serial loop would add a round trip per category to every page render.
  const results = await Promise.all(
    cats.map((category) =>
      getMany<any>(
        'features',
        {
          'where[category][equals]': category,
          'where[_status][equals]': 'published',
          sort: 'order',
          limit,
          depth: 0,
        },
        { tags: [CMS_TAG, 'features'] },
      ),
    ),
  )

  const groups = cats
    .map((category, i) => ({ category, items: results[i] || [] }))
    .filter((g) => g.items.length)

  if (!groups.length) return null

  let turn = 0

  return (
    <section className="ncx-thread">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-thread{--ink:#1A1A2E;--ink-soft:#4A5573;--crimson:#C62828;--rule:#DFE3EA;
          position:relative;max-width:1120px;margin:0 auto;padding:48px 32px;
          font-family:Inter,Arial,sans-serif;color:var(--ink)}
        .ncx-thread h2{font-family:Poppins,Arial,sans-serif;font-weight:500;
          font-size:34px;letter-spacing:-.025em;margin:0 0 44px}
        .ncx-thread .spine{position:relative;display:grid;grid-template-columns:1fr 1fr;
          column-gap:8%;row-gap:20px;align-items:start}
        .ncx-thread .spine:before{content:"";position:absolute;left:50%;top:8px;bottom:8px;
          width:1px;background:var(--rule)}
        .ncx-thread .turn{position:relative}
        .ncx-thread .turn.left{grid-column:1}
        .ncx-thread .turn.right{grid-column:2}
        .ncx-thread .turn:before{content:"";position:absolute;top:12px;width:9px;height:9px;
          border-radius:50%;background:var(--crimson)}
        .ncx-thread .turn.left:before{right:-4.6%}
        .ncx-thread .turn.right:before{left:-4.6%}
        .ncx-thread .cat{font-family:Poppins,Arial,sans-serif;font-size:13px;
          color:var(--crimson);margin-bottom:8px;display:block}
        .ncx-thread h3{font-family:Poppins,Arial,sans-serif;font-weight:500;
          font-size:25px;letter-spacing:-.02em;margin:0 0 10px}
        .ncx-thread p{color:var(--ink-soft);font-size:17px;line-height:1.6;margin:0}
        .ncx-thread .more{font-family:Poppins,Arial,sans-serif;font-size:15px;
          color:var(--crimson);text-decoration:none;display:inline-block;margin-top:12px;
          border-bottom:1px solid currentColor}
        @media(max-width:900px){
          .ncx-thread{padding:40px 20px}
          .ncx-thread .spine{grid-template-columns:1fr;row-gap:26px}
          .ncx-thread .spine:before{left:4px}
          .ncx-thread .turn.left,.ncx-thread .turn.right{grid-column:1;padding-left:30px}
          .ncx-thread .turn.left:before,.ncx-thread .turn.right:before{left:0;right:auto}
        }
      `}</style>

      {heading ? <h2>{heading}</h2> : null}

      <div className="spine">
        {groups.map((group) =>
          group.items.map((item: any) => {
            const side = turn % 2 === 0 ? 'left' : 'right'
            turn += 1
            return (
              <div className={`turn ${side}`} key={item.id}>
                <span className="cat">{CATEGORY_LABELS[group.category] || group.category}</span>
                <h3>{item.title}</h3>
                <p>{item.summary}</p>
                {hideCategoryLinks ? null : (
                  <a className="more" href={CATEGORY_PATHS[group.category] || '#'}>
                    More on {CATEGORY_LABELS[group.category] || group.category}
                  </a>
                )}
              </div>
            )
          }),
        )}
      </div>
    </section>
  )
}
