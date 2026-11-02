import React from 'react'

import RichText from '@/components/RichText'
import type { ContentBlock as ContentBlockProps } from '@/payload-types'

import { CMSLink } from '../../components/Link'
import { LegalContents } from './LegalContents'
import { outlineLegal } from './legalOutline'

type Props = Pick<ContentBlockProps, 'columns' | 'lastUpdated'> & {
  /** The page title, given by PageView when the page has no hero, so it is the page's one h1. */
  title?: string | null
}

// Dates are picked in India, so they are read there too; at UTC a day can slip back.
const formatDate = (iso: string) => {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return null
  return {
    text: d.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' }),
    machine: d.toLocaleDateString('en-CA', { timeZone: 'Asia/Kolkata' }),
  }
}

/**
 * Content block, Legal document layout (terms, privacy). The title, date and
 * contents list share the breadcrumb's left edge. On wide screens the text is
 * 18px at about 95 characters a line: the most that stays easy to follow.
 */
export const LegalDocument: React.FC<Props> = ({ columns, lastUpdated, title }) => {
  const cols = (columns || []).filter((c) => c.richText)
  const { docs, outline } = outlineLegal(cols.map((c) => c.richText!))
  const date = lastUpdated ? formatDate(lastUpdated) : null

  return (
    <div className="ncx-container ncx-legal">
      <style>{`
        .ncx-legal{margin-top:40px;margin-bottom:64px;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-legal__head{padding-bottom:28px;margin-bottom:40px;border-bottom:1px solid var(--ncx-rule)}
        .ncx-legal__head h1{margin:0;font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:clamp(2rem,4vw,2.75rem);line-height:1.15;color:var(--ncx-ink)}
        .ncx-legal__date{margin:12px 0 0;font-size:.95rem;color:var(--ncx-muted)}
        .ncx-legal__grid{display:grid;grid-template-columns:minmax(0,1fr);gap:24px}
        .ncx-legal__toc{display:none}
        .ncx-legal__toc-title{margin:0 0 12px;font-size:.75rem;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ncx-muted)}
        .ncx-legal__list{list-style:none;margin:0;padding:0;border-left:1px solid var(--ncx-rule)}
        .ncx-legal__list a{display:block;margin-left:-1px;padding:6px 0 6px 14px;border-left:2px solid transparent;font-size:.875rem;line-height:1.4;color:var(--ncx-muted);text-decoration:none}
        .ncx-legal__list a:hover{color:var(--ncx-ink)}
        .ncx-legal__list a.on{color:var(--ncx-ink);border-left-color:var(--ncx-crimson);font-weight:500}
        .ncx-legal__list a:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:2px}
        .ncx-legal__toc-mobile{border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);background:var(--ncx-white);padding:0 16px}
        .ncx-legal__toc-mobile summary{padding:14px 0;font-weight:600;color:var(--ncx-ink);cursor:pointer}
        .ncx-legal__toc-mobile summary:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:2px}
        .ncx-legal__toc-mobile .ncx-legal__list{margin-bottom:14px}
        @media (min-width:1024px){
          /* The rule under the title stops where the text does: 240px + 72px + 80ch. */
          .ncx-legal__head{max-width:calc(312px + 80ch)}
          .ncx-legal__grid{grid-template-columns:240px minmax(0,80ch);gap:72px;align-items:start}
          .ncx-legal__grid--plain{grid-template-columns:minmax(0,80ch)}
          .ncx-legal__toc{display:block;position:sticky;top:104px;max-height:calc(100vh - 128px);overflow-y:auto;overscroll-behavior:contain;padding-right:8px}
          .ncx-legal__toc-mobile{display:none}
        }
        /* Beats the 52ch article measure in globals.css and the prose plugin's sizes. */
        .ncx-legal__body .payload-richtext{font-size:1.0625rem;line-height:1.75}
        @media (min-width:1024px){.ncx-legal__body .payload-richtext{font-size:1.125rem}}
        .ncx-legal__body .payload-richtext > :where(p,ul,ol,blockquote,dl){max-width:none}
        .ncx-legal__body .payload-richtext > :first-child{margin-top:0}
        .ncx-legal__body h2{margin:48px 0 12px;font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:1.375rem;line-height:1.3;color:var(--ncx-ink);scroll-margin-top:112px}
      `}</style>
      {title || date ? (
        <header className="ncx-legal__head">
          {title ? <h1>{title}</h1> : null}
          {date ? (
            <p className="ncx-legal__date">
              Last updated <time dateTime={date.machine}>{date.text}</time>
            </p>
          ) : null}
        </header>
      ) : null}
      <div className={`ncx-legal__grid${outline.length ? '' : ' ncx-legal__grid--plain'}`}>
        {outline.length ? <LegalContents items={outline} /> : null}
        <div className="ncx-legal__body">
          {docs.map((data, i) => (
            <React.Fragment key={i}>
              <RichText data={data} enableGutter={false} />
              {cols[i].enableLink ? <CMSLink {...cols[i].link} /> : null}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  )
}
