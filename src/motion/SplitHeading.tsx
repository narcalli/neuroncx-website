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
 * it comes into view (GSAP SplitText). The server HTML is the plain heading.
 *
 * Nothing is split on mount: until the heading reaches the in-view point it
 * is only held at opacity 0, and it is split there, just before its lines
 * rise. A heading already in view at load is never split. The split is
 * undone as soon as the lines have risen, so the heading is plain text
 * again (it re-splits on a resize during the rise). Reduced fades the
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

      gsap.set(el, { opacity: 0 })

      if (level === 'reduced') {
        const stop = onceInView(el, () =>
          gsap.to(el, { opacity: 1, duration: DURATION.base, ease: EASE.gsap }),
        )
        return () => {
          stop()
          gsap.set(el, { clearProps: 'opacity' })
        }
      }

      let split: SplitText | null = null
      const stop = onceInView(el, () => {
        split = SplitText.create(el, {
          type: 'lines',
          mask: 'lines',
          autoSplit: true,
          // Returned, so a re-split on resize replaces the rise rather than stacking a second one.
          onSplit: (self) => {
            gsap.set(el, { opacity: 1 })
            return gsap.fromTo(
              self.lines,
              { yPercent: 105 },
              {
                yPercent: 0,
                duration: DURATION.slow,
                stagger: 0.1,
                ease: 'power4.out',
                onComplete: () => split?.revert(),
              },
            )
          },
        })
      })
      return () => {
        stop()
        split?.revert()
        gsap.set(el, { clearProps: 'opacity' })
      }
    },
    { dependencies: [level], scope: ref },
  )

  return React.createElement(as, { ref, id, className, style }, children)
}
