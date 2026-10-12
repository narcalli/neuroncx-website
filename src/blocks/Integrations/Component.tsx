import React from 'react'
import { draftMode } from 'next/headers'

import type { Integration, IntegrationsBlock as IntegrationsBlockProps } from '@/payload-types'
import { CMS_TAG, getMany } from '@/utilities/cms'
import { absoluteMediaUrl } from '@/utilities/media'

// What one cell needs, whether it comes from the old typed list or the collection.
type Card = { id: string; name: string; summary?: string | null; logoUrl: string | null }

const MAX = 24

const idOf = (v: string | Integration | null | undefined): string | null =>
  typeof v === 'string' ? v : v && typeof v === 'object' ? v.id : null

const logoUrlOf = (logo: unknown): string | null =>
  logo && typeof logo === 'object' && 'url' in logo ? absoluteMediaUrl((logo as { url?: string | null }).url) : null

const toCard = (d: Integration): Card => ({ id: d.id, name: d.name, summary: d.summary, logoUrl: logoUrlOf(d.logo) })

const byOrderThenName = (a: Integration, b: Integration) =>
  (a.order ?? 100) - (b.order ?? 100) || a.name.localeCompare(b.name)

/**
 * Entries from the Integrations collection. Only Live entries are ever asked
 * for. Outside preview only published ones are, and the CMS enforces the same
 * for visitors. In preview, drafts are included so an editor can check a new
 * entry before publishing it.
 */
const fromCollection = async (block: IntegrationsBlockProps, draft: boolean): Promise<Card[]> => {
  const query: Record<string, string | number | boolean | undefined> = {
    'where[status][equals]': 'live',
    depth: 1,
    ...(draft ? { draft: 'true' } : { 'where[_status][equals]': 'published' }),
  }
  const opts = { draft, tags: [CMS_TAG, 'integrations'] }

  if (block.populateBy === 'selection') {
    // Hand-picked: fetch just those, then put them back in the editor's order.
    const ids = (block.selectedDocs || []).map(idOf).filter((id): id is string => Boolean(id))
    if (!ids.length) return []
    const docs = await getMany<Integration>(
      'integrations',
      { ...query, 'where[id][in]': ids.join(','), limit: ids.length },
      opts,
    )
    const found = new Map(docs.map((d) => [d.id, d]))
    return ids.map((id) => found.get(id)).filter((d): d is Integration => Boolean(d)).map(toCard)
  }

  if (block.populateBy === 'filter') {
    if (block.categories?.length) query['where[category][in]'] = block.categories.join(',')
    if (block.products?.length) query['where[products][in]'] = block.products.join(',')
  }
  if (block.featuredOnly) query['where[featured][equals]'] = true
  query.sort = 'order,name'
  query.limit = Math.min(Math.max(block.limit || MAX, 1), MAX)

  const docs = await getMany<Integration>('integrations', query, opts)
  return [...docs].sort(byOrderThenName).map(toCard)
}

export const IntegrationsBlock = async (props: IntegrationsBlockProps) => {
  const { label, heading, intro, items, footnote, populateBy } = props

  // Blocks saved before populateBy existed have no value: they are the old
  // typed list, rendered exactly as before.
  const list: Card[] =
    !populateBy || populateBy === 'manual'
      ? (items || []).map((it, i) => ({
          id: it.id || String(i),
          name: it.name,
          summary: it.summary,
          logoUrl: logoUrlOf(it.logo),
        }))
      : await fromCollection(props, (await draftMode()).isEnabled)
  if (!list.length) return null

  return (
    <section className="ncx-integrations ncx-container">
      <style>{`
        .ncx-integrations{
          padding-block:48px;
          font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-integrations .label{font-family:var(--font-display),Arial,sans-serif;font-size:14px;
          color:var(--ncx-crimson-ink);margin:0 0 12px}
        .ncx-integrations h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,38px);letter-spacing:-.03em;margin:0;max-width:22ch}
        .ncx-integrations .intro{color:var(--ncx-muted);margin:14px 0 0;max-width:64ch;font-size:18px;line-height:1.6}
        .ncx-integrations .grid{margin-top:44px;display:grid;
          grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1px;
          background:var(--ncx-rule);border:1px solid var(--ncx-rule);border-radius:12px;overflow:hidden}
        .ncx-integrations .cell{background:var(--ncx-white);padding:24px 22px;display:flex;gap:14px;align-items:flex-start}
        .ncx-integrations .mark{width:34px;height:34px;flex:0 0 34px;border-radius:8px;background:var(--ncx-cloud);
          display:flex;align-items:center;justify-content:center;overflow:hidden}
        .ncx-integrations .mark img{max-width:26px;max-height:26px;width:auto;height:auto;
          object-fit:contain;mix-blend-mode:multiply}
        .ncx-integrations .initial{font-family:var(--font-display),Arial,sans-serif;font-size:15px;
          font-weight:500;color:var(--ncx-muted)}
        .ncx-integrations .name{font-family:var(--font-display),Arial,sans-serif;font-size:16px;
          font-weight:500;margin:0}
        .ncx-integrations .summary{margin:6px 0 0;color:var(--ncx-muted);font-size:15px;line-height:1.55}
        .ncx-integrations .footnote{margin:24px 0 0;color:var(--ncx-muted);font-size:16px}
        @media(max-width:820px){.ncx-integrations{padding-block:36px}
          .ncx-integrations .grid{margin-top:32px}}
      `}</style>

      {label ? <p className="label">{label}</p> : null}
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className="intro">{intro}</p> : null}

      <div className="grid">
        {list.map((it) => {
          return (
            <div className="cell" key={it.id}>
              <div className="mark">
                {it.logoUrl ? (
                  <img src={it.logoUrl} alt="" loading="lazy" />
                ) : (
                  <span className="initial">{(it.name || '?').charAt(0)}</span>
                )}
              </div>
              <div>
                <p className="name">{it.name}</p>
                {it.summary ? <p className="summary">{it.summary}</p> : null}
              </div>
            </div>
          )
        })}
      </div>

      {footnote ? <p className="footnote">{footnote}</p> : null}
    </section>
  )
}
