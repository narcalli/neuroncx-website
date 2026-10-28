'use client'

import { animate, stagger as staggerFrom } from 'motion/react'
import React, { useEffect, useRef } from 'react'

import type { MotionSetting } from './levels'
import { DURATION, EASE, RISE, STAGGER } from './tokens'
import { isPastStart, onceInView } from './useOnceInView'
import { useMotionLevel } from './useMotionLevel'

type Props = {
  children: React.ReactNode
  /** The element it renders as. */
  as?: 'div' | 'section' | 'ul' | 'ol' | 'p' | 'span' | 'header'
  /** Reveal each direct child in turn instead of the whole element. */
  stagger?: boolean
  /** Which way it arrives from. Bottom rises 16px; left slides in the same amount. */
  from?: 'bottom' | 'left'
  /** The block's own motion setting. */
  motion?: MotionSetting | null
  className?: string
  style?: React.CSSProperties
}

/**
 * Fades its content in and moves it 16px, once, when it comes into view
 * (up from below by default, or in from the left, such as an eyebrow).
 * With stagger, its direct children arrive one after another. The server
 * HTML is fully visible: the starting state is set only after the script
 * loads, and only for content not yet in view. Reduced fades without the
 * movement; off renders the children as they are.
 */
export const Reveal: React.FC<Props> = ({
  children,
  as = 'div',
  stagger = false,
  from = 'bottom',
  motion,
  className,
  style,
}) => {
  const ref = useRef<HTMLElement>(null)
  const level = useMotionLevel(motion)
  const axis = from === 'left' ? 'x' : 'y'

  useEffect(() => {
    const el = ref.current
    if (!el || level === 'off' || isPastStart(el)) return
    const targets = stagger ? (Array.from(el.children) as HTMLElement[]) : [el]
    if (!targets.length) return
    const offset = level === 'on' ? (from === 'left' ? -RISE : RISE) : 0
    animate(targets, { opacity: 0, [axis]: offset }, { duration: 0 })
    const stop = onceInView(el, () => {
      animate(
        targets,
        { opacity: 1, [axis]: 0 },
        { duration: DURATION.base, ease: EASE.motion, delay: stagger ? staggerFrom(STAGGER) : 0 },
      )
    })
    return () => {
      stop()
      // Leaving early (the level changed, or the block unmounts): show everything.
      animate(targets, { opacity: 1, [axis]: 0 }, { duration: 0 })
    }
  }, [level, stagger, from, axis])

  return React.createElement(as, { ref, className, style }, children)
}
