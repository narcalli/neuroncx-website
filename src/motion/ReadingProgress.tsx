'use client'

import { motion, useScroll, useSpring } from 'motion/react'
import React from 'react'

import { useMotionLevel } from './useMotionLevel'

/**
 * A 3px crimson bar along the very top of the viewport, filling with how far
 * down the page the visitor has scrolled (point 2, prompt 4). The one piece
 * besides the header's own hide-on-scroll allowed to track scroll position
 * continuously rather than trigger once in view.
 *
 * Hidden whenever motion is not on, site or page: it is a decoration, not
 * content, so there is nothing to show in its place. useScroll reads the
 * whole document, so it works the same on every route without a prop.
 */
export const ReadingProgress: React.FC = () => {
  const on = useMotionLevel() === 'on'
  const { scrollYProgress } = useScroll()
  const width = useSpring(scrollYProgress, { stiffness: 380, damping: 40, restDelta: 0.001 })

  if (!on) return null

  return (
    <motion.div
      aria-hidden="true"
      style={{
        position: 'fixed',
        insetInlineStart: 0,
        insetInlineEnd: 0,
        top: 0,
        height: 3,
        zIndex: 80,
        background: 'var(--ncx-crimson)',
        transformOrigin: '0% 50%',
        scaleX: width,
      }}
    />
  )
}
