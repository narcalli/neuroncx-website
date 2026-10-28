'use client'

import React, { useEffect, useRef, useState } from 'react'

import { gsap, useGSAP } from '@/motion/gsap'
import type { MotionLevel, MotionSetting } from '@/motion/levels'
import { Magnetic } from '@/motion/Magnetic'
import { MotionProvider } from '@/motion/MotionProvider'
import { Reveal } from '@/motion/Reveal'
import { SplitHeading } from '@/motion/SplitHeading'
import { TiltCard } from '@/motion/TiltCard'
import { useLoopWhileVisible } from '@/motion/useLoopWhileVisible'
import { useMotionLevel } from '@/motion/useMotionLevel'
import { useOnceInView } from '@/motion/useOnceInView'

/** The lab: switches for the three levels, then every kit component with sample content. */

const LEVELS: MotionLevel[] = ['on', 'reduced', 'off']
const SETTINGS: MotionSetting[] = ['follow', 'on', 'reduced', 'off']

const Choice = <T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: T[]
  onChange: (v: T) => void
}) => (
  <label className="lab-choice">
    <span>{label}</span>
    <select value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  </label>
)

export const MotionLab = () => {
  const [site, setSite] = useState<MotionLevel>('on')
  const [page, setPage] = useState<MotionSetting>('follow')
  const [block, setBlock] = useState<MotionSetting>('follow')
  // A new key remounts the samples, so their entrances play again.
  const [run, setRun] = useState(0)

  return (
    <MotionProvider site={site} page={page}>
      <style>{labCss}</style>
      <div className="ncx-lab">
        <div className="lab-bar">
          <div className="ncx-container lab-bar-row">
            <b>Motion lab</b>
            <Choice label="Site" value={site} options={LEVELS} onChange={setSite} />
            <Choice label="Page" value={page} options={SETTINGS} onChange={setPage} />
            <Choice label="Block" value={block} options={SETTINGS} onChange={setBlock} />
            <Levels block={block} />
            <button
              type="button"
              className="lab-replay"
              onClick={() => {
                window.scrollTo({ top: 0 })
                setRun((n) => n + 1)
              }}
            >
              Replay from the top
            </button>
          </div>
        </div>
        <Samples key={run} block={block} />
      </div>
    </MotionProvider>
  )
}

/** The level the samples draw at, and what <html> carries. */
const Levels = ({ block }: { block: MotionSetting }) => {
  const level = useMotionLevel(block)
  const [html, setHtml] = useState('')
  useEffect(() => {
    setHtml(document.documentElement.dataset.motion || '')
  })
  return (
    <span className="lab-levels" data-testid="levels">
      Samples draw at <b data-testid="level">{level}</b>. html data-motion:{' '}
      <b data-testid="html-level">{html}</b>
    </span>
  )
}

const Samples = ({ block }: { block: MotionSetting }) => (
  <>
    <section className="lab-sec ncx-container">
      <p className="lab-label">Reveal</p>
      <Reveal motion={block}>
        <p className="lab-lede">
          This paragraph is in view when the page loads, so it stays as it is: content a visitor has
          already seen never disappears to animate in. Scroll down for the ones that rise.
        </p>
      </Reveal>
    </section>

    <div className="lab-gap" aria-hidden="true">
      Scroll
    </div>

    <section className="lab-sec ncx-container">
      <p className="lab-label">Reveal, once in view</p>
      <Reveal motion={block}>
        <p className="lab-lede" data-testid="reveal-one">
          One record per student, across every enquiry source. This paragraph fades in and rises
          16px when its top reaches 80% of the window height.
        </p>
      </Reveal>
      <p className="lab-label">Reveal with stagger</p>
      <Reveal
        motion={block}
        stagger
        as="ul"
        className="lab-cards"
        style={{ listStyle: 'none', padding: 0 }}
      >
        {['Books appointments', 'Takes payments', 'Reads documents', 'Checks calls'].map((t) => (
          <li key={t} className="lab-card">
            <b>{t}</b>
            <span>Arrives 60ms after the one before.</span>
          </li>
        ))}
      </Reveal>
    </section>

    <div className="lab-gap" aria-hidden="true">
      Scroll
    </div>

    <section className="lab-sec ncx-container">
      <p className="lab-label">SplitHeading</p>
      <SplitHeading motion={block} className="lab-h2">
        What each agent in the bot swarm does, from the first message to the record it saves
      </SplitHeading>
    </section>

    <section className="lab-sec ncx-container">
      <p className="lab-label">Magnetic (mouse only)</p>
      <Magnetic motion={block}>
        <a className="lab-btn" href="#magnetic" data-testid="magnetic">
          Book a 20-minute demo <span aria-hidden="true">→</span>
        </a>
      </Magnetic>
    </section>

    <section className="lab-sec ncx-container">
      <p className="lab-label">TiltCard (mouse only)</p>
      <div className="lab-cards">
        {['Appointment assistance', 'Payment services', 'Call quality assessment'].map((t) => (
          <TiltCard key={t} motion={block}>
            <article className="lab-card lab-card--tall" data-testid="tilt">
              <b>{t}</b>
              <span>
                Tilts toward the cursor, up to 10 degrees, with a faint crimson light under it.
              </span>
            </article>
          </TiltCard>
        ))}
      </div>
    </section>

    <div className="lab-gap" aria-hidden="true">
      Scroll
    </div>

    <OnceInViewSample />
    <LoopSample block={block} />
    <div className="lab-gap" aria-hidden="true">
      End
    </div>
  </>
)

const OnceInViewSample = () => {
  const ref = useRef<HTMLDivElement>(null)
  const [seen, setSeen] = useState<string | null>(null)
  useOnceInView(ref, () => setSeen(new Date().toLocaleTimeString()))
  return (
    <section className="lab-sec ncx-container">
      <p className="lab-label">useOnceInView</p>
      <div ref={ref} className="lab-card" data-testid="once">
        <b>{seen ? `Seen once, at ${seen}` : 'Not seen yet'}</b>
        <span>The callback runs the first time this reaches the start point, and never again.</span>
      </div>
    </section>
  )
}

const LoopSample = ({ block }: { block: MotionSetting }) => {
  const ref = useRef<HTMLDivElement>(null)
  const dot = useRef<HTMLSpanElement>(null)
  const [timeline, setTimeline] = useState<gsap.core.Timeline | null>(null)
  const [state, setState] = useState('paused')
  useGSAP(() => {
    const tl = gsap.timeline({ paused: true, repeat: -1, yoyo: true })
    // Transform only: across the track, its width less the dot's.
    tl.to(dot.current, {
      x: () => (dot.current?.parentElement?.clientWidth ?? 16) - 16,
      duration: 1.6,
      ease: 'sine.inOut',
    })
    setTimeline(tl)
  })
  useLoopWhileVisible(ref, timeline, block)
  useEffect(() => {
    if (!timeline) return
    const t = window.setInterval(() => setState(timeline.paused() ? 'paused' : 'playing'), 250)
    return () => window.clearInterval(t)
  }, [timeline])
  return (
    <section className="lab-sec ncx-container">
      <p className="lab-label">useLoopWhileVisible</p>
      <div ref={ref} className="lab-card">
        <b data-testid="loop-state">Loop {state}</b>
        <span>Plays only while on screen, and only at level on.</span>
        <div className="lab-track">
          <span ref={dot} className="lab-dot" />
        </div>
      </div>
    </section>
  )
}

const labCss = `
  .ncx-lab{background:var(--ncx-cloud);color:var(--ncx-body);font-family:var(--font-body),Arial,sans-serif;padding-bottom:64px}
  .ncx-lab .lab-bar{position:sticky;top:64px;z-index:5;background:var(--ncx-white);border-bottom:1px solid var(--ncx-rule)}
  .ncx-lab .lab-bar-row{display:flex;flex-wrap:wrap;align-items:center;gap:10px 18px;padding-block:12px;font-size:14px}
  .ncx-lab .lab-choice{display:inline-flex;align-items:center;gap:6px}
  .ncx-lab .lab-choice select{font:inherit;border:1px solid var(--ncx-rule);border-radius:8px;padding:4px 8px;background:var(--ncx-white);color:var(--ncx-ink)}
  .ncx-lab .lab-levels{color:var(--ncx-muted)}
  .ncx-lab .lab-levels b{color:var(--ncx-ink)}
  .ncx-lab .lab-replay{font:inherit;border:1px solid var(--ncx-rule);border-radius:8px;padding:5px 12px;background:var(--ncx-white);color:var(--ncx-ink);cursor:pointer}
  .ncx-lab .lab-sec{padding-block:56px}
  .ncx-lab .lab-label{font-family:var(--font-display),Arial,sans-serif;font-size:13px;letter-spacing:.06em;text-transform:uppercase;color:var(--ncx-crimson-ink);margin:0 0 14px}
  .ncx-lab .lab-lede{font-size:18px;line-height:1.6;max-width:62ch;margin:0 0 28px;color:var(--ncx-ink)}
  .ncx-lab .lab-h2{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:clamp(28px,3.4vw,42px);line-height:1.15;letter-spacing:-.015em;color:var(--ncx-ink);margin:0;max-width:22ch}
  .ncx-lab .lab-cards{display:grid;gap:16px;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));margin:0}
  .ncx-lab .lab-card{display:grid;gap:8px;background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);padding:20px}
  .ncx-lab .lab-card--tall{min-height:160px}
  .ncx-lab .lab-card b{font-family:var(--font-display),Arial,sans-serif;font-weight:600;color:var(--ncx-ink)}
  .ncx-lab .lab-card span{color:var(--ncx-muted);font-size:15px}
  .ncx-lab .lab-btn{display:inline-flex;align-items:center;gap:10px;padding:14px 22px;border-radius:10px;background:var(--ncx-crimson);color:var(--ncx-on-navy);font-family:var(--font-display),Arial,sans-serif;font-weight:600;text-decoration:none}
  .ncx-lab .lab-gap{min-height:70vh;display:grid;place-items:center;color:var(--ncx-muted);font-size:13px;letter-spacing:.06em;text-transform:uppercase}
  .ncx-lab .lab-track{position:relative;height:16px;border-radius:999px;background:var(--ncx-rule);margin-top:8px}
  .ncx-lab .lab-dot{position:absolute;left:0;top:0;width:16px;height:16px;border-radius:50%;background:var(--ncx-crimson)}
`
