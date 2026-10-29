'use client'

import React, { useEffect, useRef, useState } from 'react'
import { isStill } from '@/motion/still'

/** One statusFlow row, as plain text from the page. */
export type FlowRow = {
  id: string
  event: string
  inPartner: string | null
  whatHappens: string
}

type Tone = 'done' | 'warn' | 'stop' | 'neutral'

// The pill colour, worked out from the status text. There is no colour field.
const toneOf = (status: string | null): Tone => {
  const s = (status || '').toLowerCase()
  if (s.includes('confirm') || s.includes('arrive') || s.includes('complete')) return 'done'
  if (s.includes('no-show') || s.includes('no show')) return 'warn'
  if (s.includes('cancel')) return 'stop'
  return 'neutral'
}

const two = (n: number) => String(n).padStart(2, '0')

// Desktop only: from this width the steps scroll past a sticky panel.
const DESKTOP = '(min-width: 900px)'

type Props = {
  /** The integration's name, for the "In {name}" labels and its tile. */
  name: string
  /** The integration's logo; without one, its tile shows the first letter. */
  logoSrc: string | null
  /** The NeuronCx logo for the other tile. */
  brandSrc: string | null
  rows: FlowRow[]
}

/**
 * The status flow as a scroll-through: one step per row on the left and, on
 * desktop, a sticky panel on the right that follows the step at the centre
 * of the screen. The panel repeats what the steps say, so it is hidden from
 * assistive technology. Below 900px the steps are a plain list and nothing
 * here runs.
 */
export const StatusFlow: React.FC<Props> = ({ name, logoSrc, brandSrc, rows }) => {
  const [active, setActive] = useState(0)
  const [live, setLive] = useState(false)
  const steps = useRef<(HTMLLIElement | null)[]>([])

  useEffect(() => {
    const wide = window.matchMedia(DESKTOP)
    let observer: IntersectionObserver | null = null

    const start = () => {
      if (observer) return
      // A thin band across the middle of the screen: the step crossing it is
      // the current one.
      observer = new IntersectionObserver(
        (entries) => {
          for (const entry of entries) {
            if (entry.isIntersecting) {
              setActive(Number((entry.target as HTMLElement).dataset.index))
            }
          }
        },
        { rootMargin: '-48% 0px -48% 0px', threshold: 0 },
      )
      steps.current.forEach((el) => el && observer?.observe(el))
      setLive(true)
    }
    const stop = () => {
      observer?.disconnect()
      observer = null
      setLive(false)
    }
    const sync = () => (wide.matches ? start() : stop())

    sync()
    wide.addEventListener('change', sync)
    return () => {
      wide.removeEventListener('change', sync)
      stop()
    }
  }, [rows.length])

  const goTo = (i: number) => {
    const reduce = isStill(steps.current[i])
    steps.current[i]?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'center' })
  }

  const current = rows[Math.min(active, rows.length - 1)]

  return (
    <div className={`ncx-sflow${live ? ' is-live' : ''}`}>
      <style>{`
        .ncx-sflow{--sflow-top:96px}
        .ncx-sflow__grid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,420px);gap:64px;align-items:start}

        /* Steps */
        .ncx-sflow__steps{list-style:none;margin:0;padding:0}
        .ncx-sflow__step{min-height:60vh;display:flex;flex-direction:column;justify-content:center;gap:14px;padding:24px 0}
        .ncx-sflow.is-live .ncx-sflow__step{opacity:.3}
        .ncx-sflow.is-live .ncx-sflow__step.is-active{opacity:1}
        .ncx-sflow__count{margin:0;font-family:var(--font-display),Arial,sans-serif;font-size:13px;
          letter-spacing:.04em;color:var(--ncx-crimson-ink)}
        .ncx-sflow__step h3{margin:0;font-family:var(--font-display),Arial,sans-serif;font-weight:600;
          font-size:clamp(24px,2.6vw,32px);line-height:1.2;letter-spacing:-.02em;color:var(--ncx-ink)}
        .ncx-sflow__label{display:block;margin:0 0 6px;font-size:12px;font-weight:600;letter-spacing:.08em;
          text-transform:uppercase;color:var(--ncx-muted)}
        .ncx-sflow__happens p{margin:0;max-width:52ch;font-size:17px;line-height:1.6;color:var(--ncx-body)}

        /* Status pill, coloured from the status text. Each pair is 4.5:1 or better. */
        .ncx-sflow__pill{display:inline-block;font-size:13px;font-weight:600;line-height:1.4;
          border-radius:999px;padding:4px 12px;white-space:nowrap}
        .ncx-sflow__pill.is-done{background:#e8f5e9;color:#1b5e20}
        .ncx-sflow__pill.is-warn{background:#fff3e0;color:#8a4b00}
        .ncx-sflow__pill.is-stop{background:var(--ncx-crimson-tint);color:#a81f1f}
        .ncx-sflow__pill.is-neutral{background:var(--ncx-rule-soft);color:var(--ncx-navy)}

        /* Sticky panel */
        .ncx-sflow__panel{position:sticky;top:var(--sflow-top);background:var(--ncx-white);
          border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-panel);box-shadow:var(--ncx-shadow);
          padding:24px;display:flex;flex-direction:column;gap:24px}
        .ncx-sflow__bars{display:flex;gap:6px}
        .ncx-sflow__bar{flex:1;height:14px;padding:0;border:0;background:none;cursor:pointer;position:relative}
        .ncx-sflow__bar::before{content:"";position:absolute;left:0;right:0;top:5px;height:4px;
          border-radius:2px;background:var(--ncx-rule)}
        .ncx-sflow__bar.is-past::before{background:rgba(198,40,40,.3)}
        .ncx-sflow__bar.is-current::before{background:var(--ncx-crimson)}

        .ncx-sflow__link{display:flex;align-items:center;gap:0}
        .ncx-sflow__tile{flex:none;width:96px;display:flex;flex-direction:column;align-items:center;gap:8px}
        .ncx-sflow__mark{width:56px;height:56px;border-radius:14px;background:var(--ncx-cloud);
          border:1px solid var(--ncx-rule);display:flex;align-items:center;justify-content:center;overflow:hidden}
        .ncx-sflow__mark img{max-width:36px;max-height:36px;width:auto;height:auto;object-fit:contain}
        .ncx-sflow__letter{font-family:var(--font-display),Arial,sans-serif;font-size:22px;font-weight:600;color:var(--ncx-muted)}
        .ncx-sflow__tile b{font-size:13px;font-weight:600;color:var(--ncx-ink);text-align:center;line-height:1.3}
        .ncx-sflow__wire{flex:1;position:relative;height:2px;margin-bottom:28px;background:var(--ncx-rule-strong);border-radius:1px}
        .ncx-sflow__glow{position:absolute;inset:-1px 0;border-radius:2px;background:rgba(198,40,40,.55);
          box-shadow:0 0 10px 1px rgba(198,40,40,.45);opacity:.5}

        .ncx-sflow__cards{display:grid;gap:12px}
        .ncx-sflow__card{border:1px solid var(--ncx-rule-soft);background:var(--ncx-raised);border-radius:var(--ncx-r-card);
          padding:14px 16px;min-height:76px;perspective:400px}
        .ncx-sflow__card .ncx-sflow__label{margin-bottom:8px}
        .ncx-sflow__now{margin:0;font-size:15px;line-height:1.55;color:var(--ncx-body)}

        /* Motion, only when the visitor has not asked for less. */
        @media(prefers-reduced-motion:no-preference){
          .ncx-sflow__step{transition:opacity .35s ease}
          .ncx-sflow__bar::before{transition:background .25s ease}
          .ncx-sflow__glow{animation:ncxSflowGlow 2.4s ease-in-out infinite}
          .ncx-sflow__card .ncx-sflow__pill{animation:ncxSflowFlip .45s cubic-bezier(.2,.7,.2,1) both;transform-origin:50% 100%}
          .ncx-sflow__now{animation:ncxSflowFade .4s ease-out both}
        }
        /* The site or page motion level at reduced: the pill and line fade, no flip or rise. */
        [data-motion='reduced'] .ncx-sflow__card .ncx-sflow__pill,[data-motion='reduced'] .ncx-sflow__now{animation-name:ncxSflowShow}
        @keyframes ncxSflowShow{from{opacity:0}to{opacity:1}}
        @keyframes ncxSflowGlow{0%,100%{opacity:.2}50%{opacity:.85}}
        @keyframes ncxSflowFlip{from{opacity:0;transform:rotateX(-90deg)}to{opacity:1;transform:none}}
        @keyframes ncxSflowFade{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

        /* Below 900px: a plain stacked list, no panel. */
        @media(max-width:899.98px){
          .ncx-sflow__grid{display:block}
          .ncx-sflow__panel{display:none}
          .ncx-sflow__steps{border-top:1px solid var(--ncx-rule)}
          .ncx-sflow__step{min-height:0;flex-direction:row;flex-wrap:wrap;justify-content:flex-start;align-items:center;gap:8px 12px;
            padding:18px 0;border-bottom:1px solid var(--ncx-rule)}
          .ncx-sflow__count{display:none}
          .ncx-sflow__step h3{font-size:18px}
          .ncx-sflow__happens{flex-basis:100%}
          .ncx-sflow__happens p{font-size:16px;color:var(--ncx-muted)}
          .ncx-sflow__step .ncx-sflow__label{position:absolute;width:1px;height:1px;margin:-1px;padding:0;
            overflow:hidden;clip:rect(0 0 0 0);white-space:nowrap;border:0}
        }
      `}</style>

      <div className="ncx-sflow__grid">
        <ol className="ncx-sflow__steps">
          {rows.map((r, i) => (
            <li
              key={r.id}
              ref={(el) => {
                steps.current[i] = el
              }}
              data-index={i}
              className={`ncx-sflow__step${i === active ? ' is-active' : ''}`}
            >
              <p className="ncx-sflow__count" aria-hidden="true">
                {two(i + 1)} / {two(rows.length)}
              </p>
              <h3>{r.event}</h3>
              {r.inPartner ? (
                <div className="ncx-sflow__partner">
                  <span className="ncx-sflow__label">In {name}</span>
                  <span className={`ncx-sflow__pill is-${toneOf(r.inPartner)}`}>{r.inPartner}</span>
                </div>
              ) : null}
              <div className="ncx-sflow__happens">
                <span className="ncx-sflow__label">What happens in NeuronCx</span>
                <p>{r.whatHappens}</p>
              </div>
            </li>
          ))}
        </ol>

        <div className="ncx-sflow__panel" aria-hidden="true">
          <div className="ncx-sflow__bars">
            {rows.map((r, i) => (
              <button
                key={r.id}
                type="button"
                tabIndex={-1}
                className={`ncx-sflow__bar${i === active ? ' is-current' : i < active ? ' is-past' : ''}`}
                onClick={() => goTo(i)}
              />
            ))}
          </div>

          <div className="ncx-sflow__link">
            <div className="ncx-sflow__tile">
              <span className="ncx-sflow__mark">
                {logoSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={logoSrc} alt="" />
                ) : (
                  <span className="ncx-sflow__letter">{name.charAt(0)}</span>
                )}
              </span>
              <b>{name}</b>
            </div>
            <span className="ncx-sflow__wire">
              <span className="ncx-sflow__glow" data-loop />
            </span>
            <div className="ncx-sflow__tile">
              <span className="ncx-sflow__mark">
                {brandSrc ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={brandSrc} alt="" />
                ) : (
                  <span className="ncx-sflow__letter">N</span>
                )}
              </span>
              <b>NeuronCx</b>
            </div>
          </div>

          <div className="ncx-sflow__cards">
            <div className="ncx-sflow__card">
              <span className="ncx-sflow__label">In {name}</span>
              {current?.inPartner ? (
                // The key changes with the step, so the pill flips in again.
                <span key={active} className={`ncx-sflow__pill is-${toneOf(current.inPartner)}`}>
                  {current.inPartner}
                </span>
              ) : null}
            </div>
            <div className="ncx-sflow__card">
              <span className="ncx-sflow__label">In NeuronCx</span>
              <p key={active} className="ncx-sflow__now">
                {current?.whatHappens}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
