'use client'

import { motion as m, useSpring } from 'motion/react'
import React, { useEffect, useRef } from 'react'

import type { MotionSetting } from './levels'
import { useMotionLevel } from './useMotionLevel'

const TILT = { stiffness: 260, damping: 18 }

/**
 * Tilts its child toward the cursor, up to `max` degrees, with a faint
 * crimson light under the pointer, and springs back flat when the cursor
 * leaves. Mouse only. Only at level on; otherwise it is a plain wrapper.
 */
export const TiltCard: React.FC<{
  children: React.ReactNode
  /** The block's own motion setting. */
  motion?: MotionSetting | null
  /** The steepest tilt, in degrees. */
  max?: number
  /** The card's corner radius, so the light follows its shape. */
  radius?: string
  className?: string
  style?: React.CSSProperties
}> = ({ children, motion, max = 10, radius = 'var(--ncx-r-card)', className, style }) => {
  const on = useMotionLevel(motion) === 'on'
  const rotateX = useSpring(0, TILT)
  const rotateY = useSpring(0, TILT)
  const light = useRef<HTMLSpanElement>(null)

  const flat = () => {
    rotateX.set(0)
    rotateY.set(0)
    if (light.current) light.current.style.opacity = '0'
  }

  useEffect(() => {
    if (!on) {
      rotateX.jump(0)
      rotateY.jump(0)
      if (light.current) light.current.style.opacity = '0'
    }
  }, [on, rotateX, rotateY])

  return (
    <m.div
      className={className}
      style={{
        ...style,
        position: 'relative',
        borderRadius: radius,
        rotateX,
        rotateY,
        transformPerspective: 1000,
      }}
      onPointerMove={(e) => {
        if (!on || e.pointerType !== 'mouse') return
        const r = e.currentTarget.getBoundingClientRect()
        const px = (e.clientX - r.left) / r.width
        const py = (e.clientY - r.top) / r.height
        rotateY.set((px - 0.5) * 2 * max)
        rotateX.set((0.5 - py) * 2 * max * 0.8)
        if (light.current) {
          light.current.style.setProperty('--tilt-x', `${px * 100}%`)
          light.current.style.setProperty('--tilt-y', `${py * 100}%`)
          light.current.style.opacity = '1'
        }
      }}
      onPointerLeave={flat}
    >
      {children}
      <span
        ref={light}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          pointerEvents: 'none',
          opacity: 0,
          transition: 'opacity .3s',
          background:
            'radial-gradient(240px circle at var(--tilt-x, 50%) var(--tilt-y, 0%), color-mix(in srgb, var(--ncx-crimson) 8%, transparent), transparent 70%)',
        }}
      />
    </m.div>
  )
}
