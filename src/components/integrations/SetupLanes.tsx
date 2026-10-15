'use client'

import React, { useId, useState } from 'react'

/** One setupChecklist row, as plain text from the page. */
export type SetupRow = { id: string; item: string; providedBy: 'you' | 'partner' | 'neuroncx' }

const LANES: { by: SetupRow['providedBy']; title: (name: string) => string }[] = [
  { by: 'you', title: () => 'From You' },
  { by: 'partner', title: (name) => `From ${name}` },
  { by: 'neuroncx', title: () => 'From NeuronCx' },
]

/**
 * The setup checklist in three lanes, by who provides each step. Every step
 * is a real checkbox; ticking it fills the progress bar. The ticks live only
 * in this visit's page state: nothing is saved.
 */
export const SetupLanes: React.FC<{ name: string; rows: SetupRow[] }> = ({ name, rows }) => {
  const [ticked, setTicked] = useState<Record<string, boolean>>({})
  const uid = useId()
  const lanes = LANES.map((lane) => ({
    ...lane,
    items: rows.filter((r) => r.providedBy === lane.by),
  })).filter((lane) => lane.items.length)
  const total = lanes.reduce((n, lane) => n + lane.items.length, 0)
  const done = lanes.reduce((n, lane) => n + lane.items.filter((r) => ticked[r.id]).length, 0)

  return (
    <div className="ncx-isetup">
      <style>{`
        .ncx-isetup__progress{display:flex;align-items:center;gap:14px;margin:0 0 20px;max-width:520px}
        .ncx-isetup__bar{flex:1;height:6px;border-radius:3px;background:var(--ncx-rule);overflow:hidden}
        .ncx-isetup__fill{display:block;height:100%;border-radius:3px;background:var(--ncx-teal)}
        .ncx-isetup__count{flex:none;font-family:var(--font-display),Arial,sans-serif;font-size:14px;
          font-weight:600;color:var(--ncx-ink);font-variant-numeric:tabular-nums}

        .ncx-isetup__lanes{display:grid;grid-template-columns:repeat(var(--lanes),minmax(0,1fr));gap:16px}
        .ncx-isetup__lane{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);
          padding:18px 18px 10px}
        .ncx-isetup__lane h3{margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:.08em;
          text-transform:uppercase;color:var(--ncx-muted)}
        .ncx-isetup__lane ul{list-style:none;margin:0;padding:0}
        .ncx-isetup__lane li + li{border-top:1px solid var(--ncx-rule-soft)}

        .ncx-isetup__item{position:relative;display:flex;align-items:flex-start;gap:12px;padding:12px 0;cursor:pointer}
        .ncx-isetup__item input{position:absolute;left:0;top:12px;width:20px;height:20px;margin:0;opacity:0;cursor:pointer}
        .ncx-isetup__box{flex:none;width:20px;height:20px;margin-top:1px;border-radius:6px;border:1.5px solid var(--ncx-rule-strong);
          background:var(--ncx-white);color:var(--ncx-on-navy);display:flex;align-items:center;justify-content:center}
        .ncx-isetup__box path{stroke-dasharray:16;stroke-dashoffset:16}
        .ncx-isetup__item input:checked + .ncx-isetup__box{background:var(--ncx-teal);border-color:var(--ncx-teal)}
        .ncx-isetup__item input:checked + .ncx-isetup__box path{stroke-dashoffset:0}
        .ncx-isetup__item input:focus-visible + .ncx-isetup__box{outline:2px solid var(--ncx-focus);outline-offset:2px}
        .ncx-isetup__text{font-size:15px;line-height:1.5;color:var(--ncx-ink)}

        @media(prefers-reduced-motion:no-preference){
          .ncx-isetup__fill{transition:width .35s ease}
          .ncx-isetup__box{transition:background .2s ease,border-color .2s ease}
          .ncx-isetup__box path{transition:stroke-dashoffset .3s ease .05s}
        }
        @media(max-width:699.98px){.ncx-isetup__lanes{grid-template-columns:minmax(0,1fr)}}
      `}</style>

      <div className="ncx-isetup__progress">
        <div
          className="ncx-isetup__bar"
          role="progressbar"
          aria-label="Setup steps ticked"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={done}
          aria-valuetext={`${done} of ${total}`}
        >
          <span
            className="ncx-isetup__fill"
            style={{ width: `${total ? (done / total) * 100 : 0}%` }}
          />
        </div>
        <span className="ncx-isetup__count" aria-hidden="true">
          {done} / {total}
        </span>
      </div>

      <div className="ncx-isetup__lanes" style={{ '--lanes': lanes.length } as React.CSSProperties}>
        {lanes.map((lane) => (
          <section key={lane.by} className="ncx-isetup__lane" aria-labelledby={`${uid}-${lane.by}`}>
            <h3 id={`${uid}-${lane.by}`}>{lane.title(name)}</h3>
            <ul>
              {lane.items.map((r) => (
                <li key={r.id}>
                  <label className="ncx-isetup__item">
                    <input
                      type="checkbox"
                      checked={Boolean(ticked[r.id])}
                      onChange={(e) => setTicked((prev) => ({ ...prev, [r.id]: e.target.checked }))}
                    />
                    <span className="ncx-isetup__box" aria-hidden="true">
                      <svg
                        viewBox="0 0 16 16"
                        width="12"
                        height="12"
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2.4"
                      >
                        <path d="M3.5 8.5l3 3 6-7" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    </span>
                    <span className="ncx-isetup__text">{r.item}</span>
                  </label>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  )
}
