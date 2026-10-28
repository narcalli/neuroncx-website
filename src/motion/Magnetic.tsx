'use client'

import { motion as m, useSpring } from 'motion/react'
import React, { useEffect } from 'react'

import type { MotionSetting } from './levels'
import { useMotionLevel } from './useMotionLevel'

const PULL = { stiffness: 300, damping: 18 }

/**
 * Leans its child toward the cursor on a spring while the pointer is over
 * it, and springs back when it leaves. Mouse only: touch and pen do nothing.
 * Also scales it to 0.95 while pressed (a CTA button, prompt 4). Only at
 * level on; otherwise the child stays put.
 */
export const Magnetic: React.FC<{
  children: React.ReactNode
  /** The block's own motion setting. */
  motion?: MotionSetting | null
  /** How far it follows the cursor, as a share of the distance from its centre. */
  strength?: number
  className?: string
}> = ({ children, motion, strength = 0.3, className }) => {
  const on = useMotionLevel(motion) === 'on'
  const x = useSpring(0, PULL)
  const y = useSpring(0, PULL)

  useEffect(() => {
    if (!on) {
      x.jump(0)
      y.jump(0)
    }
  }, [on, x, y])

  return (
    <m.span
      className={className}
      style={{ display: 'inline-block', x, y }}
      whileTap={on ? { scale: 0.95 } : undefined}
      onPointerMove={(e) => {
        if (!on || e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        x.set((e.clientX - r.left - r.width / 2) * strength)
        y.set((e.clientY - r.top - r.height / 2) * strength * 1.2)
      }}
      onPointerLeave={() => {
        x.set(0)
        y.set(0)
      }}
    >
      {children}
    </m.span>
  )
}
