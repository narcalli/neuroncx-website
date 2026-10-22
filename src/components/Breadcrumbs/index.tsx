import { ChevronLeft, ChevronRight } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { getServerSideURL } from '@/utilities/getURL'
import { breadcrumbList, jsonLdHtml } from '@/utilities/jsonLd'

import type { Crumb } from './buildTrail'

export { buildTrail, type Crumb, type TrailInput } from './buildTrail'

/**
 * A breadcrumb trail (from buildTrail) as a small pill: links up to the
 * current page, which is the last item and is not linked. Under md only the
 * nearest linked ancestor shows, as a back link. onDark is for a dark or image
 * background: light text on a faint pill instead of muted text on white.
 * Nothing renders for a trail of fewer than two items.
 *
 * Also emits the trail as a schema.org BreadcrumbList (utilities/jsonLd.ts),
 * unless the site's address is unknown.
 */
export const Breadcrumbs: React.FC<{ items: Crumb[]; onDark?: boolean }> = ({
  items,
  onDark = false,
}) => {
  if (items.length < 2) return null
  const back = items
    .slice(0, -1)
    .reverse()
    .find((c) => c.href)
  const schema = breadcrumbList(items, getServerSideURL())

  return (
    <>
      <style>{`
        /* A line of its own; the pill follows the container's text-align. */
        .ncx-crumbs-row{margin:0 0 24px}
        .ncx-crumbs{display:inline-flex;vertical-align:top;align-items:center;gap:9px;max-width:100%;
          font-family:var(--font-display),Arial,sans-serif;font-size:13px;color:var(--ncx-muted);
          border:1px solid var(--ncx-rule);background:var(--ncx-white);
          padding:7px 15px;border-radius:999px}
        .ncx-crumbs__spark{flex:none;width:7px;height:7px;border-radius:50%;background:var(--ncx-crimson)}
        .ncx-crumbs__list{display:flex;align-items:center;flex-wrap:wrap;gap:9px;margin:0;padding:0;list-style:none}
        .ncx-crumbs__list li{display:inline-flex;align-items:center;gap:9px}
        .ncx-crumbs a{color:var(--ncx-muted);text-decoration:none}
        .ncx-crumbs a:hover{color:var(--ncx-ink)}
        .ncx-crumbs a:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
        .ncx-crumbs [aria-current]{color:var(--ncx-ink)}
        .ncx-crumbs__sep{flex:none;color:var(--ncx-faint)}
        .ncx-crumbs__back{display:none;align-items:center;gap:4px}

        .ncx-crumbs.is-on-dark{color:var(--ncx-on-navy-soft);border-color:var(--ncx-on-navy-rule);
          background:var(--ncx-on-navy-raise)}
        .ncx-crumbs.is-on-dark a{color:var(--ncx-on-navy-soft)}
        .ncx-crumbs.is-on-dark a:hover,.ncx-crumbs.is-on-dark [aria-current]{color:var(--ncx-on-navy)}
        .ncx-crumbs.is-on-dark a:focus-visible{outline-color:var(--ncx-on-navy)}
        .ncx-crumbs.is-on-dark .ncx-crumbs__sep{color:var(--ncx-on-navy-soft);opacity:.7}

        @media(max-width:767.98px){
          .ncx-crumbs__list{display:none}
          .ncx-crumbs__back{display:inline-flex}
          .ncx-crumbs-row:not(:has(.ncx-crumbs__back)){display:none}
        }
      `}</style>
      <div className="ncx-crumbs-row">
        <nav aria-label="Breadcrumb" className={`ncx-crumbs${onDark ? ' is-on-dark' : ''}`}>
          <span className="ncx-crumbs__spark" aria-hidden="true" />
          <ol className="ncx-crumbs__list">
            {items.map((c, i) => {
              const last = i === items.length - 1
              return (
                <li key={`${i}-${c.label}`}>
                  {i > 0 ? (
                    <ChevronRight className="ncx-crumbs__sep" size={14} aria-hidden="true" />
                  ) : null}
                  {last ? (
                    <span aria-current="page">{c.label}</span>
                  ) : c.href ? (
                    <Link href={c.href}>{c.label}</Link>
                  ) : (
                    <span>{c.label}</span>
                  )}
                </li>
              )
            })}
          </ol>
          {back?.href ? (
            <Link className="ncx-crumbs__back" href={back.href}>
              <ChevronLeft size={14} aria-hidden="true" />
              <span className="sr-only">Back to </span>
              {back.label}
            </Link>
          ) : null}
        </nav>
      </div>
      {schema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(schema)} />
      ) : null}
    </>
  )
}
