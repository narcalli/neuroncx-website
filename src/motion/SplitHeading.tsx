'use client'

import React, { useRef } from 'react'

import { gsap, useGSAP } from './gsap'
import { SplitText } from './gsapSplitText'
import type { MotionSetting } from './levels'
import { DURATION, EASE } from './tokens'
import { isPastStart, onceInView } from './useOnceInView'
import { useMotionLevel } from './useMotionLevel'

type Props = {
  children: React.ReactNode
  /** A section heading. Never the H1: the page's H1 is never hidden or moved. */
  as?: 'h2' | 'h3'
  /** The block's own motion setting. */
  motion?: MotionSetting | null
  id?: string
  className?: string
  style?: React.CSSProperties
}

/**
 * A section heading whose lines rise out of a mask, one after another, once
 * it comes into view (GSAP SplitText). The split is undone when they have
 * risen, so the heading is plain text again, and it re-splits on resize
 * until then. The server HTML is the plain heading. Reduced fades the
 * heading in whole; off leaves it as it is.
 */
export const SplitHeading: React.FC<Props> = ({
  children,
  as = 'h2',
  motion,
  id,
  className,
  style,
}) => {
  const ref = useRef<HTMLHeadingElement>(null)
  const level = useMotionLevel(motion)

  useGSAP(
    () => {
      const el = ref.current
      if (!el || level === 'off' || isPastStart(el)) return

      if (level === 'reduced') {
        gsap.set(el, { opacity: 0 })
        const stop = onceInView(el, () =>
          gsap.to(el, { opacity: 1, duration: DURATION.base, ease: EASE.gsap }),
        )
        return () => {
          stop()
          gsap.set(el, { clearProps: 'opacity' })
        }
      }

      let risen = false
      const split = SplitText.create(el, {
        type: 'lines',
        mask: 'lines',
        autoSplit: true,
        // Each new split (the first, and any after a resize) starts below its mask until it has risen.
        onSplit: (self) => {
          if (!risen) gsap.set(self.lines, { yPercent: 105 })
        },
      })
      const stop = onceInView(el, () => {
        risen = true
        gsap.to(split.lines, {
          yPercent: 0,
          duration: DURATION.slow,
          stagger: 0.1,
          ease: 'power4.out',
          onComplete: () => split.revert(),
        })
      })
      return () => {
        stop()
        split.revert()
      }
    },
    { dependencies: [level], scope: ref },
  )

  return React.createElement(as, { ref, id, className, style }, children)
}
