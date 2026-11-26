import React from 'react'

import { SplitHeading } from '@/motion/SplitHeading'
import { Reveal } from '@/motion/Reveal'
import { StackComparisonToggle } from './Toggle'

/**
 * Local prop types, hand-written to match the CMS block config
 * (neuroncx-cms/src/blocks/StackComparison/config.ts) field for field,
 * rather than imported from payload-types.ts: that file is a snapshot taken
 * at an earlier point and does not yet carry this block. DetailedProductSuite
 * (one of this file's two reference blocks) does the same for the same
 * reason. Once payload-types.ts is regenerated from the CMS and copied over,
 * these can be swapped for `import type { StackComparisonBlock } from '@/payload-types'`.
 */
type Rating = 'strong' | 'partial' | 'missing' | 'roadmap' | 'none'
type CellRating = 'inherit' | Rating

type Tone = 'included' | 'missing' | 'plus'

type Group = {
  heading?: string | null
  tone?: Tone | null
  items?: { text: string; id?: string | null }[] | null
  id?: string | null
}

type Cta = { label?: string | null; url?: string | null } | null

type Card = {
  title: string
  tagline?: string | null
  audienceLabel?: string | null
  highlighted?: boolean | null
  badge?: string | null
  cta?: Cta
  groups?: Group[] | null
  id?: string | null
}

type Column = {
  label: string
  highlighted?: boolean | null
  defaultRating?: Rating | null
  id?: string | null
}

type Cell = { text?: string | null; rating?: CellRating | null; id?: string | null }

type Row = {
  capability: string
  cells?: Cell[] | null
  id?: string | null
}

type Table = {
  enabled?: boolean | null
  startOpen?: boolean | null
  openLabel?: string | null
  closeLabel?: string | null
  cellStyle?: 'tint' | 'dot' | 'compact' | null
  showLegend?: boolean | null
  columns?: Column[] | null
  rows?: Row[] | null
  footnote?: string | null
}

type Props = {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
  cards?: Card[] | null
  table?: Table | null
}

/** One stroke icon per group tone. Inline, aria-hidden: the tone's meaning is carried by the item text beside it. */
const ToneIcon: React.FC<{ tone: Tone }> = ({ tone }) => {
  if (tone === 'missing') {
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M4 4l8 8M12 4l-8 8" />
      </svg>
    )
  }
  if (tone === 'plus') {
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M8 1.5l1.6 4.4L14 7.5l-4.4 1.6L8 13.5l-1.6-4.4L2 7.5l4.4-1.6z" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M3 8.5l3.2 3.2L13 5" />
    </svg>
  )
}

/** The four rating markers used both in the table cells and in the legend. */
const MarkerIcon: React.FC<{ rating: Exclude<Rating, 'none'> }> = ({ rating }) => {
  if (rating === 'strong') {
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M3 8.5l3.2 3.2L13 5" />
      </svg>
    )
  }
  if (rating === 'partial') {
    return (
      <svg viewBox="0 0 16 16" fill="none" aria-hidden="true">
        <circle cx="8" cy="8" r="6" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="M8 2a6 6 0 0 1 0 12z" fill="currentColor" stroke="none" />
      </svg>
    )
  }
  if (rating === 'missing') {
    return (
      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
        <path d="M4 8h8" />
      </svg>
    )
  }
  return (
    <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="8" cy="8" r="6.2" />
      <path d="M8 5v3.2l2.2 1.3" />
    </svg>
  )
}

const RATING_META: Record<Exclude<Rating, 'none'>, { label: string; color: string; tint: string }> = {
  strong: { label: 'Strong', color: 'var(--ncx-good)', tint: 'var(--ncx-good-tint)' },
  partial: { label: 'Partial', color: 'var(--ncx-warn)', tint: 'var(--ncx-warn-tint)' },
  missing: { label: 'Not included', color: 'var(--ncx-none)', tint: 'var(--ncx-none-tint)' },
  roadmap: { label: 'Coming soon', color: 'var(--ncx-teal)', tint: 'var(--ncx-teal-tint)' },
}

/** Fixed legend order, independent of column or row order. */
const LEGEND_ORDER: Exclude<Rating, 'none'>[] = ['strong', 'partial', 'missing', 'roadmap']

/** A cell left on Inherit takes its column's default; anything else, including an explicit None, is its own. */
const resolveRating = (cell: Cell | undefined, column: Column | undefined): Rating => {
  const own = cell?.rating
  if (own && own !== 'inherit') return own
  return column?.defaultRating || 'none'
}

export const StackComparisonBlock: React.FC<Props> = ({ eyebrow, heading, intro, cards, table }) => {
  const items = (cards || []).filter((c) => c && c.title)
  if (!items.length) return null

  const columns = (table?.columns || []).filter((c) => c && c.label)
  const rows = (table?.rows || []).filter((r) => r && r.capability)
  const showTable = Boolean(table?.enabled) && columns.length > 0 && rows.length > 0
  const litColumn = columns.findIndex((c) => c.highlighted)
  const cellStyle = table?.cellStyle || 'tint'

  // Which ratings the legend should list, in the fixed order, scanning every
  // cell's resolved rating (not just what was typed into a particular cell).
  const usedRatings = showTable && table?.showLegend
    ? LEGEND_ORDER.filter((r) => rows.some((row) => columns.some((col, ci) => resolveRating(row.cells?.[ci], col) === r)))
    : []

  return (
    <section className="ncx-sc ncx-container">
      <style>{css}</style>

      <header className="sc-head">
        {eyebrow ? <Reveal as="p" from="left" className="sc-eyebrow">{eyebrow}</Reveal> : null}
        {heading ? <SplitHeading as="h2">{heading}</SplitHeading> : null}
        {intro ? <Reveal as="p" className="sc-intro">{intro}</Reveal> : null}
      </header>

      <div className="sc-grid">
        {items.map((card, i) => {
          const highlighted = Boolean(card.highlighted)
          const groups = (card.groups || []).filter((g) => g && (g.items || []).some((it) => it?.text))
          const href = card.cta?.url

          return (
            <article className={`sc-card${highlighted ? ' is-hi' : ''}`} key={card.id || i}>
              <div className="sc-card-top">
                {highlighted && card.badge ? <span className="sc-badge">{card.badge}</span> : null}
                <h3>{card.title}</h3>
                {card.tagline ? <p className="sc-tagline">{card.tagline}</p> : null}
                {href ? (
                  <a className="sc-cta" href={href}>
                    {card.cta?.label || 'Book a demo'}
                  </a>
                ) : null}
                {card.audienceLabel ? <span className="sc-pill">{card.audienceLabel}</span> : null}
              </div>

              {groups.length ? (
                <div className="sc-card-bottom">
                  {groups.map((g, gi) => {
                    const tone: Tone = g.tone || 'included'
                    const gItems = (g.items || []).filter((it) => it?.text)
                    if (!gItems.length) return null
                    return (
                      <div className="sc-group" key={g.id || gi}>
                        {g.heading ? <p className="sc-group-heading">{g.heading}</p> : null}
                        <ul className="sc-items">
                          {gItems.map((it, ii) => (
                            <li key={it.id || ii} className={`tone-${tone}`}>
                              <span className="sc-item-icon">
                                <ToneIcon tone={tone} />
                              </span>
                              <span>{it.text}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )
                  })}
                </div>
              ) : null}
            </article>
          )
        })}
      </div>

      {showTable ? (
        <StackComparisonToggle
          openLabel={table?.openLabel || 'Compare all capabilities'}
          closeLabel={table?.closeLabel || 'Hide full comparison'}
          startOpen={table?.startOpen}
        >
          <div className="sc-table-box">
            <table>
              <caption className="sc-caption">{heading ? `${heading}: full comparison` : 'Full comparison'}</caption>
              <thead>
                <tr>
                  <td className="sc-corner" />
                  {columns.map((c, i) => (
                    <th key={c.id || i} scope="col" className={i === litColumn ? 'is-lit' : undefined}>
                      {c.label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row, ri) => (
                  <tr key={row.id || ri}>
                    <th scope="row">{row.capability}</th>
                    {columns.map((col, ci) => {
                      const cell = row.cells?.[ci]
                      const rating = resolveRating(cell, col)
                      const text = cell?.text || ''
                      const isLit = ci === litColumn
                      const meta = rating !== 'none' ? RATING_META[rating] : null

                      const cellStyleVars: React.CSSProperties = {}
                      if (meta && cellStyle === 'tint') {
                        cellStyleVars.background = meta.tint
                        cellStyleVars.color = meta.color
                      } else if (!meta && isLit) {
                        // Highlighted column, no rating to colour by: a faint
                        // navy wash keeps the column traceable down the table.
                        cellStyleVars.background = 'color-mix(in srgb, var(--ncx-navy) 6%, var(--ncx-white))'
                      }

                      return (
                        <td key={col.id || ci} className={isLit ? 'is-lit' : undefined} style={cellStyleVars}>
                          <span className="sc-cell">
                            {meta && cellStyle !== 'dot' ? (
                              <span
                                className="sc-marker"
                                style={cellStyle === 'tint' ? undefined : { color: meta.color }}
                                aria-hidden="true"
                                title={cellStyle === 'compact' && text ? text : undefined}
                              >
                                <MarkerIcon rating={rating as Exclude<Rating, 'none'>} />
                              </span>
                            ) : null}
                            {meta && cellStyle === 'dot' ? (
                              <span className="sc-dot" style={{ background: meta.color }} aria-hidden="true" />
                            ) : null}
                            {text && cellStyle !== 'compact' ? <span>{text}</span> : null}
                            {text && cellStyle === 'compact' ? <span className="sr-only">{text}</span> : null}
                            {meta ? <span className="sr-only"> {meta.label}</span> : null}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {usedRatings.length ? (
            <ul className="sc-legend">
              {usedRatings.map((r) => (
                <li key={r}>
                  <span className="sc-marker" style={{ color: RATING_META[r].color }} aria-hidden="true">
                    <MarkerIcon rating={r} />
                  </span>
                  {RATING_META[r].label}
                </li>
              ))}
            </ul>
          ) : null}

          {table?.footnote ? <p className="sc-footnote">{table.footnote}</p> : null}
        </StackComparisonToggle>
      ) : null}
    </section>
  )
}

const css = `
  .ncx-sc{padding-block:clamp(56px,7vw,88px);font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
  .ncx-sc .sc-head{text-align:center;max-width:68ch;margin-inline:auto}
  .ncx-sc .sc-eyebrow{font-family:var(--font-display),Arial,sans-serif;font-size:14px;font-weight:600;
    text-transform:uppercase;letter-spacing:.04em;margin:0 0 12px;color:var(--ncx-crimson-ink)}
  .ncx-sc .sc-head h2{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
    font-size:clamp(26px,3.2vw,38px);letter-spacing:-.02em;line-height:1.15;margin:0}
  .ncx-sc .sc-intro{color:var(--ncx-muted);margin:14px 0 0;font-size:16.5px;line-height:1.65}

  .ncx-sc .sc-grid{margin-top:44px;display:grid;grid-template-columns:1fr;gap:20px;align-items:stretch}
  @media(min-width:641px){.ncx-sc .sc-grid{grid-template-columns:repeat(2,1fr)}}
  @media(min-width:1101px){.ncx-sc .sc-grid{grid-template-columns:repeat(4,1fr)}}

  .ncx-sc .sc-card{display:flex;flex-direction:column;background:var(--ncx-white);border:1px solid var(--ncx-rule);
    border-radius:16px;overflow:hidden}
  .ncx-sc .sc-card-top{display:flex;flex-direction:column;flex:1;padding:28px 24px 24px}
  .ncx-sc .sc-card h3{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:19px;
    line-height:1.3;margin:0}
  .ncx-sc .sc-tagline{font-size:14.5px;line-height:1.55;color:var(--ncx-muted);margin:10px 0 0}
  .ncx-sc .sc-pill{margin-top:auto;padding-top:16px;align-self:flex-start;font-family:var(--font-display),Arial,sans-serif;
    font-size:12px;font-weight:600;color:var(--ncx-muted);background:var(--ncx-paper);border-radius:999px;
    padding:6px 12px;margin-top:16px}

  .ncx-sc .sc-badge{display:inline-block;align-self:flex-start;margin-bottom:12px;font-family:var(--font-display),Arial,sans-serif;
    font-size:11.5px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;color:var(--ncx-on-navy);
    background:var(--ncx-crimson);border-radius:999px;padding:5px 12px}

  .ncx-sc .sc-cta{align-self:flex-start;margin-top:18px;display:inline-flex;align-items:center;min-height:44px;
    padding:0 20px;border-radius:999px;background:var(--ncx-crimson);color:var(--ncx-on-navy);text-decoration:none;
    font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:14.5px;transition:background .15s ease}
  .ncx-sc .sc-cta:hover{background:var(--ncx-crimson-hover)}
  .ncx-sc .sc-cta:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}

  .ncx-sc .sc-card-bottom{padding:22px 24px 26px;background:var(--ncx-paper);border-top:1px solid var(--ncx-rule)}
  .ncx-sc .sc-group+.sc-group{margin-top:18px}
  .ncx-sc .sc-group-heading{margin:0 0 10px;font-family:var(--font-display),Arial,sans-serif;font-weight:600;
    font-size:12.5px;letter-spacing:.03em;text-transform:uppercase;color:var(--ncx-faint)}
  .ncx-sc .sc-items{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:9px}
  .ncx-sc .sc-items li{display:flex;align-items:flex-start;gap:9px;font-size:14px;line-height:1.5}
  .ncx-sc .sc-item-icon{flex:none;width:16px;height:16px;margin-top:1px}
  .ncx-sc .sc-item-icon svg{width:100%;height:100%}
  .ncx-sc .tone-included .sc-item-icon{color:var(--ncx-ink)}
  .ncx-sc .tone-included{color:var(--ncx-body)}
  .ncx-sc .tone-missing .sc-item-icon{color:var(--ncx-faint)}
  .ncx-sc .tone-missing{color:var(--ncx-muted)}
  .ncx-sc .tone-plus .sc-item-icon{color:var(--ncx-crimson-ink)}
  .ncx-sc .tone-plus{color:var(--ncx-body)}

  /* Highlighted card: navy, white text, never crimson text on navy. The CTA
     keeps a crimson FILL (an area, not text), which stays legible either way. */
  .ncx-sc .sc-card.is-hi{background:var(--ncx-navy);border-color:var(--ncx-navy)}
  .ncx-sc .sc-card.is-hi h3,.ncx-sc .sc-card.is-hi .sc-tagline{color:var(--ncx-on-navy)}
  .ncx-sc .sc-card.is-hi .sc-tagline{color:var(--ncx-on-navy-soft)}
  .ncx-sc .sc-card.is-hi .sc-pill{background:var(--ncx-on-navy-raise);color:var(--ncx-on-navy-soft)}
  .ncx-sc .sc-card.is-hi .sc-card-bottom{background:var(--ncx-navy-tint);border-top-color:var(--ncx-on-navy-rule)}
  .ncx-sc .sc-card.is-hi .sc-group-heading{color:var(--ncx-on-navy-soft)}
  .ncx-sc .sc-card.is-hi .tone-plus{color:var(--ncx-on-navy)}
  .ncx-sc .sc-card.is-hi .tone-plus .sc-item-icon{color:var(--ncx-on-navy)}

  .ncx-sc .sc-toggle-wrap{margin-top:44px}

  .ncx-sc .sc-table-box{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-panel);
    overflow-x:auto}
  .ncx-sc table{min-width:860px;width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed}
  .ncx-sc .sc-caption{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
    clip:rect(0 0 0 0);white-space:nowrap;border:0}
  .ncx-sc th,.ncx-sc td{padding:14px 18px;text-align:left;vertical-align:top;border-bottom:1px solid var(--ncx-rule-soft)}
  .ncx-sc tbody tr:last-child th,.ncx-sc tbody tr:last-child td{border-bottom:0}
  .ncx-sc .sc-corner,.ncx-sc th[scope="row"]{width:22%;background:var(--ncx-white)}
  .ncx-sc thead th,.ncx-sc .sc-corner{border-bottom:1px solid var(--ncx-rule)}
  .ncx-sc thead th{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:14.5px;
    color:var(--ncx-ink);background:var(--ncx-white)}
  .ncx-sc thead th.is-lit{background:var(--ncx-navy);color:var(--ncx-on-navy);border-bottom-color:var(--ncx-navy)}
  .ncx-sc th[scope="row"]{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:14.5px;
    color:var(--ncx-ink)}
  .ncx-sc td{font-size:14.5px;line-height:1.5;color:var(--ncx-body)}
  .ncx-sc .sc-cell{display:inline-flex;align-items:flex-start;gap:8px}
  .ncx-sc .sc-marker{flex:none;width:16px;height:16px;margin-top:1px;color:var(--ncx-ink)}
  .ncx-sc .sc-marker svg{width:100%;height:100%}
  .ncx-sc .sc-dot{flex:none;width:8px;height:8px;border-radius:50%;margin-top:5px}

  .ncx-sc .sc-legend{list-style:none;margin:18px 0 0;padding:0;display:flex;flex-wrap:wrap;gap:16px 22px}
  .ncx-sc .sc-legend li{display:flex;align-items:center;gap:7px;font-size:13.5px;color:var(--ncx-muted)}
  .ncx-sc .sc-legend .sc-marker{width:14px;height:14px}

  .ncx-sc .sc-footnote{margin:14px 0 0;font-size:13px;line-height:1.5;color:var(--ncx-muted);max-width:80ch}

  @media(max-width:900px){
    .ncx-sc .sc-card-top{padding:22px 20px 18px}
    .ncx-sc .sc-card-bottom{padding:18px 20px 22px}
  }
`
