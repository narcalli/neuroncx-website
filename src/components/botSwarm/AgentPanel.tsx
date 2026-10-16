import React from 'react'

import type { MicroApp, MicroAppsMaster } from '@/payload-types'

/** One step of the panel: its title and the line under it. */
export type PanelStep = { title: string; line: string }

// Used only when the master record has no five steps yet. The order is the
// one every agent is described in: hears, checks, acts, hands over, records.
const DEFAULT_TITLES = ['Hears', 'Checks', 'Acts', 'Hands over', 'Records']

/** The five step titles, from the master record's Five steps, in order. */
export const panelTitles = (master?: MicroAppsMaster | null): string[] =>
  DEFAULT_TITLES.map((fallback, i) => master?.fiveSteps?.[i]?.title || fallback)

/** The hub's five steps: the master record's own titles and lines. */
export const hubSteps = (master: MicroAppsMaster): PanelStep[] =>
  (master.fiveSteps || []).map((s) => ({ title: s.title, line: s.line }))

/** An agent's five steps: the master record's titles with the agent's own fields. */
export const agentSteps = (agent: MicroApp, master?: MicroAppsMaster | null): PanelStep[] => {
  const titles = panelTitles(master)
  return [agent.hears, agent.checks, agent.acts, agent.handsOver, agent.records].map((line, i) => ({
    title: titles[i],
    line: line || '',
  }))
}

/**
 * The five steps every agent is described by, as a strip: across the page
 * in "row", one under another in "column" (beside another panel). Steps
 * with no line are left out; with none, nothing renders. Step titles are
 * h3, under the section's h2.
 */
export const AgentPanel: React.FC<{ steps: PanelStep[]; layout?: 'row' | 'column' }> = ({
  steps,
  layout = 'row',
}) => {
  const shown = steps.filter((s) => s.title && s.line)
  if (!shown.length) return null
  return (
    <>
      <style>{`
        .ncx-bsp{list-style:none;margin:0;padding:0;display:grid;gap:14px;counter-reset:step}
        .ncx-bsp.is-row{grid-template-columns:repeat(var(--steps),minmax(0,1fr))}
        .ncx-bsp > li{position:relative;background:var(--ncx-white);border:1px solid var(--ncx-rule);
          border-radius:var(--ncx-r-card);padding:20px 18px 22px}
        .ncx-bsp .n{display:inline-flex;align-items:center;justify-content:center;width:30px;height:30px;
          border-radius:50%;background:var(--ncx-crimson-tint);color:var(--ncx-crimson-ink);
          font-family:var(--font-display),Arial,sans-serif;font-size:13px;font-weight:600;margin:0 0 12px}
        .ncx-bsp h3{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:17px;
          line-height:1.3;margin:0 0 6px;color:var(--ncx-ink)}
        .ncx-bsp p{margin:0;font-size:15px;line-height:1.55;color:var(--ncx-muted)}
        /* The arrow from one step to the next. */
        .ncx-bsp.is-row > li:not(:last-child)::after{content:"";position:absolute;top:34px;right:-12px;z-index:1;
          width:10px;height:10px;border-top:2px solid var(--ncx-rule-strong);border-right:2px solid var(--ncx-rule-strong);
          transform:rotate(45deg);background:transparent}
        .ncx-bsp.is-column > li{display:grid;grid-template-columns:30px minmax(0,1fr);column-gap:14px;padding:16px 18px}
        .ncx-bsp.is-column .n{margin:0;grid-row:span 2}
        @media(max-width:1023.98px){
          .ncx-bsp.is-row{grid-template-columns:minmax(0,1fr)}
          .ncx-bsp.is-row > li{display:grid;grid-template-columns:30px minmax(0,1fr);column-gap:14px;padding:16px 18px}
          .ncx-bsp.is-row .n{margin:0;grid-row:span 2}
          .ncx-bsp.is-row > li:not(:last-child)::after{display:none}
        }
      `}</style>
      <ol
        className={`ncx-bsp is-${layout}`}
        style={{ '--steps': shown.length } as React.CSSProperties}
      >
        {shown.map((s, i) => (
          <li key={i}>
            <span className="n" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3>{s.title}</h3>
            <p>{s.line}</p>
          </li>
        ))}
      </ol>
    </>
  )
}
