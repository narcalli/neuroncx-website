'use client'

import React, { useRef, useState } from 'react'

import { gsap, useGSAP } from '@/motion/gsap'
import { SplitText } from '@/motion/gsapSplitText'
import type { MotionSetting } from '@/motion/levels'
import { Magnetic } from '@/motion/Magnetic'
import { Reveal } from '@/motion/Reveal'
import { isPastStart, onceInView } from '@/motion/useOnceInView'
import { useLoopWhileVisible } from '@/motion/useLoopWhileVisible'
import { useMotionLevel } from '@/motion/useMotionLevel'

type Props = {
  heading?: string | null
  subhead?: string | null
  primaryLabel?: string | null
  primaryLink?: string | null
  secondaryLabel?: string | null
  secondaryLink?: string | null
  tagline?: string | null
  motion?: MotionSetting | null
}

/**
 * The page's last word: a navy card with a heading, buttons and an optional
 * tagline. At level on, the heading arrives character by character in a
 * wave (GSAP SplitText, masked by word, so a character never spills past
 * its own word while rising) and a faint grid drifts slowly behind the
 * card, pausing once the section is off screen. The server HTML (and
 * motion off) is the plain, settled card; reduced keeps a plain fade for
 * the heading and leaves the grid still.
 */
export const ClosingCtaBlock: React.FC<Props> = ({
  heading,
  subhead,
  primaryLabel,
  primaryLink,
  secondaryLabel,
  secondaryLink,
  tagline,
  motion,
}) => {
  const level = useMotionLevel(motion)
  const sectionRef = useRef<HTMLElement>(null)
  const headingRef = useRef<HTMLHeadingElement>(null)
  const gridRef = useRef<HTMLDivElement>(null)
  const [drift, setDrift] = useState<gsap.core.Tween | null>(null)

  useGSAP(
    () => {
      const el = headingRef.current
      if (!el || isPastStart(el)) return

      if (level === 'reduced') {
        gsap.set(el, { opacity: 0 })
        const stop = onceInView(el, () => gsap.to(el, { opacity: 1, duration: 0.5 }))
        return () => {
          stop()
          gsap.set(el, { clearProps: 'opacity' })
        }
      }
      if (level !== 'on') return

      let reverted = false
      const split = SplitText.create(el, {
        type: 'words,chars',
        mask: 'words',
        autoSplit: true,
        onSplit: (self) => {
          if (!reverted) gsap.set(self.chars, { yPercent: 120, rotation: 8, opacity: 0 })
        },
      })
      const stop = onceInView(el, () => {
        gsap.to(split.chars, {
          yPercent: 0,
          rotation: 0,
          opacity: 1,
          duration: 0.7,
          stagger: { each: 0.018 },
          ease: 'power4.out',
          onComplete: () => {
            reverted = true
            split.revert()
          },
        })
      })
      return () => {
        stop()
        split.revert()
      }
    },
    { dependencies: [level], scope: sectionRef },
  )

  useGSAP(
    () => {
      if (level !== 'on' || !gridRef.current) return
      const tween = gsap.to(gridRef.current, { x: 48, y: 48, duration: 40, ease: 'none', repeat: -1, paused: true })
      setDrift(tween)
      return () => {
        tween.kill()
        setDrift(null)
      }
    },
    { dependencies: [level] },
  )
  useLoopWhileVisible(sectionRef, drift, motion)

  if (!heading) return null

  return (
    <section className="ncx-closing" ref={sectionRef}>
      <style>{`
        .ncx-closing{
          /* No band: the navy card carries this section on its own, so the page
             shows through around it. */
          padding:64px 0;font-family:var(--font-body),Arial,sans-serif}
        .ncx-closing .card{position:relative;overflow:hidden;background:var(--ncx-navy);color:var(--ncx-on-navy);
          border-radius:24px;padding:72px 40px;text-align:center;
          box-shadow:0 40px 80px -40px rgba(15,18,32,.6)}
        .ncx-closing .grid-bg{position:absolute;inset:-60px;pointer-events:none;
          background-image:linear-gradient(rgba(255,255,255,.06) 1px,transparent 1px),
            linear-gradient(90deg,rgba(255,255,255,.06) 1px,transparent 1px);
          background-size:48px 48px}
        .ncx-closing .glow{position:absolute;width:520px;height:520px;border-radius:50%;
          filter:blur(120px);opacity:.26;top:-240px;left:50%;transform:translateX(-50%);
          background:radial-gradient(circle,rgba(198,40,40,.9),transparent 65%);pointer-events:none}
        .ncx-closing .body{position:relative;z-index:2}
        .ncx-closing h2{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
          font-size:clamp(1.9rem,3.6vw,2.7rem);line-height:1.1;letter-spacing:-.02em;
          margin:0 auto;max-width:var(--ncx-heading-max)}
        .ncx-closing .sub{margin:20px auto 0;color:var(--ncx-on-navy-soft);font-size:1.04rem;
          line-height:1.6;max-width:56ch}
        .ncx-closing .cta{margin-top:32px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
        .ncx-closing .btn{display:inline-flex;align-items:center;gap:9px;
          font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.98rem;
          padding:15px 28px;border-radius:10px;border:1px solid transparent;text-decoration:none;
          transition:transform .18s ease,box-shadow .18s ease,background .18s ease}
        .ncx-closing .primary{background:var(--ncx-crimson);color:var(--ncx-on-navy);
          box-shadow:0 10px 26px -10px rgba(198,40,40,.75)}
        .ncx-closing .primary:hover{transform:translateY(-2px)}
        .ncx-closing .ghost{background:transparent;color:var(--ncx-on-navy);border-color:var(--ncx-on-navy-rule-strong)}
        .ncx-closing .ghost:hover{background:rgba(255,255,255,.08)}
        .ncx-closing .btn:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
        .ncx-closing .tagline{margin:26px 0 0;font-style:italic;color:var(--ncx-on-navy-soft);
          font-size:.98rem}
        @media(max-width:900px){
          .ncx-closing{padding:44px 0}
          .ncx-closing .card{padding:48px 24px;border-radius:20px}
          .ncx-closing .glow{filter:blur(70px)}
        }
        @media(prefers-reduced-motion:reduce){.ncx-closing .btn{transition:none}}
      `}</style>

      <div className="inner ncx-container">
        <div className="card">
          <div className="grid-bg" ref={gridRef} aria-hidden="true" />
          <div className="glow" />
          <div className="body">
            <h2 ref={headingRef}>{heading}</h2>
            {subhead ? (
              <Reveal as="p" className="sub" motion={motion}>
                {subhead}
              </Reveal>
            ) : null}

            {primaryLabel || secondaryLabel ? (
              <div className="cta">
                {primaryLabel ? (
                  <Magnetic motion={motion}>
                    <a className="btn primary" href={primaryLink || '/contact'}>
                      {primaryLabel}
                      <svg className="ncx-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                        <path d="M5 12h14M13 6l6 6-6 6" />
                      </svg>
                    </a>
                  </Magnetic>
                ) : null}
                {secondaryLabel ? (
                  <Magnetic motion={motion}>
                    <a className="btn ghost" href={secondaryLink || '#'}>
                      {secondaryLabel}
                    </a>
                  </Magnetic>
                ) : null}
              </div>
            ) : null}

            {tagline ? <p className="tagline">{tagline}</p> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
