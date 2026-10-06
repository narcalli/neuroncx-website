'use client'

import React from 'react'
import Link from 'next/link'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

/**
 * A card link with a mouse-tracking tilt. The same spring values as the
 * Agentic Cases block; kept separate because that block does not export its
 * tilt component.
 */
export const TiltAnchor: React.FC<{ href: string; className?: string; children: React.ReactNode }> = ({
  href,
  className,
  children,
}) => {
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const rx = useSpring(useTransform(y, [0, 1], [4, -4]), { stiffness: 180, damping: 18 })
  const ry = useSpring(useTransform(x, [0, 1], [-5, 5]), { stiffness: 180, damping: 18 })

  const onMove = (e: React.PointerEvent<HTMLAnchorElement>) => {
    const r = e.currentTarget.getBoundingClientRect()
    x.set((e.clientX - r.left) / r.width)
    y.set((e.clientY - r.top) / r.height)
  }
  const onLeave = () => {
    x.set(0.5)
    y.set(0.5)
  }

  return (
    <motion.div style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }} className="ncx-cs__tilt">
      <Link href={href} className={className} onPointerMove={onMove} onPointerLeave={onLeave}>
        {children}
      </Link>
    </motion.div>
  )
}
