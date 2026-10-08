'use client'

import React, { useState } from 'react'
import { motion } from 'motion/react'

import type { AgenticCartsDemoBlock as AgenticCartsDemoProps } from '@/payload-types'

type Cart = NonNullable<AgenticCartsDemoProps['carts']>[number]

const MAX = 6

function historyText(n: number): string {
  if (n === 0) return 'history starts here'
  return `history from ${n} earlier cart${n > 1 ? 's' : ''}`
}

export const AgenticCartsDemoBlock: React.FC<AgenticCartsDemoProps> = ({
  heading,
  intro,
  modelALabel,
  modelBLabel,
  carts,
  addLabel,
  noteA,
  noteB,
}) => {
  const starting: Cart[] = (carts || []).filter((c) => c && c.name)
  const [rows, setRows] = useState<Cart[]>(starting)
  const [mode, setMode] = useState<'a' | 'b'>('b')
  const [extra, setExtra] = useState(0)

  const isB = mode === 'b'
  const note = isB ? noteB : noteA
  const full = rows.length >= MAX
  const buttonText = full ? 'Reset' : addLabel || 'Open a new cart'

  const onAdd = () => {
    if (full) {
      setRows(starting)
      setExtra(0)
      return
    }
    const next: Cart = { name: `Cart ${rows.length + 1}`, historyCount: rows.length, id: `added-${extra}` }
    setExtra(extra + 1)
    setRows([...rows, next])
  }

  return (
    <section className="ncx-carts">
      <style>{`
        .ncx-carts{padding:84px 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-carts h2{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:clamp(1.55rem,3.4vw,2.2rem);max-width:24ch;margin:0;color:var(--ncx-ink)}
        .ncx-carts .sec-sub{max-width:62ch;margin-top:18px;color:var(--ncx-muted)}
        .ncx-carts .seg{position:relative;display:grid;grid-template-columns:1fr 1fr;margin-top:38px;padding:4px;border-radius:12px;background:var(--ncx-cloud);border:1px solid var(--ncx-rule);max-width:520px}
        .ncx-carts .seg-pill{position:absolute;left:4px;top:4px;bottom:4px;width:calc(50% - 4px);border-radius:9px;background:var(--ncx-white);box-shadow:0 0 0 1px var(--ncx-rule);transition:transform .45s cubic-bezier(.2,.8,.2,1)}
        .ncx-carts .seg-pill.a{transform:translateX(0)}
        .ncx-carts .seg-pill.b{transform:translateX(100%)}
        .ncx-carts .seg button{position:relative;z-index:1;background:none;border:0;padding:11px 12px;font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.88rem;color:var(--ncx-muted);cursor:pointer}
        .ncx-carts .seg button[aria-pressed="true"]{color:var(--ncx-ink)}
        .ncx-carts .stage{position:relative;margin-top:18px;padding:30px 22px 26px 66px;border-radius:16px;background:var(--ncx-white);border:1px solid var(--ncx-rule)}
        .ncx-carts .txline{position:absolute;left:22px;top:30px;bottom:26px;width:3px;border-radius:3px;background:var(--ncx-crimson);transform-origin:center top}
        .ncx-carts .rows{display:flex;flex-direction:column;gap:14px}
        .ncx-carts .rc{display:flex;justify-content:space-between;align-items:center;gap:8px 14px;flex-wrap:wrap;padding:12px 16px;border-radius:10px;font-size:.95rem}
        .ncx-carts .rc.a{background:var(--ncx-cloud);border:1px solid var(--ncx-rule);color:var(--ncx-muted)}
        .ncx-carts .rc.b{background:var(--ncx-white);border:1.5px solid var(--ncx-crimson);color:var(--ncx-body)}
        .ncx-carts .hist{font-size:.74rem;font-weight:600;color:var(--ncx-crimson-ink);background:var(--ncx-crimson-tint);border-radius:999px;padding:2px 10px}
        .ncx-carts .nohist{font-size:.74rem;color:var(--ncx-faint)}
        .ncx-carts .actions{display:flex;flex-wrap:wrap;align-items:center;gap:14px 18px;margin-top:18px}
        .ncx-carts .btn-s{background:var(--ncx-navy);color:var(--ncx-on-navy);border:0;border-radius:8px;padding:11px 20px;font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.92rem;cursor:pointer}
        .ncx-carts .btn-s:hover{background:var(--ncx-crimson)}
        .ncx-carts .note{font-size:.92rem;color:var(--ncx-muted);flex:1;min-width:220px}
      `}</style>
      <div className="wrap ncx-container">
        <h2>{heading}</h2>
        {intro ? <p className="sec-sub">{intro}</p> : null}

        <div className="seg" role="group" aria-label="Choose a model">
          <span className={`seg-pill ${mode}`} aria-hidden="true" />
          <button type="button" aria-pressed={mode === 'a'} onClick={() => setMode('a')}>
            {modelALabel || 'Leads-and-opportunities model'}
          </button>
          <button type="button" aria-pressed={mode === 'b'} onClick={() => setMode('b')}>
            {modelBLabel || 'NeuronCx'}
          </button>
        </div>

        <div className="stage">
          <motion.div
            className="txline"
            initial={false}
            animate={{ scaleY: isB ? 1 : 0 }}
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
          />
          <div className="rows">
            {rows.map((r, i) => (
              <motion.div
                key={r.id ?? `${r.name}-${i}`}
                className={`rc ${isB ? 'b' : 'a'}`}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1, x: isB ? 0 : (i % 2 === 0 ? 16 : -6) }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <span>{r.name}</span>
                {isB && (r.historyCount ?? 0) > 0 ? (
                  <span className="hist">{historyText(r.historyCount ?? 0)}</span>
                ) : isB ? (
                  <span className="hist">{historyText(0)}</span>
                ) : (
                  <span className="nohist">no history</span>
                )}
              </motion.div>
            ))}
          </div>
        </div>

        <div className="actions">
          <button className="btn-s" type="button" onClick={onAdd}>
            {buttonText}
          </button>
          <span className="note" aria-live="polite">
            {note}
          </span>
        </div>
      </div>
    </section>
  )
}
