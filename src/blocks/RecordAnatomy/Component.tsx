'use client'

import React, { useId, useRef, useState } from 'react'

import { BlockIcon } from '@/components/BlockIcon'
import type { RecordAnatomyBlock as Props } from '@/payload-types'
import { SplitHeading } from '@/motion/SplitHeading'
import { Reveal } from '@/motion/Reveal'

type Entity = Props['entities'][number]

const fieldCount = (n: number) => `${n} ${n === 1 ? 'field' : 'fields'}`

/**
 * Record anatomy: what a record holds and which system fills each field. A
 * grid of entity buttons on the left; the selected one's fields and sources
 * show in a table on the right. Follows the WAI-ARIA tabs pattern with a
 * vertical tab list (automatic activation): Up and Down move between
 * entities, Home and End go to the first and last, and only the selected one
 * is in the Tab order. Every panel is in the server-rendered HTML; the ones
 * not selected carry the hidden attribute.
 */
export const RecordAnatomyBlock: React.FC<Props> = ({
  eyebrow,
  heading,
  intro,
  recordLabel,
  fieldColumnLabel,
  sourceColumnLabel,
  entities,
}) => {
  const list: Entity[] = (entities || []).filter((e) => e && e.label)
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const uid = useId()
  if (!list.length) return null

  const record = recordLabel || 'Customer record'
  const headingId = `${uid}-heading`
  const tabId = (i: number) => `${uid}-tab-${i}`
  const panelId = (i: number) => `${uid}-panel-${i}`

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const last = list.length - 1
    const next =
      e.key === 'ArrowDown' ? (active === last ? 0 : active + 1)
      : e.key === 'ArrowUp' ? (active === 0 ? last : active - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null
    if (next === null) return
    e.preventDefault()
    setActive(next)
    refs.current[next]?.focus()
  }

  return (
    <section className="ncx-rec">
      <style>{css}</style>
      <div className="ncx-container">
        {eyebrow ? <Reveal as="p" from="left" className="rec-eyebrow">{eyebrow}</Reveal> : null}
        <SplitHeading as="h2" id={headingId}>{heading}</SplitHeading>
        {intro ? <Reveal as="p" className="rec-intro">{intro}</Reveal> : null}

        <div className="rec-body">
          <div className="rec-tablist" role="tablist" aria-orientation="vertical" aria-labelledby={headingId} onKeyDown={onKeyDown}>
            {list.map((e, i) => {
              const count = (e.fields || []).filter((f) => f && f.name).length
              return (
                <button
                  key={e.id || i}
                  ref={(el) => {
                    refs.current[i] = el
                  }}
                  type="button"
                  role="tab"
                  id={tabId(i)}
                  aria-selected={i === active}
                  aria-controls={panelId(i)}
                  tabIndex={i === active ? 0 : -1}
                  onClick={() => setActive(i)}
                >
                  {/* The name comes first so a screen reader says "Fees, 2 fields";
                      the count is moved above it on screen. */}
                  <span className="rec-name">
                    {e.icon ? (
                      <span className="rec-icon">
                        <BlockIcon name={e.icon} fallback="database" />
                      </span>
                    ) : null}
                    {e.label}
                  </span>
                  <span className="rec-count">
                    <span className="rec-hidden">, </span>
                    {fieldCount(count)}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="rec-panels">
            {list.map((e, i) => {
              const fields = (e.fields || []).filter((f) => f && f.name)
              return (
                <div
                  key={e.id || i}
                  className="rec-panel"
                  role="tabpanel"
                  id={panelId(i)}
                  aria-labelledby={tabId(i)}
                  hidden={i !== active}
                  // The panel holds nothing focusable, so it takes the focus stop itself.
                  tabIndex={0}
                >
                  <h3>
                    <span className="rec-record">{record}</span>
                    <span className="rec-sep" aria-hidden="true">
                      ›
                    </span>{' '}
                    {e.label}
                  </h3>
                  {e.description ? <p className="rec-desc">{e.description}</p> : null}
                  {fields.length ? (
                    <table>
                      <caption className="rec-caption">{`${record}, ${e.label}: ${fieldCount(fields.length)}`}</caption>
                      <thead>
                        <tr>
                          <th scope="col">{fieldColumnLabel || 'Field'}</th>
                          <th scope="col">{sourceColumnLabel || 'Filled by'}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {fields.map((f, fi) => (
                          <tr key={f.id || fi}>
                            <th scope="row">{f.name}</th>
                            <td>{f.source}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : null}
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </section>
  )
}

const css = `
  .ncx-rec{padding:clamp(56px,7vw,88px) 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
  .ncx-rec .rec-eyebrow{font-family:var(--font-display),Arial,sans-serif;font-size:14px;color:var(--ncx-crimson-ink);margin:0 0 12px}
  .ncx-rec h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:clamp(28px,3.4vw,38px);
    letter-spacing:-.03em;line-height:1.15;margin:0;max-width:var(--ncx-heading-max);color:var(--ncx-ink)}
  .ncx-rec .rec-intro{color:var(--ncx-muted);margin:14px 0 0;max-width:64ch;font-size:18px;line-height:1.6}
  /* Entity grid on the left, record panel on the right. */
  .ncx-rec .rec-body{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(24px,3.5vw,48px);
    align-items:start;margin-top:40px}
  .ncx-rec .rec-tablist{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
  .ncx-rec [role="tab"]{display:flex;flex-direction:column;align-items:flex-start;gap:6px;min-height:44px;padding:14px 16px;
    text-align:left;background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);
    color:var(--ncx-ink);cursor:pointer;transition:background-color .15s,border-color .15s,color .15s}
  .ncx-rec [role="tab"]:hover{border-color:var(--ncx-rule-strong)}
  .ncx-rec [role="tab"]:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:2px}
  .ncx-rec .rec-count{order:-1;font-family:var(--font-label),monospace;font-size:11.5px;font-weight:500;letter-spacing:.06em;
    text-transform:uppercase;line-height:1.2;color:var(--ncx-muted)}
  .ncx-rec .rec-hidden,.ncx-rec .rec-caption{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;
    clip:rect(0 0 0 0);white-space:nowrap;border:0}
  .ncx-rec .rec-name{display:flex;align-items:center;gap:8px;font-family:var(--font-display),Arial,sans-serif;
    font-size:16px;font-weight:500;line-height:1.3}
  .ncx-rec .rec-icon{display:inline-flex;flex:none;width:18px;height:18px}
  .ncx-rec .rec-icon svg{width:100%;height:100%}
  .ncx-rec [role="tab"][aria-selected="true"]{background:var(--ncx-navy);border-color:var(--ncx-navy);color:var(--ncx-on-navy)}
  .ncx-rec [role="tab"][aria-selected="true"] .rec-count{color:var(--ncx-on-navy-soft)}
  /* The record panel. */
  .ncx-rec .rec-panel{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-panel);
    padding:clamp(22px,3vw,32px);box-shadow:var(--ncx-shadow)}
  .ncx-rec .rec-panel[hidden]{display:none}
  .ncx-rec .rec-panel:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
  .ncx-rec .rec-panel h3{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:clamp(20px,2.2vw,24px);
    letter-spacing:-.02em;line-height:1.3;margin:0;color:var(--ncx-ink)}
  .ncx-rec .rec-record{color:var(--ncx-muted)}
  .ncx-rec .rec-sep{color:var(--ncx-faint);margin-left:.35em}
  .ncx-rec .rec-desc{margin:10px 0 0;font-size:16px;line-height:1.6;color:var(--ncx-muted)}
  .ncx-rec table{width:100%;margin-top:22px;border-collapse:collapse;font-size:15px;line-height:1.5}
  .ncx-rec th,.ncx-rec td{padding:12px 16px 12px 0;text-align:left;vertical-align:top;border-bottom:1px solid var(--ncx-rule-soft)}
  .ncx-rec th:last-child,.ncx-rec td:last-child{padding-right:0}
  .ncx-rec thead th{width:45%;font-family:var(--font-label),monospace;font-size:11.5px;font-weight:500;letter-spacing:.06em;
    text-transform:uppercase;color:var(--ncx-muted);border-bottom-color:var(--ncx-rule)}
  .ncx-rec thead th:last-child{width:auto}
  .ncx-rec tbody th{font-weight:500;color:var(--ncx-ink)}
  .ncx-rec tbody td{color:var(--ncx-body)}
  .ncx-rec tbody tr:last-child th,.ncx-rec tbody tr:last-child td{border-bottom:0}
  @media (max-width:899.98px){
    .ncx-rec .rec-body{grid-template-columns:minmax(0,1fr)}
  }
  @media (prefers-reduced-motion:reduce){
    .ncx-rec [role="tab"]{transition:none}
  }
`
