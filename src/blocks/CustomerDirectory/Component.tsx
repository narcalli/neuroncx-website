import React from 'react'

import { getMany, CMS_TAG } from '@/utilities/cms'
import { publicCaseStudyQuery, publicCases, sectorIds } from '@/utilities/caseStudies'
import type { CaseStudy, CustomerDirectoryBlock as CustomerDirectoryProps, Sector } from '@/payload-types'

import { DirectoryList, type DirectoryRow } from './DirectoryList'

const MAX_ROWS = 100

export const CustomerDirectoryBlock: React.FC<CustomerDirectoryProps> = async ({
  eyebrow,
  heading,
  intro,
  sectors,
  showFilters,
  layout,
  emptyStateText,
}) => {
  const ids = sectorIds(sectors)
  const query: Record<string, string | number | boolean | undefined> = {
    ...publicCaseStudyQuery,
    sort: 'clientName',
    limit: MAX_ROWS,
    depth: 1,
  }
  if (ids.length) query['where[sectors][in]'] = ids.join(',')

  const docs = await getMany<CaseStudy>('caseStudies', query, { tags: [CMS_TAG, 'case-studies'] })

  const rows: DirectoryRow[] = publicCases(docs).map((c) => ({
    id: c.id,
    slug: c.slug,
    clientName: c.clientName,
    summary: c.summary,
    sectors: ((c.sectors || []) as (string | Sector)[])
      .filter((s): s is Sector => typeof s === 'object' && s !== null)
      .map((s) => ({ id: s.id, name: s.name })),
  }))

  return (
    <section className="ncx-dir">
      <style>{`
        .ncx-dir{padding:88px 0;background:var(--ncx-cloud);font-family:Inter,Arial,sans-serif;color:#1A1A2E}
        .ncx-dir__wrap{max-width:1120px;margin:0 auto;padding:0 24px;display:flex;flex-direction:column;gap:32px}
        .ncx-dir__eyebrow{font-weight:600;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ncx-crimson);margin:0 0 10px}
        .ncx-dir__heading{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:clamp(1.5rem,3vw,2rem);color:var(--ncx-navy);margin:0}
        .ncx-dir__intro{font-size:15px;line-height:1.6;color:var(--ncx-muted);margin:10px 0 0}
        .ncx-dir__pills{display:flex;flex-wrap:wrap;gap:10px}
        .ncx-dir__pills button{padding:8px 18px;border-radius:999px;border:1px solid #D8DAE3;background:#fff;color:var(--ncx-navy);font:500 13px Inter,Arial,sans-serif;cursor:pointer}
        .ncx-dir__pills button.is-active{background:var(--ncx-crimson);border-color:var(--ncx-crimson);color:#fff}
        .ncx-dir__list{list-style:none;margin:0;padding:0;background:#fff;border-radius:12px;border:1px solid #E8E9EF;overflow:hidden}
        .ncx-dir__row{display:flex;flex-wrap:wrap;align-items:center;gap:16px;padding:22px 28px;border-bottom:1px solid #F0F1F5}
        .ncx-dir__row:last-child{border-bottom:0}
        .ncx-dir__text{flex:1 1 320px;min-width:0;display:flex;flex-direction:column;gap:2px}
        .ncx-dir__name{font-weight:600;font-size:15px;color:var(--ncx-navy);text-decoration:none}
        .ncx-dir__name:hover{color:var(--ncx-crimson);text-decoration:underline}
        .ncx-dir__summary{margin:0;font-size:13px;color:var(--ncx-muted)}
        .ncx-dir__tags{display:flex;flex-wrap:wrap;gap:8px;margin-left:auto}
        .ncx-dir__tag{padding:4px 12px;border-radius:999px;background:var(--ncx-cloud);font-weight:500;font-size:12px;color:var(--ncx-navy)}
        .ncx-dir__cards{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:1fr;gap:20px}
        @media(min-width:860px){.ncx-dir__cards{grid-template-columns:repeat(3,minmax(0,1fr))}}
        .ncx-dir__card{background:#fff;border:1px solid #E8E9EF;border-radius:12px;padding:24px;display:flex;flex-direction:column;gap:10px}
        .ncx-dir__empty{margin:0;padding:32px 0;text-align:center;font-style:italic;font-size:14px;color:var(--ncx-muted)}
      `}</style>
      <div className="ncx-dir__wrap">
        {eyebrow || heading || intro ? (
          <header>
            {eyebrow ? <p className="ncx-dir__eyebrow">{eyebrow}</p> : null}
            {heading ? <h2 className="ncx-dir__heading">{heading}</h2> : null}
            {intro ? <p className="ncx-dir__intro">{intro}</p> : null}
          </header>
        ) : null}
        <DirectoryList
          rows={rows}
          showFilters={showFilters !== false}
          layout={layout === 'grid' ? 'grid' : 'list'}
          emptyStateText={emptyStateText || 'More stories coming soon.'}
        />
      </div>
    </section>
  )
}
