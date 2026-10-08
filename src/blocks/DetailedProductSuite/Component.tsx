import React from 'react'

import { BlockIcon } from '@/components/BlockIcon'

type Highlight = { icon?: string | null; label?: string | null; id?: string | null }

type Cta = { label?: string | null; url?: string | null; newTab?: boolean | null } | null

type Card = {
  eyebrow?: string | null
  title?: string | null
  tagline?: string | null
  description?: string | null
  watermarkIcon?: string | null
  accentColor?: 'crimson' | 'navy' | null
  highlights?: Highlight[] | null
  cta?: Cta
  id?: string | null
}

type Props = {
  eyebrow?: string | null
  title?: string | null
  description?: string | null
  columns?: '2' | '1' | null
  cards?: Card[] | null
  background?: string | null
}

const ArrowIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
    <path d="M3 8h10M9 4l4 4-4 4" />
  </svg>
)

/**
 * Which highlight tiles get a divider. The grid is 2 columns; a card with
 * exactly 3 highlights spans its 3rd tile across both columns instead of
 * leaving an empty cell, so that one tile gets no vertical divider.
 */
function tileClasses(index: number, total: number): string {
  const spanFull = total === 3 && index === 2
  const row = Math.floor(index / 2)
  const lastRow = Math.floor((total - 1) / 2)
  const hasRightNeighbor = !spanFull && index % 2 === 0 && index + 1 < total

  const classes = ['tile']
  if (spanFull) classes.push('tile-full')
  if (hasRightNeighbor) classes.push('tile-vline')
  if (row !== lastRow) classes.push('tile-hline')
  return classes.join(' ')
}

export const DetailedProductSuiteBlock: React.FC<Props> = ({
  eyebrow,
  title,
  description,
  columns,
  cards,
  background,
}) => {
  const items = (cards || []).filter((c) => c && c.title)
  if (!items.length) return null

  const headEyebrow = eyebrow?.trim()
  const headTitle = title?.trim()
  const headDescription = description?.trim()
  const hasHeader = Boolean(headEyebrow || headTitle || headDescription)
  const onDark = background === 'navy' || background === 'crimson'

  return (
    <section className={onDark ? 'ncx-dps on-dark ncx-container' : 'ncx-dps ncx-container'}>
      <style>{`
        .ncx-dps{
          padding-block:56px;
          font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}

        .ncx-dps .head .eyebrow{font-family:var(--font-display),Arial,sans-serif;font-size:14px;font-weight:600;
          margin:0 0 12px;color:var(--ncx-crimson)}
        .ncx-dps .head h2{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
          font-size:clamp(26px,3.2vw,38px);letter-spacing:-.02em;line-height:1.15;margin:0;max-width:30ch;
          color:var(--ncx-body)}
        .ncx-dps .head .intro{color:var(--ncx-muted);margin:14px 0 0;max-width:62ch;font-size:16.5px;line-height:1.65}

        .ncx-dps.on-dark .head .eyebrow{color:rgba(255,255,255,.85)}
        .ncx-dps.on-dark .head h2{color:var(--ncx-on-navy)}
        .ncx-dps.on-dark .head .intro{color:rgba(255,255,255,.72)}

        .ncx-dps .grid{margin-top:40px;display:grid;grid-template-columns:repeat(2,1fr);gap:28px;align-items:stretch}
        .ncx-dps .grid.cols-1{grid-template-columns:1fr}

        .ncx-dps .card{position:relative;overflow:hidden;display:flex;flex-direction:column;
          background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:28px;padding:36px;isolation:isolate}
        .ncx-dps .card.accent-crimson{--accent:var(--ncx-crimson);--accent-tint:var(--ncx-crimson-tint)}
        .ncx-dps .card.accent-navy{--accent:var(--ncx-navy);--accent-tint:var(--ncx-rule-soft)}

        .ncx-dps .watermark{position:absolute;top:-18px;right:-18px;width:168px;height:168px;
          color:var(--accent);opacity:.08;z-index:0;pointer-events:none}
        .ncx-dps .watermark svg{width:100%;height:100%;stroke-width:1.2}

        .ncx-dps .card > *{position:relative;z-index:1}

        .ncx-dps .card .eyebrow{display:block;margin:0 0 14px;color:var(--accent);
          font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:12.5px;
          letter-spacing:.05em;text-transform:uppercase}
        .ncx-dps .card h3{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
          font-size:clamp(21px,1.8vw,25px);letter-spacing:-.01em;line-height:1.25;margin:0}
        .ncx-dps .card .tagline{font-family:var(--font-display),Arial,sans-serif;font-weight:600;
          font-size:16.5px;line-height:1.45;color:var(--ncx-ink);margin:10px 0 0}
        .ncx-dps .card .desc{color:var(--ncx-muted);font-size:15px;line-height:1.65;margin:12px 0 0}

        .ncx-dps .tiles{margin:26px 0 0;display:grid;grid-template-columns:repeat(2,1fr)}
        .ncx-dps .tile{display:flex;align-items:flex-start;gap:11px;padding:13px 0 13px 18px}
        .ncx-dps .tile:nth-child(odd){padding-left:0;padding-right:18px}
        .ncx-dps .tile-vline{border-right:1px solid var(--ncx-rule)}
        .ncx-dps .tile-hline{border-bottom:1px solid var(--ncx-rule)}
        .ncx-dps .tile-full{grid-column:1 / -1;padding-right:0}
        .ncx-dps .tile svg{flex:none;width:20px;height:20px;margin-top:1px}
        .ncx-dps .tile .label{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:13.5px;
          line-height:1.4;color:var(--ncx-body)}

        .ncx-dps .more{margin:16px 0 0;padding:0;list-style:none;display:flex;flex-direction:column;gap:10px}
        .ncx-dps .more li{display:flex;align-items:flex-start;gap:10px;font-size:14.5px;
          line-height:1.5;color:var(--ncx-muted)}
        .ncx-dps .more .dot{flex:none;width:6px;height:6px;border-radius:50%;background:var(--accent);
          margin-top:7px}

        .ncx-dps .cta{margin-top:26px;align-self:flex-start;display:inline-flex;align-items:center;gap:8px;
          background:var(--accent);color:var(--ncx-on-navy);text-decoration:none;
          font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:14.5px;
          padding:12px 20px;border-radius:999px;transition:opacity .15s ease}
        .ncx-dps .cta:hover{opacity:.88}
        .ncx-dps .cta:focus-visible{outline:2px solid var(--accent);outline-offset:3px}
        .ncx-dps .cta svg{width:15px;height:15px}

        @media(prefers-reduced-motion:reduce){
          .ncx-dps .cta{transition:none}
        }
        @media(max-width:900px){
          .ncx-dps{padding-block:40px}
          .ncx-dps .grid{margin-top:28px;grid-template-columns:1fr;gap:20px}
          .ncx-dps .card{padding:28px 24px;border-radius:22px}
          .ncx-dps .watermark{width:128px;height:128px}
        }
        @media(max-width:520px){
          .ncx-dps .tiles{grid-template-columns:1fr}
          .ncx-dps .tile{padding-left:0!important;padding-right:0!important;border-right:0!important}
          .ncx-dps .tile:not(:last-child){border-bottom:1px solid var(--ncx-rule)}
          .ncx-dps .tile:last-child{border-bottom:0}
        }
      `}</style>

      {hasHeader ? (
        <header className="head">
          {headEyebrow ? <p className="eyebrow">{headEyebrow}</p> : null}
          {headTitle ? <h2>{headTitle}</h2> : null}
          {headDescription ? <p className="intro">{headDescription}</p> : null}
        </header>
      ) : null}

      <div className={columns === '1' ? 'grid cols-1' : 'grid'}>
        {items.map((card, i) => {
          const highlights = (card.highlights || []).filter((h) => h && h.label)
          const gridPoints = highlights.slice(0, 4)
          const listPoints = highlights.slice(4)
          const accent = card.accentColor === 'navy' ? 'navy' : 'crimson'
          const href = card.cta?.url

          return (
            <article className={`card accent-${accent}`} key={card.id || i}>
              {card.watermarkIcon ? (
                <span className="watermark" aria-hidden="true">
                  <BlockIcon name={card.watermarkIcon} fallback={card.watermarkIcon} />
                </span>
              ) : null}

              {card.eyebrow ? <span className="eyebrow">{card.eyebrow}</span> : null}
              <h3>{card.title}</h3>
              {card.tagline ? <p className="tagline">{card.tagline}</p> : null}
              {card.description ? <p className="desc">{card.description}</p> : null}

              {gridPoints.length ? (
                <div className="tiles">
                  {gridPoints.map((h, j) => (
                    <div className={tileClasses(j, gridPoints.length)} key={h.id || j}>
                      <BlockIcon name={h.icon} fallback="check" stroke="var(--accent)" />
                      <span className="label">{h.label}</span>
                    </div>
                  ))}
                </div>
              ) : null}

              {listPoints.length ? (
                <ul className="more">
                  {listPoints.map((h, j) => (
                    <li key={h.id || j}>
                      <span className="dot" aria-hidden="true" />
                      <span>{h.label}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {href ? (
                <a
                  className="cta"
                  href={href}
                  {...(card.cta?.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {card.cta?.label || 'Explore the workflow'}
                  <ArrowIcon />
                </a>
              ) : null}
            </article>
          )
        })}
      </div>
    </section>
  )
}
