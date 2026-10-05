'use client'

import React, { useEffect, useRef, useState } from 'react'
import { animate, useInView } from 'motion/react'

import type { AgenticEpisodeBlock as AgenticEpisodeProps } from '@/payload-types'

type Point = NonNullable<AgenticEpisodeProps['points']>[number]

export const AgenticEpisodeBlock: React.FC<AgenticEpisodeProps> = ({
  heading,
  intro,
  startLabel,
  endLabel,
  points,
  closing,
}) => {
  const list: Point[] = (points || []).filter((p) => p && p.label)
  const paras = (intro || []).filter((p) => p && p.text)
  const wrapRef = useRef<HTMLDivElement>(null)
  const inView = useInView(wrapRef, { once: true, amount: 0.45 })
  const [progress, setProgress] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const count = list.length
  const last = count - 1

  // Fills the bar from start to end, then leaves the last point selected.
  const play = () => {
    setSelected(null)
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(1)
      return
    }
    setProgress(0)
    animate(0, 1, { duration: 4.4, ease: 'linear', onUpdate: (v) => setProgress(v) })
  }

  useEffect(() => {
    if (inView) play()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [inView])

  if (!count) return null

  // Each point sits at an even fraction of the bar, first at 0 and last at 1.
  const pos = (i: number) => (count === 1 ? 0.5 : i / last)
  const reached = (i: number) => progress >= pos(i) - 0.001
  const shownIdx = selected !== null ? selected : reached(count - 1) ? last : null

  return (
    <section className="ncx-epi">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Poppins:wght@600&display=swap');
        .ncx-epi{padding:84px 0;font-family:Inter,Arial,sans-serif;color:var(--ncx-body)}
        .ncx-epi .wrap{max-width:1080px;margin:0 auto;padding:0 24px}
        .ncx-epi h2{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:clamp(1.55rem,3.4vw,2.2rem);max-width:24ch;margin:0;color:var(--ncx-navy)}
        .ncx-epi .para{max-width:62ch;margin-top:18px;color:var(--ncx-muted)}
        .ncx-epi .card{margin-top:46px;background:#fff;border:1px solid var(--ncx-rule);border-radius:16px;padding:24px 24px 22px}
        .ncx-epi .head{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:.8rem;font-weight:500;margin-bottom:14px}
        .ncx-epi .replay{background:none;border:1px solid var(--rule2,#CBD0DC);color:var(--ncx-body);border-radius:999px;padding:5px 14px;font-size:.78rem;font-weight:500;cursor:pointer;font-family:inherit}
        .ncx-epi .tlwrap{position:relative;height:112px}
        .ncx-epi .bar{position:absolute;left:0;right:0;top:14px;height:14px;border-radius:7px;background:var(--ncx-cloud);border:1px solid var(--ncx-rule);overflow:hidden}
        .ncx-epi .fill{position:absolute;inset:0;transform-origin:left center;background:linear-gradient(90deg,#C62828,#FF5A5F)}
        .ncx-epi .tl{list-style:none;margin:0;padding:0;position:absolute;inset:0}
        .ncx-epi .tl li{position:absolute;top:11px;transform:translateX(-50%)}
        .ncx-epi .pt{background:none;border:0;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;gap:12px;font-weight:500;font-size:.78rem;color:var(--ncx-muted);font-family:inherit}
        .ncx-epi .dot{display:block;width:20px;height:20px;border-radius:50%;background:#fff;border:3px solid var(--rule2,#CBD0DC);transition:background .35s,border-color .35s,box-shadow .35s}
        .ncx-epi .tl li.done .dot{background:var(--ncx-crimson);border-color:#fff;box-shadow:0 0 0 2px var(--ncx-crimson)}
        .ncx-epi .caption{margin-top:6px;border-radius:12px;padding:14px 18px;background:var(--ncx-cloud);border-left:4px solid var(--ncx-crimson);display:flex;flex-direction:column;gap:2px;min-height:76px;justify-content:center}
        .ncx-epi .caption b{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:1rem}
        .ncx-epi .caption span{font-size:.95rem;color:var(--ncx-muted)}
        .ncx-epi .close{font-size:.88rem;color:var(--ncx-muted);margin-top:16px}
        @media (max-width:720px){
          .ncx-epi .tlwrap{height:auto}
          .ncx-epi .bar{left:7px;right:auto;width:6px;top:10px;bottom:10px;height:auto}
          .ncx-epi .fill{transform-origin:center top}
          .ncx-epi .tl{position:relative;inset:auto;display:flex;flex-direction:column;gap:20px}
          .ncx-epi .tl li{position:static;transform:none}
          .ncx-epi .pt{flex-direction:row;gap:16px;font-size:.9rem}
        }
      `}</style>
      <div className="wrap">
        <h2>{heading}</h2>
        {paras.map((p, i) => (
          <p className="para" key={i}>
            {p.text}
          </p>
        ))}

        <div className="card" ref={wrapRef}>
          <div className="head">
            <span>{startLabel || 'Episode open'}</span>
            <button className="replay" type="button" onClick={play}>
              Replay
            </button>
            <span>{endLabel || 'Episode closes'}</span>
          </div>
          <div className="tlwrap">
            <div className="bar">
              <i className="fill" style={{ transform: `scaleX(${progress})` }} />
            </div>
            <ol className="tl">
              {list.map((p, i) => (
                <li
                  key={i}
                  className={reached(i) ? 'done' : ''}
                  style={{ left: `${pos(i) * 100}%` }}
                >
                  <button
                    type="button"
                    className="pt"
                    onClick={() => {
                      setProgress(pos(i))
                      setSelected(i)
                    }}
                  >
                    <i className="dot" />
                    <span>{p.label}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
          <div className="caption" aria-live="polite">
            {shownIdx !== null ? (
              <>
                <b>{list[shownIdx].label}</b>
                <span>{list[shownIdx].caption}</span>
              </>
            ) : (
              <>
                <b>{startLabel || 'Episode open'}</b>
                <span>Tap a point on the line to see what attaches there.</span>
              </>
            )}
          </div>
          {closing ? <p className="close">{closing}</p> : null}
        </div>
      </div>
    </section>
  )
}
