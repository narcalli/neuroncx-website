'use client'

import React, { useRef } from 'react'
import { animate } from 'motion/react'

import { gsap, useGSAP } from '@/motion/gsap'
import type { MotionSetting } from '@/motion/levels'
import { TiltCard } from '@/motion/TiltCard'
import { useMotionLevel } from '@/motion/useMotionLevel'
import { isPastStart, onceInView } from '@/motion/useOnceInView'

/**
 * The one wrapper every card design in src/components/cards/ (and the
 * shared card renderers they delegate to: CaseCard, DirectoryList,
 * RelatedCards) puts around a single card, so none of them writes its own
 * motion (docs/motion/bot-swarm-motion-demo.html, the family section):
 *
 *  - entrance: once a row comes into view, each card tips up from 16deg and
 *    rises into place, `index` apart by 90ms;
 *  - hover: TiltCard, plus the first icon or logo inside turning and
 *    growing on a spring, and the card's own ring turning navy. Mouse only:
 *    touch gets the entrance alone.
 *
 * The server HTML is the settled card; nothing here hides it before the
 * entrance plays, and a card already in view when the script loads is left
 * as it is.
 */
export const CardMotion: React.FC<{
  children: React.ReactNode
  /** Its place in the row, for the 90ms stagger. */
  index?: number
  /** The block's own Motion panel, where it has one. */
  motion?: MotionSetting | null
  /** Off for a design or a card style that asks for no pointer tilt. The entrance still plays. */
  tilt?: boolean
  className?: string
  style?: React.CSSProperties
}> = ({ children, index = 0, motion, tilt = true, className, style }) => {
  const level = useMotionLevel(motion)
  const ref = useRef<HTMLDivElement>(null)

  useGSAP(
    () => {
      const el = ref.current
      if (!el) return

      if (level === 'reduced') {
        if (isPastStart(el)) return
        gsap.set(el, { opacity: 0 })
        const stop = onceInView(el, () => gsap.to(el, { opacity: 1, duration: 0.5, delay: index * 0.09 }))
        return () => {
          stop()
          gsap.set(el, { clearProps: 'opacity' })
        }
      }
      if (level !== 'on' || isPastStart(el)) return

      // Tipped back in perspective the card's top edge projects wider than its
      // box (about 5% a side); the slight scale keeps it inside the page
      // gutter, so a waiting card at the edge never adds a sideways scroll.
      gsap.set(el, { opacity: 0, y: 70, rotationX: -16, scale: 0.94, transformPerspective: 1000, transformOrigin: '50% 100%' })
      const stop = onceInView(el, () => {
        gsap.to(el, { opacity: 1, y: 0, rotationX: 0, scale: 1, duration: 0.9, delay: index * 0.09, ease: 'power3.out' })
      })
      return () => {
        stop()
        gsap.set(el, { clearProps: 'all' })
      }
    },
    { dependencies: [level, index] },
  )

  // The first icon or logo inside: turns and grows on hover, mouse only.
  useGSAP(
    () => {
      const el = ref.current
      if (!el || level !== 'on' || !tilt) return
      const icon = el.querySelector<HTMLElement | SVGElement>('svg, img')
      if (!icon) return
      let controls: ReturnType<typeof animate> | null = null
      const onEnter = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return
        controls?.stop()
        controls = animate(icon, { rotate: -8, scale: 1.12 }, { type: 'spring', stiffness: 400, damping: 12 })
      }
      const onLeave = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse') return
        controls?.stop()
        controls = animate(icon, { rotate: 0, scale: 1 }, { type: 'spring', stiffness: 400, damping: 14 })
      }
      el.addEventListener('pointerenter', onEnter)
      el.addEventListener('pointerleave', onLeave)
      return () => {
        el.removeEventListener('pointerenter', onEnter)
        el.removeEventListener('pointerleave', onLeave)
        controls?.stop()
      }
    },
    { dependencies: [level, tilt] },
  )

  return (
    <div
      className={`ncx-card-motion${tilt ? '' : ' is-still'}${className ? ` ${className}` : ''}`}
      style={style}
      ref={ref}
    >
      <style>{cardMotionCss}</style>
      {tilt ? (
        <TiltCard motion={motion} style={{ height: '100%' }}>
          {children}
        </TiltCard>
      ) : (
        children
      )}
    </div>
  )
}

const cardMotionCss = `
.ncx-card-motion{height:100%;box-shadow:inset 0 0 0 0 transparent;border-radius:var(--ncx-r-card);transition:box-shadow .25s ease}
.ncx-card-motion:hover{box-shadow:inset 0 0 0 1.5px var(--ncx-navy)}
.ncx-card-motion.is-still:hover{box-shadow:none}
.ncx-card-motion svg,.ncx-card-motion img{transform-origin:50% 50%}
@media(prefers-reduced-motion:reduce){.ncx-card-motion{transition:none}}
`
