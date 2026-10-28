'use client'

import Link from 'next/link'
import React, { useRef } from 'react'
import { animate } from 'motion/react'

import { gsap, useGSAP } from '@/motion/gsap'
import type { MotionSetting } from '@/motion/levels'
import { useMotionLevel } from '@/motion/useMotionLevel'
import { isPastStart, onceInView } from '@/motion/useOnceInView'

type Layer = { id?: string | null; title: string; line?: string | null; href?: string | null }

const SPEED_SCALE: Record<string, number> = { slower: 1.3, normal: 1, faster: 0.7 }

/** The slab's face colour, by its place in the stack: navy, navy tint, slate, then it repeats. */
const FACE_COLORS = ['var(--ncx-navy)', 'var(--ncx-navy-tint)', 'var(--ncx-muted)']
const faceColor = (i: number): string => FACE_COLORS[i % FACE_COLORS.length]

/**
 * The layers section's "3D stack" display (prompt 10 of the motion plan,
 * "Under the hood" in the demo): beside the row cards, an isometric stack of
 * slabs, first row at the bottom. Once in view, the slabs start pulled apart
 * and settle into the stack, bottom first, while the whole stack turns into
 * place; each row card gets a crimson edge as its slab lands. Hovering or
 * focusing a row card lifts its slab on a spring.
 *
 * The server HTML (and motion off) is the settled stack: assembled, every
 * card already carrying its crimson edge. Only the GSAP entrance pulls it
 * apart first, and only when it has not already scrolled into view.
 */
export const HubLayersStack: React.FC<{
  layers: Layer[]
  motion?: MotionSetting | null
  autoplay?: boolean | null
  speed?: string | null
}> = ({ layers, motion, autoplay, speed }) => {
  const level = useMotionLevel(motion)
  const doLoad = level === 'on' && autoplay !== false
  const doFade = level === 'reduced' && autoplay !== false
  const sp = SPEED_SCALE[speed || 'normal'] ?? 1

  const stageRef = useRef<HTMLDivElement>(null)
  const isoTiltRef = useRef<HTMLDivElement>(null)
  const isoRef = useRef<HTMLDivElement>(null)
  const slabRefs = useRef<(HTMLDivElement | null)[]>([])
  const slabInRefs = useRef<(HTMLDivElement | null)[]>([])
  const cardRefs = useRef<(HTMLLIElement | null)[]>([])

  useGSAP(
    () => {
      const stage = stageRef.current
      if (!stage) return

      if (doFade) {
        if (isPastStart(stage)) return
        gsap.set(stage, { opacity: 0 })
        const stop = onceInView(stage, () => gsap.to(stage, { opacity: 1, duration: 0.5 }))
        return () => {
          stop()
          gsap.set(stage, { clearProps: 'opacity' })
        }
      }
      if (!doLoad || isPastStart(stage)) return

      const isoTilt = isoTiltRef.current
      const isoEl = isoRef.current
      const slabs = slabRefs.current.filter((s): s is HTMLDivElement => Boolean(s))
      // Held here, not read from the refs again in the cleanup: a re-render can
      // detach and reattach them in the same commit the cleanup runs in.
      const cards = cardRefs.current.slice()
      if (!isoTilt || !isoEl || !slabs.length) return

      gsap.set(isoTilt, { rotationX: 68 })
      gsap.set(isoEl, { rotationZ: -80 })
      slabs.forEach((slab, i) => gsap.set(slab, { z: i * 56 + 120 + i * 110, opacity: 0 }))
      cards.forEach((c) => c?.classList.remove('is-landed'))

      const stop = onceInView(stage, () => {
        const timeline = gsap.timeline()
        timeline
          .to(isoEl, { rotationZ: -45, duration: 1.6 * sp, ease: 'power2.out' }, 0)
          .to(isoTilt, { rotationX: 58, duration: 1.6 * sp, ease: 'power2.out' }, 0)
        slabs.forEach((slab, i) => {
          const at = (0.15 + i * 0.35) * sp
          timeline
            .to(slab, { z: i * 56, opacity: 1, duration: 0.9 * sp, ease: 'power3.out' }, at)
            .call(() => cards[i]?.classList.add('is-landed'), undefined, at + 0.75 * sp)
        })
      })
      return () => {
        stop()
        gsap.set([isoTilt, isoEl], { clearProps: 'all' })
        // Back to the settled stack. Not clearProps: each slab's resting
        // translateZ is its own inline style, which that would wipe.
        slabs.forEach((slab, i) => gsap.set(slab, { z: i * 56, opacity: 1 }))
        cards.forEach((c) => c?.classList.add('is-landed'))
      }
    },
    { dependencies: [doLoad, doFade, sp, layers.length] },
  )

  useGSAP(
    () => {
      if (level !== 'on') return
      const stops = cardRefs.current.map((card, i) => {
        if (!card) return undefined
        const inner = slabInRefs.current[i]
        if (!inner) return undefined
        let controls: ReturnType<typeof animate> | null = null
        const up = () => {
          controls?.stop()
          controls = animate(inner, { z: 28 }, { type: 'spring', stiffness: 400, damping: 12 })
        }
        const down = () => {
          controls?.stop()
          controls = animate(inner, { z: 0 }, { type: 'spring', stiffness: 400, damping: 14 })
        }
        card.addEventListener('mouseenter', up)
        card.addEventListener('mouseleave', down)
        card.addEventListener('focusin', up)
        card.addEventListener('focusout', down)
        return () => {
          card.removeEventListener('mouseenter', up)
          card.removeEventListener('mouseleave', down)
          card.removeEventListener('focusin', up)
          card.removeEventListener('focusout', down)
          controls?.stop()
        }
      })
      return () => stops.forEach((stop) => stop?.())
    },
    { dependencies: [level, layers.length] },
  )

  return (
    <div className="ncx-layers-stack" ref={stageRef}>
      <style>{layersStackCss}</style>
      <div className="iso-stage" aria-hidden="true">
        <div className="iso-tilt" ref={isoTiltRef}>
          <div className="iso" ref={isoRef}>
            {layers.map((l, i) => (
              <div
                className="slab"
                key={l.id || i}
                style={{ transform: `translateZ(${i * 56}px)`, opacity: 1 }}
                ref={(el) => {
                  slabRefs.current[i] = el
                }}
              >
                <div
                  className="slab-in"
                  ref={(el) => {
                    slabInRefs.current[i] = el
                  }}
                >
                  <div className="slab-edge" style={{ background: `color-mix(in srgb, ${faceColor(i)} 100%, black 35%)` }} />
                  <div className="slab-face" style={{ background: faceColor(i) }}>
                    <span>
                      <small>{`Layer ${i + 1}`}</small>
                      {l.title}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ol className="ncx-sec__grid layer-list">
        {layers.map((l, i) => (
          <li
            className="ncx-sec__card layer is-landed"
            key={l.id || i}
            tabIndex={l.href ? undefined : 0}
            ref={(el) => {
              cardRefs.current[i] = el
            }}
          >
            <h3>{l.title}</h3>
            {l.line ? <p>{l.line}</p> : null}
            {l.href ? (
              <Link className="more" href={l.href}>
                Read more
              </Link>
            ) : null}
          </li>
        ))}
      </ol>
    </div>
  )
}

const layersStackCss = `
.ncx-layers-stack{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:56px;align-items:center}
.ncx-layers-stack .iso-stage{height:440px;perspective:1600px;display:grid;place-items:center}
.ncx-layers-stack .iso-tilt{transform-style:preserve-3d;transform:rotateX(58deg)}
.ncx-layers-stack .iso{position:relative;width:240px;height:240px;transform-style:preserve-3d;transform:rotateZ(-45deg)}
.ncx-layers-stack .slab{position:absolute;inset:0;transform-style:preserve-3d}
.ncx-layers-stack .slab-in{position:absolute;inset:0;transform-style:preserve-3d}
.ncx-layers-stack .slab-face{position:absolute;inset:0;border-radius:20px;color:var(--ncx-on-navy);display:grid;
  place-items:center;text-align:center;padding:20px;font-family:var(--font-display),Arial,sans-serif;font-weight:600;
  font-size:15px;line-height:1.3;border:1px solid rgba(255,255,255,.12)}
.ncx-layers-stack .slab-face small{display:block;font-family:var(--font-body),Arial,sans-serif;font-weight:500;
  font-size:11px;line-height:1;letter-spacing:.12em;text-transform:uppercase;opacity:.75;margin-bottom:6px}
.ncx-layers-stack .slab-edge{position:absolute;inset:0;border-radius:20px;transform:translateZ(-14px)}
.ncx-layers-stack .layer-list{gap:12px}
.ncx-layers-stack .layer{position:relative;display:grid;gap:8px;padding-left:26px;cursor:default;overflow:hidden;
  transition:border-color .3s}
.ncx-layers-stack .layer::before{content:"";position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--ncx-crimson);
  transform:scaleY(0);transform-origin:top;transition:transform .4s cubic-bezier(.22,1,.36,1)}
.ncx-layers-stack .layer.is-landed::before{transform:scaleY(1)}
.ncx-layers-stack .layer:hover,.ncx-layers-stack .layer:focus-within,.ncx-layers-stack .layer.is-landed{border-color:var(--ncx-navy)}
@media(max-width:900px){
  .ncx-layers-stack{grid-template-columns:minmax(0,1fr)}
  .ncx-layers-stack .iso-stage{height:380px}
  .ncx-layers-stack .iso{width:200px;height:200px}
}
@media(prefers-reduced-motion:reduce){.ncx-layers-stack .layer{transition:none}.ncx-layers-stack .layer::before{transition:none}}
`
