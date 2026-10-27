'use client'

import React, { useId, useRef, useState } from 'react'

import type { AudienceTabsBlock as Props } from '@/payload-types'

type Tab = Props['tabs'][number]

/**
 * A "#section" link scrolls smoothly to the block with that id (its htmlId),
 * or jumps there when the reader has asked for less motion. The address bar
 * shows the new hash, and focus moves to the section for keyboard readers.
 */
function onHashLink(e: React.MouseEvent<HTMLAnchorElement>) {
  const href = e.currentTarget.getAttribute('href') || ''
  let id = href.slice(1)
  try {
    id = decodeURIComponent(id)
  } catch {}
  const target = id ? document.getElementById(id) : null
  if (!target) return
  e.preventDefault()
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  target.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  history.pushState(null, '', href)
  if (!target.hasAttribute('tabindex')) target.setAttribute('tabindex', '-1')
  target.focus({ preventScroll: true })
}

/**
 * Audience tabs: one section with a tab per reader group. Follows the WAI-ARIA
 * tabs pattern (automatic activation): Left and Right move between tabs, Home
 * and End go to the first and last, and only the selected tab is in the Tab
 * order. Every panel is in the server-rendered HTML; the ones not selected
 * carry the hidden attribute, so search engines still read them.
 */
export const AudienceTabsBlock: React.FC<Props> = ({ eyebrow, heading, intro, tabs }) => {
  const list: Tab[] = (tabs || []).filter((t) => t && t.label)
  const [active, setActive] = useState(0)
  const refs = useRef<(HTMLButtonElement | null)[]>([])
  const uid = useId()
  if (!list.length) return null

  const headingId = `${uid}-heading`
  const tabId = (i: number) => `${uid}-tab-${i}`
  const panelId = (i: number) => `${uid}-panel-${i}`

  const select = (i: number) => {
    setActive(i)
    refs.current[i]?.focus()
  }

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const last = list.length - 1
    const next =
      e.key === 'ArrowRight' ? (active === last ? 0 : active + 1)
      : e.key === 'ArrowLeft' ? (active === 0 ? last : active - 1)
      : e.key === 'Home' ? 0
      : e.key === 'End' ? last
      : null
    if (next === null) return
    e.preventDefault()
    select(next)
  }

  return (
    <section className="ncx-aud">
      <style>{css}</style>
      <div className="ncx-container">
        {eyebrow ? <p className="aud-eyebrow">{eyebrow}</p> : null}
        <h2 id={headingId}>{heading}</h2>
        {intro ? <p className="aud-intro">{intro}</p> : null}

        <div className="aud-tablist" role="tablist" aria-labelledby={headingId} onKeyDown={onKeyDown}>
          {list.map((t, i) => (
            <button
              key={t.id || i}
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
              {t.label}
            </button>
          ))}
        </div>

        {list.map((t, i) => {
          const points = (t.points || []).filter((p) => p && p.text)
          const links = (t.links || []).filter((l) => l && l.label && l.url)
          return (
            <div
              key={t.id || i}
              className="aud-panel"
              role="tabpanel"
              id={panelId(i)}
              aria-labelledby={tabId(i)}
              hidden={i !== active}
              // A panel with no links has nothing to focus, so it takes the focus stop itself.
              tabIndex={links.length ? undefined : 0}
              data-cols={points.length ? '2' : '1'}
            >
              <div className="aud-copy">
                {t.title ? <h3>{t.title}</h3> : null}
                {t.intro ? <p>{t.intro}</p> : null}
                {links.length ? (
                  <ul className="aud-links">
                    {links.map((l, li) => (
                      <li key={l.id || li}>
                        <a href={l.url} onClick={l.url.startsWith('#') ? onHashLink : undefined}>
                          {l.label}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
              {points.length ? (
                <ul className="aud-points">
                  {points.map((p, pi) => (
                    <li key={p.id || pi}>{p.text}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          )
        })}
      </div>
    </section>
  )
}

const css = `
  .ncx-aud{padding:clamp(56px,7vw,88px) 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
  .ncx-aud .aud-eyebrow{font-family:var(--font-display),Arial,sans-serif;font-size:14px;color:var(--ncx-crimson-ink);margin:0 0 12px}
  .ncx-aud h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:clamp(28px,3.4vw,38px);
    letter-spacing:-.03em;line-height:1.15;margin:0;max-width:var(--ncx-heading-max);color:var(--ncx-ink)}
  .ncx-aud .aud-intro{color:var(--ncx-muted);margin:14px 0 0;max-width:64ch;font-size:18px;line-height:1.6}
  /* The tab row: a hairline underneath, sideways scroll when the names overflow. */
  .ncx-aud .aud-tablist{display:flex;gap:4px;margin-top:36px;border-bottom:1px solid var(--ncx-rule);
    overflow-x:auto;scrollbar-width:thin}
  .ncx-aud [role="tab"]{flex:none;min-height:44px;padding:10px 18px;margin-bottom:-1px;background:none;border:0;
    border-bottom:2px solid transparent;font-family:var(--font-display),Arial,sans-serif;font-size:16px;font-weight:500;
    line-height:1.3;white-space:nowrap;color:var(--ncx-muted);cursor:pointer;transition:color .15s,border-color .15s}
  .ncx-aud [role="tab"]:hover{color:var(--ncx-ink)}
  .ncx-aud [role="tab"][aria-selected="true"]{color:var(--ncx-ink);border-bottom-color:var(--ncx-crimson)}
  .ncx-aud [role="tab"]:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:-2px;border-radius:6px 6px 0 0}
  /* Panel: title, intro and links on the left; capability cards on the right. */
  .ncx-aud .aud-panel{display:grid;grid-template-columns:minmax(0,5fr) minmax(0,7fr);gap:clamp(28px,4vw,56px);
    align-items:start;padding-top:36px}
  .ncx-aud .aud-panel[hidden]{display:none}
  /* A tab with no points: its title, intro and links take the full width. */
  .ncx-aud .aud-panel[data-cols="1"]{grid-template-columns:minmax(0,1fr)}
  .ncx-aud .aud-panel:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:6px;border-radius:var(--ncx-r-card)}
  .ncx-aud .aud-copy h3{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:clamp(22px,2.4vw,26px);
    letter-spacing:-.02em;line-height:1.25;margin:0 0 12px;color:var(--ncx-ink)}
  .ncx-aud .aud-copy p{margin:0;font-size:17px;line-height:1.6;color:var(--ncx-body)}
  .ncx-aud .aud-links{list-style:none;margin:20px 0 0;padding:0;display:flex;flex-direction:column;gap:10px}
  .ncx-aud .aud-links a{color:var(--ncx-link);font-weight:500;font-size:16px;text-decoration:none;
    text-underline-offset:3px}
  .ncx-aud .aud-links a:hover{text-decoration:underline}
  .ncx-aud .aud-links a:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px;border-radius:4px}
  .ncx-aud .aud-points{list-style:none;margin:0;padding:0;display:grid;gap:12px}
  .ncx-aud .aud-points li{position:relative;padding:16px 20px 16px 42px;background:var(--ncx-white);
    border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);font-size:16px;line-height:1.55;color:var(--ncx-body)}
  .ncx-aud .aud-points li::before{content:"";position:absolute;left:20px;top:calc(16px + .775em - 4px);width:8px;height:8px;
    border-radius:50%;background:var(--ncx-crimson)}
  @media (max-width:899.98px){
    .ncx-aud .aud-panel{grid-template-columns:minmax(0,1fr)}
  }
  @media (prefers-reduced-motion:reduce){
    .ncx-aud [role="tab"]{transition:none}
  }
`
