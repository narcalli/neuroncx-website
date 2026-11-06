'use client'

import React, { useEffect, useRef, useState } from 'react'

import { isStill } from '@/motion/still'
import { DURATION, EASE } from '@/motion/tokens'
import { isPastStart, useOnceInView } from '@/motion/useOnceInView'
import { useMotionLevel } from '@/motion/useMotionLevel'
import type { ExpandingCardCtaBlock as ExpandingCardCtaProps } from '@/payload-types'

type Shape = ExpandingCardCtaProps['startShape']

/**
 * The closed card for each start shape, from the panel's width w and height
 * h: side = min(w * byWidth, h * byHeight) is the card's height, and its
 * width is side * aspect. Below 700px wide every shape uses the phone sizes.
 */
const SHAPES: Record<Shape, { byWidth: number; byHeight: number; aspect: number }> = {
  square: { byWidth: 0.3, byHeight: 0.52, aspect: 1 },
  portrait: { byWidth: 0.24, byHeight: 0.62, aspect: 0.78 },
  wide: { byWidth: 0.46, byHeight: 0.42, aspect: 1.85 },
}
const PHONE = { below: 700, byWidth: 0.62, byHeight: 0.34 }
/** The closed card never covers more than this share of the panel. */
const MAX_SHARE = { width: 0.92, height: 0.86 }

/**
 * The inset that leaves the closed card in the middle of a w x h panel, in
 * pixels. Percentages would be measured against the panel's own box, so
 * equal percentages on a wide panel give a rectangle, not a square.
 */
export const closedInset = (w: number, h: number, shape: Shape): string => {
  const s = SHAPES[shape] ?? SHAPES.square
  const [byWidth, byHeight] = w < PHONE.below ? [PHONE.byWidth, PHONE.byHeight] : [s.byWidth, s.byHeight]
  const side = Math.min(w * byWidth, h * byHeight)
  const cardW = Math.min(side * s.aspect, w * MAX_SHARE.width)
  const cardH = Math.min(side, h * MAX_SHARE.height)
  const y = Math.max(0, (h - cardH) / 2)
  const x = Math.max(0, (w - cardW) / 2)
  return `inset(${y.toFixed(1)}px ${x.toFixed(1)}px ${y.toFixed(1)}px ${x.toFixed(1)}px round 18px)`
}

const OPEN_INSET = 'inset(0px 0px 0px 0px round 0px)'
const CLOSED_SHADOW = 'drop-shadow(0 26px 54px rgba(20,26,45,.34))'
const NO_SHADOW = 'drop-shadow(0 0 0 rgba(20,26,45,0))'

/**
 * This block's timings, in ms. The heading lines take the standard slow
 * duration; the rest are the opening's own. Every one uses the standard ease.
 */
const MS = {
  open: 980,
  line: DURATION.slow * 1000,
  lineStagger: 110,
  text: 760,
  descDelay: 300,
  buttonDelay: 560,
  scan: 1200,
  scanDelay: 60,
}

/** still: drawn open, nothing to play. armed: closed, waiting to come into view. open: playing or played. */
type Phase = 'still' | 'armed' | 'open'

/**
 * Expanding Card CTA: a closing call to action on a full-bleed navy panel,
 * with a centred heading (one or two lines), a description and one button.
 * The panel spans the viewport: blocks render straight into <main>, so a
 * plain 100% width is edge to edge with no 100vw overflow. Navy by design,
 * so it counts as the page's one Highlight (navy) block in the CMS.
 *
 * The opening: the panel keeps its final size in normal flow, so it sets the
 * section's height and nothing reflows. Only its clip-path moves, from a
 * small rounded card (the start shape, worked out in pixels from the
 * panel's measured size) to nothing, so the card's edge uncovers the
 * heading rather than the heading growing. It plays once, when the block
 * comes into view (useOnceInView, at the shared in-view line, watching the
 * panel's middle where the card sits); scroll position is never tracked.
 * Whether to close the card at all is still decided by the section: one
 * whose top is already past the line is left open, so nothing the visitor
 * can already see closes.
 *
 * Levels (useMotionLevel): on plays all of it; reduced keeps the panel open
 * and only lifts the text in; off draws it open and still.
 *
 * First paint: the server HTML, and the first client render, are the open
 * panel. The closed card is set only after the script runs, only for a
 * block not yet in view, and never when the page reads as still (isStill:
 * the visitor's system asks for less motion, or off/reduced is set). So a
 * reduced or off visitor never sees the closed card, even in the one render
 * after hydration where the level has not yet caught up with their system
 * setting.
 */
export const ExpandingCardCtaBlock: React.FC<ExpandingCardCtaProps> = ({
  headingLine1,
  headingLine2,
  description,
  ctaLabel,
  ctaUrl,
  startShape,
  motion,
}) => {
  const level = useMotionLevel(motion)
  const sectionRef = useRef<HTMLElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const middleRef = useRef<HTMLSpanElement>(null)
  const [phase, setPhase] = useState<Phase>('still')
  const [size, setSize] = useState<{ w: number; h: number } | null>(null)
  const shape: Shape = startShape === 'portrait' || startShape === 'wide' ? startShape : 'square'

  // Arm the opening for a block not yet in view; anything else stays open.
  useEffect(() => {
    const el = sectionRef.current
    const panel = panelRef.current
    if (!el || !panel || level === 'off' || isPastStart(el)) return
    // The level says on for one render after hydration, before the visitor's system setting is read.
    if (level === 'on' && isStill(el)) return
    const r = panel.getBoundingClientRect()
    setSize({ w: r.width, h: r.height })
    setPhase('armed')
    return () => setPhase('still')
  }, [level])

  // While closed, keep the card's pixel size in step with the panel.
  useEffect(() => {
    const panel = panelRef.current
    if (!panel || phase !== 'armed' || level !== 'on' || typeof ResizeObserver === 'undefined') return
    const watch = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      const box = entry.target.getBoundingClientRect()
      setSize({ w: box.width || width, h: box.height || height })
    })
    watch.observe(panel)
    return () => watch.disconnect()
  }, [phase, level])

  // At level on, what opens is the closed card in the middle of the panel, so the shared in-view line
  // watches the panel's middle (the marker) rather than its top edge. Reduced has no card: it keeps the section.
  useOnceInView(level === 'on' ? middleRef : sectionRef, () => setPhase('open'), phase === 'armed')

  if (!headingLine1) return null

  const clips = level === 'on' && phase !== 'still'
  const panelStyle: React.CSSProperties | undefined = clips
    ? phase === 'armed'
      ? size
        ? { clipPath: closedInset(size.w, size.h, shape) }
        : undefined
      : { clipPath: OPEN_INSET, transition: `clip-path ${MS.open}ms ${EASE.css}` }
    : undefined
  const shadowStyle: React.CSSProperties | undefined = clips
    ? phase === 'armed'
      ? { filter: CLOSED_SHADOW }
      : { filter: NO_SHADOW, transition: `filter ${MS.open}ms ${EASE.css}` }
    : undefined

  return (
    <section
      ref={sectionRef}
      className="ncx-expanding-cta"
      data-shape={shape}
      data-state={phase === 'still' ? undefined : phase}
      data-scan={level === 'on' ? '' : undefined}
    >
      <style>{css}</style>
      <div className="ecc-shadow" style={shadowStyle}>
        <div className="ecc-panel" ref={panelRef} style={panelStyle}>
          <span className="ecc-scan" aria-hidden="true" />
          <span className="ecc-middle" ref={middleRef} aria-hidden="true" />
          <div className="ecc-inner">
            <h2 className="ecc-heading">
              <span className="ecc-line">
                <span className="ecc-line-text">{headingLine1}</span>
              </span>
              {headingLine2 ? (
                <span className="ecc-line">
                  <span className="ecc-line-text">{headingLine2}</span>
                </span>
              ) : null}
            </h2>
            {description ? <p className="ecc-desc">{description}</p> : null}
            {ctaLabel && ctaUrl ? (
              <a className="ecc-btn" href={ctaUrl}>
                <span className="ecc-btn-label">{ctaLabel}</span>
                <svg className="ecc-btn-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" />
                </svg>
              </a>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  )
}

const hover = `${DURATION.base}s ${EASE.css}`
const rise = (ms: number, delay: number) => `opacity ${ms}ms ${EASE.css} ${delay}ms,transform ${ms}ms ${EASE.css} ${delay}ms`

const css = `
  .ncx-expanding-cta{position:relative;background:var(--ncx-paper);font-family:var(--font-body),Arial,sans-serif}
  .ncx-expanding-cta .ecc-panel{position:relative;width:100%;min-height:74vh;box-sizing:border-box;padding:96px 24px;
    display:flex;align-items:center;justify-content:center;background:var(--ncx-navy);color:var(--ncx-on-navy)}
  .ncx-expanding-cta .ecc-inner{position:relative;z-index:1;max-width:880px;margin:auto;display:flex;flex-direction:column;
    align-items:center;text-align:center}

  /* Each heading line sits in its own clipping wrapper, so the lines can be revealed one at a time. The small
     bottom padding keeps descenders inside the wrapper at this tight line height. */
  .ncx-expanding-cta .ecc-heading{margin:0 0 28px;font-family:var(--font-display),Arial,sans-serif;font-weight:600;
    font-size:clamp(34px,5vw,64px);line-height:1.05;letter-spacing:-.025em;color:var(--ncx-on-navy)}
  .ncx-expanding-cta .ecc-line{display:block;overflow:hidden;padding-bottom:.08em;margin-bottom:-.08em}
  .ncx-expanding-cta .ecc-line-text{display:block}

  .ncx-expanding-cta .ecc-desc{margin:0 0 42px;max-width:58ch;font-size:clamp(16px,1.4vw,18px);line-height:1.65;
    color:var(--ncx-on-navy-soft)}

  .ncx-expanding-cta .ecc-btn{position:relative;isolation:isolate;overflow:hidden;display:inline-flex;align-items:center;
    gap:12px;min-height:56px;padding:0 38px;border-radius:3px;background:var(--ncx-crimson);color:var(--ncx-on-navy);
    font-family:var(--font-display),Arial,sans-serif;font-size:16px;font-weight:600;text-decoration:none}
  .ncx-expanding-cta .ecc-btn::before{content:"";position:absolute;inset:0;z-index:-1;background:var(--ncx-crimson-hover);
    transform:scaleX(0);transform-origin:0 50%;transition:transform ${hover}}
  .ncx-expanding-cta .ecc-btn-arrow{flex:none;transition:transform ${hover}}
  .ncx-expanding-cta .ecc-btn:hover::before,.ncx-expanding-cta .ecc-btn:focus-visible::before{transform:scaleX(1)}
  .ncx-expanding-cta .ecc-btn:hover .ecc-btn-arrow,.ncx-expanding-cta .ecc-btn:focus-visible .ecc-btn-arrow{transform:translateX(5px)}
  .ncx-expanding-cta .ecc-btn:focus-visible{outline:2px solid var(--ncx-on-navy);outline-offset:3px}

  /* The scan line: white, brightest in the middle, with a soft glow. At rest it is not seen. */
  .ncx-expanding-cta .ecc-scan{position:absolute;left:0;right:0;top:0;height:1px;pointer-events:none;opacity:0;
    background:linear-gradient(90deg,transparent,rgba(255,255,255,.9) 30%,rgba(255,255,255,.9) 70%,transparent);
    box-shadow:0 0 12px 1px rgba(255,255,255,.35)}

  /* The panel's lower half, from its middle (where the closed card's centre sits) to its bottom edge: what the
     in-view line watches at level on. Its top meets the shared line when the card's centre does. It is not zero
     high: onceInView also fires when its element is wholly in view, and an element with no height counts as
     wholly in view the moment it enters the window. */
  .ncx-expanding-cta .ecc-middle{position:absolute;top:50%;bottom:0;left:0;width:100%;pointer-events:none}

  /* The opening (Component.tsx sets data-state). Armed: the text waits below its line, the copy and button
     lowered and clear. Open: each part rises into place in turn. The transitions live on the open state only,
     so arming is instant. */
  .ncx-expanding-cta[data-state="armed"] .ecc-line-text{transform:translateY(110%)}
  .ncx-expanding-cta[data-state="armed"] .ecc-desc,
  .ncx-expanding-cta[data-state="armed"] .ecc-btn{opacity:0;transform:translateY(14px)}
  .ncx-expanding-cta[data-state="open"] .ecc-line-text{transition:transform ${MS.line}ms ${EASE.css}}
  .ncx-expanding-cta[data-state="open"] .ecc-line + .ecc-line .ecc-line-text{transition-delay:${MS.lineStagger}ms}
  .ncx-expanding-cta[data-state="open"] .ecc-desc{transition:${rise(MS.text, MS.descDelay)}}
  .ncx-expanding-cta[data-state="open"] .ecc-btn{transition:${rise(MS.text, MS.buttonDelay)}}
  /* One pass of the scan line, at level on only. It runs once, so it is not a loop and carries no data-loop. */
  .ncx-expanding-cta[data-state="open"][data-scan] .ecc-scan{animation:ecc-scan ${MS.scan}ms ${EASE.css} ${MS.scanDelay}ms 1 both}
  @keyframes ecc-scan{0%{top:0%;opacity:0}12%{opacity:1}88%{opacity:1}100%{top:100%;opacity:0}}

  @media (max-width:879.98px){
    .ncx-expanding-cta .ecc-panel{padding:72px 22px;min-height:66vh}
    .ncx-expanding-cta .ecc-btn{width:100%;justify-content:center;box-sizing:border-box}
  }
`
