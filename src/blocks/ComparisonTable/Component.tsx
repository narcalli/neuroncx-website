import React from 'react'

import type { ComparisonTableBlock as GeneratedProps } from '@/payload-types'
import { SplitHeading } from '@/motion/SplitHeading'
import { Reveal } from '@/motion/Reveal'

/**
 * payload-types.ts does not yet carry the rowHeading field (it is a
 * hand-copied snapshot with no payload.config.ts in this repo to regenerate
 * it from — see StackComparison/Component.tsx for the same situation). Add
 * it here rather than hand-edit that generated file; drop this once the
 * types are regenerated from the CMS and copied over.
 */
type Props = GeneratedProps & { rowHeading?: string | null }

/**
 * Comparison table: NeuronCx beside other types of system. A real table for
 * screen readers (a caption from the heading, column and row headers). One
 * column can be highlighted: a navy header over pale cells.
 *
 * Up to 24 rows, so above 720px the header row sticks under the site header
 * while the page scrolls past it. Below 720px the table scrolls sideways
 * instead, inside a labelled, focusable region, with the row label column
 * pinned on the left; a row label can wrap onto a second line there, same
 * as at full width. The two cannot both be on: the sideways scroll makes
 * the box a scroll container, and a sticky header inside a box that never
 * scrolls does not follow the page. See the stylesheet below.
 *
 * The top-left corner is empty unless rowHeading is set, in which case it
 * becomes a proper column header (e.g. "Capability") instead of a blank cell.
 */
export const ComparisonTableBlock: React.FC<Props> = ({ eyebrow, heading, intro, columns, rows, footnote, rowHeading }) => {
  const cols = (columns || []).filter((c) => c && c.label)
  const body = (rows || []).filter((r) => r && r.label)
  if (!cols.length || !body.length) return null
  // One highlighted column at most (the CMS refuses more); the first wins.
  const lit = cols.findIndex((c) => c.highlight)

  return (
    <section className="ncx-cmp" style={{ '--cmp-cols': cols.length } as React.CSSProperties}>
      <style>{css}</style>
      <div className="ncx-container">
        {eyebrow ? <Reveal as="p" from="left" className="cmp-eyebrow">{eyebrow}</Reveal> : null}
        <SplitHeading as="h2">{heading}</SplitHeading>
        {intro ? <Reveal as="p" className="cmp-intro">{intro}</Reveal> : null}

        <div className="cmp-scroll" role="region" aria-label={`${heading}: comparison table`} tabIndex={0}>
          <table>
            <caption className="cmp-caption">{heading}</caption>
            <thead>
              <tr>
                {rowHeading ? (
                  <th scope="col" className="cmp-corner">{rowHeading}</th>
                ) : (
                  <td className="cmp-corner" />
                )}
                {cols.map((c, i) => (
                  <th key={c.id || i} scope="col" className={i === lit ? 'is-lit' : undefined}>
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {body.map((r, ri) => (
                <tr key={r.id || ri}>
                  <th scope="row">{r.label}</th>
                  {cols.map((c, i) => (
                    <td key={c.id || i} className={i === lit ? 'is-lit' : undefined}>
                      {r.cells?.[i]?.text || ''}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {footnote ? <p className="cmp-note">{footnote}</p> : null}
      </div>
    </section>
  )
}

const css = `
  .ncx-cmp{padding:clamp(56px,7vw,88px) 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
  .ncx-cmp .cmp-eyebrow{font-family:var(--font-display),Arial,sans-serif;font-size:14px;color:var(--ncx-crimson-ink);margin:0 0 12px}
  .ncx-cmp h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:clamp(28px,3.4vw,38px);
    letter-spacing:-.03em;line-height:1.15;margin:0;max-width:var(--ncx-heading-max);color:var(--ncx-ink)}
  .ncx-cmp .cmp-intro{color:var(--ncx-muted);margin:14px 0 0;max-width:64ch;font-size:18px;line-height:1.6}
  /* overflow-x here also makes overflow-y compute to auto, which turns this
     box into a scroll container. That is what the sideways scroll below
     720px needs, but it also becomes the scrollport the sticky header
     resolves against, so the header is switched off it at wider widths. */
  .ncx-cmp .cmp-scroll{margin-top:40px;border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-panel);
    background:var(--ncx-white);overflow-x:auto}
  .ncx-cmp .cmp-scroll:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
  .ncx-cmp table{width:100%;border-collapse:separate;border-spacing:0;table-layout:fixed}
  .ncx-cmp .cmp-caption{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
  .ncx-cmp th,.ncx-cmp td{padding:16px 20px;text-align:left;vertical-align:top;border-bottom:1px solid var(--ncx-rule-soft)}
  .ncx-cmp tbody tr:last-child th,.ncx-cmp tbody tr:last-child td{border-bottom:0}
  /* The row label column: a quarter of the table, a little more with two columns. */
  .ncx-cmp .cmp-corner,.ncx-cmp th[scope="row"]{width:24%;background:var(--ncx-white)}
  .ncx-cmp thead th,.ncx-cmp .cmp-corner{border-bottom:1px solid var(--ncx-rule)}
  .ncx-cmp thead th,.ncx-cmp th.cmp-corner{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:15px;line-height:1.35;
    color:var(--ncx-ink);background:var(--ncx-white)}
  .ncx-cmp thead th.is-lit{background:var(--ncx-navy);color:var(--ncx-on-navy);border-bottom-color:var(--ncx-navy)}
  .ncx-cmp th[scope="row"]{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:15px;line-height:1.4;color:var(--ncx-ink)}
  .ncx-cmp td{font-size:15px;line-height:1.55;color:var(--ncx-body);background:var(--ncx-white)}
  .ncx-cmp td.is-lit{background:var(--ncx-paper)}
  .ncx-cmp .cmp-note{margin:14px 0 0;font-size:14px;line-height:1.55;color:var(--ncx-muted);max-width:80ch}
  /* At 720px and up: the header row stays in view while the page scrolls
     past a table that can run to 24 rows.

     The scroll box gives up being a scroll container at this width, which
     it only needs below 720px. While it is one, it is also the scrollport
     the header sticks to, and because its height always equals its content
     it never scrolls: the header would just sit a fixed distance down the
     table, on top of the first rows, instead of following the page.

     top is 64px, the height of the site's own sticky header, so the row
     docks directly under it with no strip of table showing between them.
     The corner cells round themselves because the box no longer clips
     them to its own rounded edge. */
  @media (min-width:720px){
    .ncx-cmp .cmp-scroll{overflow-x:visible}
    .ncx-cmp thead th,.ncx-cmp .cmp-corner{position:sticky;top:64px;z-index:2}
    .ncx-cmp thead tr:first-child > :first-child{border-top-left-radius:var(--ncx-r-panel)}
    .ncx-cmp thead tr:first-child > :last-child{border-top-right-radius:var(--ncx-r-panel)}
    .ncx-cmp tbody tr:last-child > :first-child{border-bottom-left-radius:var(--ncx-r-panel)}
    .ncx-cmp tbody tr:last-child > :last-child{border-bottom-right-radius:var(--ncx-r-panel)}
  }
  /* Below 720px: the table keeps readable columns and scrolls sideways; the
     row labels stay pinned on the left, with a hairline to show the edge.
     A row label wraps rather than truncates, so a longer one runs to a
     second line instead of being cut off. */
  @media (max-width:719.98px){
    .ncx-cmp table{table-layout:auto;min-width:calc(150px + var(--cmp-cols) * 190px)}
    .ncx-cmp .cmp-corner,.ncx-cmp th[scope="row"]{position:sticky;left:0;z-index:1;width:150px;min-width:150px;
      box-shadow:1px 0 0 var(--ncx-rule)}
    .ncx-cmp th,.ncx-cmp td{padding:14px 16px}
  }
`
