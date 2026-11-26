'use client'

import React, { useId, useState } from 'react'

type Props = {
  openLabel: string
  closeLabel: string
  startOpen?: boolean | null
  children: React.ReactNode
}

const ChevronIcon = () => (
  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <path d="M4 6l4 4 4-4" />
  </svg>
)

/**
 * The only interactive piece of the Stack Comparison block: a real button
 * that opens and closes the table below the cards. The table itself is
 * built on the server (Component.tsx) and handed in as children — this
 * component only owns the open/closed state and the CSS that animates it.
 *
 * The panel is always in the DOM (never unmounted), so there is nothing for
 * the browser to lay out when it opens: grid-template-rows animates between
 * 0fr and 1fr, which grows the row to the content's own height without a
 * jump. Reduced motion drops the transition and snaps instead.
 */
export const StackComparisonToggle: React.FC<Props> = ({ openLabel, closeLabel, startOpen, children }) => {
  const [open, setOpen] = useState(Boolean(startOpen))
  const panelId = useId()

  return (
    <div className="sc-toggle-wrap">
      <style>{css}</style>
      <button type="button" className="sc-toggle" aria-expanded={open} aria-controls={panelId} onClick={() => setOpen((v) => !v)}>
        <span>{open ? closeLabel : openLabel}</span>
        <span className={`sc-toggle-chev${open ? ' is-open' : ''}`}>
          <ChevronIcon />
        </span>
      </button>
      <div id={panelId} className={`sc-panel${open ? ' is-open' : ''}`}>
        <div className="sc-panel-inner">{children}</div>
      </div>
    </div>
  )
}

const css = `
  .sc-toggle-wrap{display:flex;flex-direction:column;align-items:center}
  .sc-toggle{display:inline-flex;align-items:center;gap:8px;background:var(--ncx-white);color:var(--ncx-ink);
    border:1px solid var(--ncx-rule);border-radius:999px;padding:12px 22px;min-height:44px;
    font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:14.5px;cursor:pointer;
    transition:border-color .15s ease,background .15s ease}
  .sc-toggle:hover{border-color:var(--ncx-rule-strong);background:var(--ncx-paper)}
  .sc-toggle:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
  .sc-toggle-chev{display:inline-flex;width:14px;height:14px;transition:transform .2s ease}
  .sc-toggle-chev svg{width:100%;height:100%}
  .sc-toggle-chev.is-open{transform:rotate(180deg)}

  .sc-panel{display:grid;grid-template-rows:0fr;opacity:0;width:100%;
    transition:grid-template-rows .32s ease,opacity .32s ease}
  .sc-panel.is-open{grid-template-rows:1fr;opacity:1}
  .sc-panel-inner{overflow:hidden;min-height:0}

  @media(prefers-reduced-motion:reduce){
    .sc-toggle,.sc-toggle-chev,.sc-panel{transition:none}
  }
`
