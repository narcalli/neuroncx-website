import { ChevronLeft } from 'lucide-react'
import Link from 'next/link'
import React from 'react'

import { getServerSideURL } from '@/utilities/getURL'
import { breadcrumbList, jsonLdHtml } from '@/utilities/jsonLd'

import type { Crumb } from './buildTrail'
import { CrumbList } from './CrumbList'

export { buildTrail, type Crumb, type TrailInput } from './buildTrail'

const HOME = { label: 'Home', href: '/' }

/**
 * A breadcrumb trail (from buildTrail): links up to the current page, which
 * is the last item and is not linked. Under md the whole trail becomes one
 * back link to the nearest linked ancestor (Home when there is none). onDark
 * is for a dark or image background. Nothing renders for a trail of fewer
 * than two items.
 *
 * Spacing: 44px below the trail. The 28px above it comes from where it sits:
 * a hero whose top padding is larger sets --crumb-top to a negative margin
 * that pulls the trail up to 28px under the fixed header.
 *
 * Also emits the trail as a schema.org BreadcrumbList (utilities/jsonLd.ts),
 * at every width, unless the site's address is unknown.
 */
export const Breadcrumbs: React.FC<{ items: Crumb[]; onDark?: boolean }> = ({
  items,
  onDark = false,
}) => {
  if (items.length < 2) return null
  const back =
    items
      .slice(0, -1)
      .reverse()
      .find((c): c is Crumb & { href: string } => Boolean(c.href)) ?? HOME
  const schema = breadcrumbList(items, getServerSideURL())

  return (
    <>
      <style>{`
        /* Colours switch with data-variant; every rule below reads them.
           Label-only steps share the link colour: any lighter grey falls
           under 4.5:1 on the gradient heroes (StatHero, customer), whose
           darkest pixel behind the trail is #c3c8d3. They stay plain text. */
        .ncx-crumbs{--crumb-link:#4B5563;--crumb-link-hover:#1A2035;--crumb-label:#4B5563;
          --crumb-current:#1A2035;--crumb-sep:#9CA3AF;--crumb-focus:#1A2035;--crumb-more-bg:#F5F5F7;
          display:flex;margin:var(--crumb-top,0px) 0 44px;text-align:left;
          font-family:var(--font-body),Arial,sans-serif;font-size:13px;font-weight:500;line-height:20px}
        .ncx-crumbs[data-variant="dark"]{--crumb-link:#C5CAD8;--crumb-link-hover:#FFFFFF;--crumb-label:#9CA3AF;
          --crumb-current:#FFFFFF;--crumb-sep:#6B7280;--crumb-focus:#FFFFFF;--crumb-more-bg:#252D4A}

        .ncx-crumbs__list{list-style:none;margin:0;padding:0;display:flex;align-items:center;
          flex-wrap:nowrap;gap:8px}
        .ncx-crumbs__list li{display:flex;align-items:center;gap:8px;flex:none;white-space:nowrap}
        .ncx-crumbs__list li.is-current{flex:0 1 auto;min-width:0}
        nav.ncx-crumbs a{color:var(--crumb-link);text-decoration:none}
        nav.ncx-crumbs a:hover{color:var(--crumb-link-hover);text-decoration:underline}
        nav.ncx-crumbs a:focus-visible,nav.ncx-crumbs button:focus-visible{
          outline:2px solid var(--crumb-focus);outline-offset:2px;border-radius:4px}
        .ncx-crumbs__label{color:var(--crumb-label)}
        .ncx-crumbs__current{display:block;max-width:260px;overflow:hidden;text-overflow:ellipsis;
          white-space:nowrap;color:var(--crumb-current);font-weight:600}
        .ncx-crumbs__sep{flex:none;color:var(--crumb-sep)}
        .ncx-crumbs__more{font:inherit;color:var(--crumb-link);background:var(--crumb-more-bg);
          border:0;border-radius:6px;padding:2px 8px;cursor:pointer}

        /* Under md: one back link, a 44px tap target. */
        nav.ncx-crumbs .ncx-crumbs__back{display:none;align-items:center;gap:4px;min-height:44px;font-size:14px}
        @media(max-width:767.98px){
          .ncx-crumbs__list{display:none}
          nav.ncx-crumbs .ncx-crumbs__back{display:inline-flex}
        }
      `}</style>
      <nav aria-label="Breadcrumb" className="ncx-crumbs" data-variant={onDark ? 'dark' : 'light'}>
        <CrumbList items={items} />
        <Link className="ncx-crumbs__back" href={back.href}>
          <ChevronLeft size={16} aria-hidden="true" />
          <span className="sr-only">Back to </span>
          {back.label}
        </Link>
      </nav>
      {schema ? (
        <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(schema)} />
      ) : null}
    </>
  )
}
