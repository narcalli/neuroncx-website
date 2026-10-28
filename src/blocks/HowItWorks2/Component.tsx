'use client'

import React, { useRef } from 'react'

import { Reveal } from '@/motion/Reveal'
import { SplitHeading } from '@/motion/SplitHeading'
import { gsap, useGSAP } from '@/motion/gsap'
import type { MotionSetting } from '@/motion/levels'
import { useMotionLevel } from '@/motion/useMotionLevel'
import { isPastStart, onceInView } from '@/motion/useOnceInView'

type Step = { title?: string | null; description?: string | null; id?: string | null }

type Props = {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
  steps?: Step[] | null
  /** The block's Appearance background, applied by the page wrapper. The circles' ring matches it. */
  background?: 'default' | 'white' | 'cloud' | 'navy' | null
  motion?: MotionSetting | null
  autoplay?: boolean | null
  speed?: string | null
}

const SPEED_SCALE: Record<string, number> = { slower: 1.3, normal: 1, faster: 0.7 }
/** About 2 seconds, before the block's own Speed setting scales it. */
const DRAW_DURATION = 2

/**
 * How it works 2: numbered circles on a line, one column per step (2 to 5),
 * the number from the order. Once in view, the line draws from the first
 * circle to the last with a small crimson head on its leading edge; each
 * circle turns navy as the line reaches it, then its title and line rise.
 * Below 900px the steps stack and the line runs down the left instead.
 *
 * The server HTML, and autoplay off or motion off, show the finished state:
 * the line drawn, every circle navy. Reduced motion is a plain fade in,
 * with no draw and no pop. No button, ever.
 */
export const HowItWorks2Block: React.FC<Props> = ({ eyebrow, heading, intro, steps, background, motion, autoplay, speed }) => {
  const level = useMotionLevel(motion)
  const doLoad = level === 'on' && autoplay !== false
  const doFade = level === 'reduced' && autoplay !== false
  const sp = (SPEED_SCALE[speed || 'normal'] ?? 1) * DRAW_DURATION

  const items = (steps || []).filter((s) => s && s.title)
  const sectionRef = useRef<HTMLElement>(null)
  const fillRefs = useRef<(HTMLSpanElement | null)[]>([])
  const headRefs = useRef<(HTMLSpanElement | null)[]>([])
  const numRefs = useRef<(HTMLSpanElement | null)[]>([])
  const titleRefs = useRef<(HTMLHeadingElement | null)[]>([])
  const descRefs = useRef<(HTMLParagraphElement | null)[]>([])

  useGSAP(
    () => {
      const el = sectionRef.current
      if (!el) return

      if (doFade) {
        if (isPastStart(el)) return
        gsap.set(el, { opacity: 0 })
        const stop = onceInView(el, () => gsap.to(el, { opacity: 1, duration: 0.5 }))
        return () => {
          stop()
          gsap.set(el, { clearProps: 'opacity' })
        }
      }
      if (!doLoad || items.length < 2 || isPastStart(el)) return

      const fills = fillRefs.current.filter(Boolean)
      const heads = headRefs.current.filter(Boolean)
      const nums = numRefs.current.filter(Boolean)
      const vertical = window.innerWidth < 900
      gsap.set(fills, vertical ? { scaleY: 0 } : { scaleX: 0 })
      gsap.set(heads, { opacity: 0 })
      nums.forEach((n) => n?.classList.remove('is-lit'))

      const stop = onceInView(el, () => {
        const segDuration = sp / (items.length - 1)
        const timeline = gsap.timeline()
        // The first circle lights at once: the line starts there.
        timeline.call(() => numRefs.current[0]?.classList.add('is-lit'), undefined, 0)
        fills.forEach((fill, i) => {
          const at = i * segDuration
          const head = heads[i]
          timeline
            .to(head, { opacity: 1, duration: 0 }, at)
            .to(fill, vertical ? { scaleY: 1, ease: 'none', duration: segDuration } : { scaleX: 1, ease: 'none', duration: segDuration }, at)
          if (i === fills.length - 1) {
            timeline.to(head, { opacity: 0, duration: 0.2 }, at + segDuration)
          } else {
            timeline.set(head, { opacity: 0 }, at + segDuration)
          }
          timeline
            .call(() => numRefs.current[i + 1]?.classList.add('is-lit'), undefined, at + segDuration)
            .fromTo(
              nums[i + 1],
              { scale: 0.5, opacity: 0.35 },
              { scale: 1, opacity: 1, duration: 0.35, ease: 'back.out(3)' },
              at + segDuration,
            )
            .from(
              [titleRefs.current[i + 1], descRefs.current[i + 1]].filter(Boolean),
              { opacity: 0, y: 22, duration: 0.4, stagger: 0.08, ease: 'power3.out' },
              at + segDuration + 0.05,
            )
        })
      })
      return () => {
        stop()
        gsap.set([...fills, ...heads], { clearProps: 'all' })
        nums.forEach((n) => n?.classList.add('is-lit'))
      }
    },
    { dependencies: [doLoad, doFade, sp, items.length] },
  )

  if (!items.length) return null
  const bg = background && background !== 'default' ? background : 'default'

  return (
    <section className="ncx-how2 ncx-container" data-bg={bg} ref={sectionRef} style={{ '--n': items.length } as React.CSSProperties}>
      <style>{howTwoCss}</style>

      {eyebrow ? (
        <Reveal as="p" from="left" className="eyebrow" motion={motion}>
          {eyebrow}
        </Reveal>
      ) : null}
      {heading ? (
        <SplitHeading as="h2" motion={motion}>
          {heading}
        </SplitHeading>
      ) : null}
      {intro ? (
        <Reveal as="p" className="intro" motion={motion}>
          {intro}
        </Reveal>
      ) : null}

      <ol>
        {items.map((step, i) => (
          <li key={step.id || i}>
            {i < items.length - 1 ? (
              <span className="seg" aria-hidden="true">
                <span
                  className="fill"
                  ref={(el) => {
                    fillRefs.current[i] = el
                  }}
                >
                  <span
                    className="head"
                    ref={(el) => {
                      headRefs.current[i] = el
                    }}
                  />
                </span>
              </span>
            ) : null}
            <span
              className="num is-lit"
              aria-hidden="true"
              ref={(el) => {
                numRefs.current[i] = el
              }}
            >
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3
              ref={(el) => {
                titleRefs.current[i] = el
              }}
            >
              {step.title}
            </h3>
            {step.description ? (
              <p
                className="desc"
                ref={(el) => {
                  descRefs.current[i] = el
                }}
              >
                {step.description}
              </p>
            ) : null}
          </li>
        ))}
      </ol>
    </section>
  )
}

const howTwoCss = `
        .ncx-how2{--how2-ring:var(--background);--how2-line:#F2C4C4;--how2-title:#1A2035;--how2-text:#4B5563;
          padding-block:64px;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-how2[data-bg="white"]{--how2-ring:#ffffff}
        .ncx-how2[data-bg="cloud"]{--how2-ring:var(--ncx-cloud)}
        /* Highlight (navy): the wrapper remaps --ncx-navy inside the block, so the ring names the band's own colour. */
        .ncx-how2[data-bg="navy"]{--how2-ring:#1a2035;--how2-line:rgba(242,196,196,.35);
          --how2-title:var(--ncx-on-navy);--how2-text:var(--ncx-on-navy-soft)}

        /* The section head, as on the How it works block. */
        .ncx-how2 .eyebrow{font-family:var(--font-display),Arial,sans-serif;font-size:14px;
          color:var(--ncx-crimson-ink);margin:0 0 12px}
        .ncx-how2 h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;color:var(--ncx-ink);
          font-size:clamp(28px,3.4vw,36px);letter-spacing:-.025em;margin:0;max-width:var(--ncx-heading-max)}
        .ncx-how2 .intro{color:var(--ncx-muted);margin:14px 0 0;max-width:62ch;font-size:17px;line-height:1.6}

        .ncx-how2 ol{list-style:none;margin:48px 0 0;padding:0;display:grid;
          grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:24px}
        .ncx-how2 li{position:relative;min-width:0}
        /* The segment between this circle and the next: a fill that draws
           left to right once in view, a small crimson head on its leading
           edge, and the hairline it sits on. */
        .ncx-how2 .seg{position:absolute;z-index:0;top:25px;left:26px;width:calc(100% + 24px);height:2px;
          background:var(--how2-line);display:block}
        .ncx-how2 .fill{position:absolute;inset:0;background:var(--ncx-navy);transform-origin:left;
          border-radius:2px;transform:scaleX(1)}
        .ncx-how2 .head{position:absolute;right:0;top:50%;width:11px;height:11px;margin:-5.5px -5.5px 0 0;
          border-radius:50%;background:var(--ncx-crimson);box-shadow:0 0 0 5px var(--ncx-crimson-tint);opacity:0}
        .ncx-how2 .num{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;
          width:52px;height:52px;border-radius:50%;background:var(--ncx-white);border:2px solid var(--ncx-rule-strong);
          color:var(--ncx-muted);font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:16px;line-height:1;
          box-shadow:0 0 0 8px var(--how2-ring);transition:background .3s,border-color .3s,color .3s}
        .ncx-how2 .num.is-lit{background:var(--ncx-navy);border-color:var(--ncx-navy);color:var(--ncx-on-navy)}
        .ncx-how2 h3{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:20px;
          line-height:1.3;color:var(--how2-title);margin:22px 0 0}
        .ncx-how2 .desc{font-family:var(--font-body),Arial,sans-serif;font-size:15.5px;line-height:1.6;
          color:var(--how2-text);max-width:240px;margin:8px 0 0}

        @media(max-width:899.98px){
          .ncx-how2{padding-block:44px}
          .ncx-how2 ol{grid-template-columns:minmax(0,1fr);margin-top:34px;gap:24px}
          .ncx-how2 li{display:grid;grid-template-columns:52px minmax(0,1fr);column-gap:20px;align-items:start}
          .ncx-how2 .num{grid-row:1 / span 2}
          /* Down from this circle's centre to the next one's, across the gap. */
          .ncx-how2 .seg{top:26px;left:25px;width:2px;height:calc(100% + 24px)}
          .ncx-how2 .fill{transform-origin:top}
          .ncx-how2 .head{right:auto;top:auto;bottom:0;left:50%;margin:0 0 -5.5px -5.5px}
          .ncx-how2 h3{margin:12px 0 0}
          .ncx-how2 .desc{max-width:none}
        }
        @media(prefers-reduced-motion:reduce){
          .ncx-how2 .num{transition:none}
        }
      `
