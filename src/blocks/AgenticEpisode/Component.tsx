'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { animate, inView } from 'motion/react'

import type { AgenticEpisodeBlock as AgenticEpisodeProps } from '@/payload-types'

import { edgeLabelWidth, timeline } from './geometry'

type Point = NonNullable<AgenticEpisodeProps['points']>[number]

/**
 * The episode timeline: a bar from the episode's start to its end, with its
 * points, and a caption for the point in focus.
 *
 * From 760px up the bar runs across, inset from the panel edges so the first
 * and last points have room for their labels (geometry.ts). Labels sit under
 * their points on one top line, at most two lines each, and never touch:
 * middle labels are centred, the first and last line up with the outer edge
 * of their point. Below 760px it runs down the left side, each point with
 * its label and caption beside it.
 */
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
  const tlRef = useRef<HTMLDivElement>(null)
  const [progress, setProgress] = useState(0)
  const [selected, setSelected] = useState<number | null>(null)
  const count = list.length
  const last = count - 1
  // Re-measure when the labels change, not on every render.
  const labelKey = list.map((p) => p.label).join('|')

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

  // Plays once, the first time the card is mostly in view. The observer
  // stops watching after that first call.
  useEffect(() => {
    const card = wrapRef.current
    if (!card) return
    return inView(
      card,
      () => {
        play()
      },
      { amount: 0.45 },
    )
  }, [])

  // The CSS lays the timeline out from the panel's width alone. Three things
  // need the rendered page: a wrapped middle label's button fills its slot,
  // so it is narrowed to its widest line; the first and last labels may then
  // run wider, up to their neighbour's button; and the upright bar (below
  // 760px) ends at the last point, whose caption makes it taller than its dot.
  useLayoutEffect(() => {
    const wrap = tlRef.current
    if (!wrap) return
    const refine = () => {
      const items = [...wrap.querySelectorAll<HTMLLIElement>(':scope .tl > li')]
      if (!items.length) return
      const across = getComputedStyle(items[0]).position === 'absolute'
      wrap.style.setProperty('--last-h', `${items[items.length - 1].offsetHeight}px`)
      for (const li of items) {
        li.style.removeProperty('--edge-w')
        li.querySelector<HTMLElement>('.pt')?.style.removeProperty('width')
      }
      if (!across || items.length < 3) return
      const { spacing } = timeline(wrap.clientWidth, items.length)
      // Each middle button as wide as its label's widest line, which keeps its line breaks.
      for (const li of items.slice(1, -1)) {
        const button = li.querySelector<HTMLElement>('.pt')
        const label = li.querySelector('.lbl')
        if (!button || !label) continue
        const range = document.createRange()
        range.selectNodeContents(label)
        button.style.width = `${Math.ceil(range.getBoundingClientRect().width) + 1}px`
      }
      // The neighbour's rendered button: as wide as its label, so its click
      // area and the edge label's stay apart too.
      const buttonWidth = (li: HTMLLIElement) => li.querySelector('.pt')?.getBoundingClientRect().width
      const set = (li: HTMLLIElement, neighbour: HTMLLIElement) =>
        li.style.setProperty('--edge-w', `${edgeLabelWidth(spacing, items.length, buttonWidth(neighbour))}px`)
      set(items[0], items[1])
      set(items[items.length - 1], items[items.length - 2])
    }
    refine()
    const watch = new ResizeObserver(refine)
    watch.observe(wrap)
    document.fonts?.ready.then(refine).catch(() => {})
    return () => watch.disconnect()
  }, [count, labelKey])

  if (!count) return null

  // Each point sits at an even fraction of the bar, first at 0 and last at 1.
  const pos = (i: number) => (count === 1 ? 0.5 : i / last)
  const reached = (i: number) => progress >= pos(i) - 0.001
  const shownIdx = selected !== null ? selected : reached(count - 1) ? last : null
  const place = (i: number) => (count === 1 ? 'only' : i === 0 ? 'first' : i === last ? 'last' : 'mid')

  return (
    <section className="ncx-epi">
      <style>{timelineCss}</style>
      <div className="wrap ncx-container">
        <h2>{heading}</h2>
        {paras.map((p, i) => (
          <p className="para" key={i}>
            {p.text}
          </p>
        ))}

        <div className="card" ref={wrapRef} style={{ '--n': count } as React.CSSProperties}>
          <div className="head">
            <span className="start">{startLabel || 'Episode open'}</span>
            <button className="replay" type="button" onClick={play}>
              Replay
            </button>
            <span className="end">{endLabel || 'Episode closes'}</span>
          </div>
          <div className="tlwrap" ref={tlRef}>
            <div className="bar" style={{ '--p': progress } as React.CSSProperties}>
              <i className="fill" />
            </div>
            <ol className="tl">
              {list.map((p, i) => (
                <li
                  key={i}
                  className={`${place(i)}${reached(i) ? ' done' : ''}`}
                  style={{ '--i': i } as React.CSSProperties}
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
                    <span className="lbl">{p.label}</span>
                  </button>
                  {p.caption ? <p className="pcap">{p.caption}</p> : null}
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

/*
 * --n is the number of points, set on the card. --inset and --d (the bar's
 * inset and the distance between points, as in geometry.ts) are written in
 * terms of 100%, which each rule resolves against the panel's width: the
 * head, the bar and the points all span the panel.
 */
const timelineCss = `
        .ncx-epi{padding:84px 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-epi h2{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:clamp(1.55rem,3.4vw,2.2rem);max-width:var(--ncx-heading-max);margin:0;color:var(--ncx-ink)}
        .ncx-epi .para{max-width:62ch;margin-top:18px;color:var(--ncx-muted)}
        .ncx-epi .card{margin-top:46px;background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:16px;padding:24px 24px 22px;
          --inset:max(60px,calc((100% - (var(--n) - 1) * 12px) / (2 * var(--n))));
          --d:calc((100% - 2 * var(--inset)) / (var(--n) - 1))}
        .ncx-epi .head{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:.8rem;font-weight:500;margin-bottom:14px}
        /* The start and end labels sit over the first and last points, lined up with their outer edges. */
        .ncx-epi .head .start{margin-left:calc(var(--inset) - 10px)}
        .ncx-epi .head .end{margin-right:calc(var(--inset) - 10px);text-align:right}
        .ncx-epi .replay{background:none;border:1px solid var(--ncx-rule);color:var(--ncx-body);border-radius:999px;padding:5px 14px;font-size:.78rem;font-weight:500;cursor:pointer;font-family:inherit}
        .ncx-epi .tlwrap{position:relative;height:92px}
        .ncx-epi .bar{position:absolute;left:var(--inset);right:var(--inset);top:14px;height:14px;border-radius:7px;background:var(--ncx-cloud);border:1px solid var(--ncx-rule);overflow:hidden}
        .ncx-epi .fill{position:absolute;inset:0;transform-origin:left center;transform:scaleX(var(--p,0));background:var(--ncx-crimson)}
        .ncx-epi .tl{list-style:none;margin:0;padding:0;position:absolute;inset:0}
        /* Every point on one top line. A middle label is centred on its point and
           at most the distance between two points less 12px wide; the first and
           last start at their point's outer edge (their width: geometry.ts). */
        /* The slots only place the labels: clicks pass through their empty
           parts, and each button is as wide as its own label, so one label's
           slot never takes another's click. */
        .ncx-epi .tl li{pointer-events:none;position:absolute;top:11px;left:calc(var(--inset) + var(--d) * var(--i));width:calc(var(--d) - 12px);transform:translateX(-50%)}
        .ncx-epi .tl li.first{left:calc(var(--inset) - 10px);width:var(--edge-w,calc(var(--d) / 2 + 4px));transform:none}
        .ncx-epi .tl li.last{left:auto;right:calc(var(--inset) - 10px);width:var(--edge-w,calc(var(--d) / 2 + 4px));transform:none}
        .ncx-epi .tl li.only{left:50%;width:auto;max-width:100%}
        .ncx-epi .pt{pointer-events:auto;background:none;border:0;padding:0;margin:0 auto;cursor:pointer;width:fit-content;max-width:100%;display:flex;flex-direction:column;align-items:center;gap:12px;
          font-weight:500;font-size:.78rem;line-height:1.35;color:var(--ncx-muted);font-family:inherit}
        .ncx-epi .tl li.first .pt{align-items:flex-start;margin:0 auto 0 0}
        .ncx-epi .tl li.last .pt{align-items:flex-end;margin:0 0 0 auto}
        .ncx-epi .lbl{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;max-width:100%;text-align:center;overflow-wrap:break-word;hyphens:auto}
        .ncx-epi .tl li.first .lbl{text-align:left}
        .ncx-epi .tl li.last .lbl{text-align:right}
        .ncx-epi .pcap{display:none}
        .ncx-epi .dot{flex:none;display:block;width:20px;height:20px;border-radius:50%;background:var(--ncx-white);border:3px solid var(--ncx-rule);transition:background .35s,border-color .35s,box-shadow .35s}
        .ncx-epi .tl li.done .dot{background:var(--ncx-crimson);border-color:var(--ncx-on-navy);box-shadow:0 0 0 2px var(--ncx-crimson)}
        /* Keyboard focus only, and only on the point: a 2px crimson ring. */
        .ncx-epi .pt:focus,.ncx-epi .pt:focus-visible{outline:none}
        .ncx-epi .pt:focus-visible .dot{outline:2px solid var(--ncx-crimson);outline-offset:4px}
        .ncx-epi .caption{margin-top:6px;border-radius:12px;padding:14px 18px;background:var(--ncx-cloud);border-left:4px solid var(--ncx-crimson);display:flex;flex-direction:column;gap:2px;min-height:76px;justify-content:center}
        .ncx-epi .caption b{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:1rem}
        .ncx-epi .caption span{font-size:.95rem;color:var(--ncx-muted)}
        .ncx-epi .close{font-size:.88rem;color:var(--ncx-muted);margin-top:16px}
        /* Below 760px: upright, down the left side. Each point has its label and
           caption beside it, so the shared caption box below is not needed. */
        @media (max-width:759.98px){
          .ncx-epi .head .start,.ncx-epi .head .end{margin:0}
          .ncx-epi .tlwrap{height:auto}
          .ncx-epi .bar{left:7px;right:auto;width:6px;top:10px;bottom:calc(var(--last-h,20px) - 10px);height:auto}
          .ncx-epi .fill{transform-origin:center top;transform:scaleY(var(--p,0))}
          .ncx-epi .tl{position:relative;inset:auto;display:flex;flex-direction:column;gap:22px}
          .ncx-epi .tl li,.ncx-epi .tl li.first,.ncx-epi .tl li.last,.ncx-epi .tl li.only{position:relative;top:auto;left:auto;right:auto;width:auto;max-width:none;transform:none;padding-left:36px}
          .ncx-epi .pt,.ncx-epi .tl li.first .pt,.ncx-epi .tl li.last .pt{display:block;width:100%;margin:0;text-align:left;font-size:.95rem;color:var(--ncx-ink)}
          .ncx-epi .dot{position:absolute;left:0;top:0}
          .ncx-epi .lbl,.ncx-epi .tl li.first .lbl,.ncx-epi .tl li.last .lbl{display:block;text-align:left;-webkit-line-clamp:unset;line-clamp:none;line-height:20px}
          .ncx-epi .pcap{display:block;margin:4px 0 0;font-size:.88rem;line-height:1.5;color:var(--ncx-muted)}
          .ncx-epi .caption{display:none}
        }
`
