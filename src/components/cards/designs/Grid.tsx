import Link from 'next/link'
import React from 'react'

import { CardFlag } from '../Flag'
import { CardMotion } from '../CardMotion'
import { placementCss, placementVars } from '../layout'
import type { CardDesignProps } from '../types'

/**
 * The grid design: cells joined by hairlines inside one rounded frame, each
 * with a logo (or the initial) beside the title and text. This is the cell
 * the Integrations block has always shown, moved here unchanged; the block
 * now renders it through this component.
 *
 * Without `columns` the grid fills the row with cells of at least 260px, as
 * the Integrations block does. With `columns`, cells sit on a fixed grid
 * (at most 2 per row on tablets, 1 on phones) and `lastRow` decides what a
 * short last row does: "leave" keeps the grey filler of today, "stretch"
 * widens its cells to fill the row, "center" centres them on white.
 */
export const CardGrid: React.FC<CardDesignProps & { className?: string }> = ({
  items,
  columns,
  lastRow = 'leave',
  motion,
  className,
}) => {
  if (!items.length) return null
  const classes = ['ncx-cgrid']
  if (columns) classes.push('has-cols')
  if (columns && lastRow === 'center') classes.push('is-center')
  if (className) classes.push(className)

  return (
    <>
      <style>{`
        .ncx-cgrid{display:grid;
          grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1px;
          background:var(--ncx-rule);border:1px solid var(--ncx-rule);border-radius:12px;overflow:hidden;
          font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-cgrid__cell{background:var(--ncx-white);padding:24px 22px;display:flex;gap:14px;align-items:flex-start}
        .ncx-cgrid__mark{width:34px;height:34px;flex:0 0 34px;border-radius:8px;background:var(--ncx-cloud);
          display:flex;align-items:center;justify-content:center;overflow:hidden}
        .ncx-cgrid__mark img{max-width:26px;max-height:26px;width:auto;height:auto;
          object-fit:contain;mix-blend-mode:multiply}
        .ncx-cgrid__initial{font-family:var(--font-display),Arial,sans-serif;font-size:15px;
          font-weight:500;color:var(--ncx-muted)}
        .ncx-cgrid__name{font-family:var(--font-display),Arial,sans-serif;font-size:16px;
          font-weight:500;margin:0}
        .ncx-cgrid__text{margin:6px 0 0;color:var(--ncx-muted);font-size:15px;line-height:1.55}
        a.ncx-cgrid__cell{text-decoration:none;color:inherit;transition:background .18s ease}
        a.ncx-cgrid__cell:hover{background:var(--ncx-cloud)}
        a.ncx-cgrid__cell:hover .ncx-cgrid__name{text-decoration:underline;text-underline-offset:3px}
        a.ncx-cgrid__cell:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:-2px}
        ${placementCss('.ncx-cgrid')}
        /* Centred: the hairlines come from each cell, so the space beside a
           short last row stays white instead of showing the grey frame. */
        .ncx-cgrid.is-center{background:var(--ncx-white)}
        .ncx-cgrid.is-center > *{box-shadow:0 0 0 1px var(--ncx-rule)}
      `}</style>
      <div className={classes.join(' ')}>
        {items.map((it, i) => {
          const body = (
            <>
              <div className="ncx-cgrid__mark">
                {it.logo ? (
                  // Decorative: the title beside it names the item.
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={it.logo.src} alt="" loading="lazy" />
                ) : (
                  <span className="ncx-cgrid__initial">{it.initial}</span>
                )}
              </div>
              <div>
                <p className="ncx-cgrid__name">
                  {it.title}
                  <CardFlag text={it.flag} />
                </p>
                {it.text ? <p className="ncx-cgrid__text">{it.text}</p> : null}
              </div>
            </>
          )
          const style = columns
            ? (placementVars(i, items.length, columns, lastRow) as React.CSSProperties)
            : undefined
          // An item with its own page links to it; the rest are plain cells.
          return (
            <CardMotion key={it.id} index={i} motion={motion} style={style}>
              {it.href ? (
                <Link className="ncx-cgrid__cell" href={it.href}>
                  {body}
                </Link>
              ) : (
                <div className="ncx-cgrid__cell">{body}</div>
              )}
            </CardMotion>
          )
        })}
      </div>
    </>
  )
}
