'use client'

import React, { useEffect, useRef, useState } from 'react'

type Props = {
  className?: string
  children: React.ReactNode
}

/**
 * The entrance animations in the hero blocks (Component.tsx), as an extra on
 * top of content that is already visible.
 *
 * The server sends everything visible, and the CSS never hides it at rest, so
 * without this script (JS disabled, an error, a slow connection) the buttons
 * are there from the first paint. Once it runs:
 * - a block already on screen stays as it is: hiding what the visitor has
 *   seen, to animate it back in, would make it blink;
 * - a block further down is marked "armed" (its buttons hidden while off
 *   screen), then "in" once it scrolls into view, which plays the animation.
 */
export const Animator: React.FC<Props> = ({ className, children }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<'rest' | 'armed' | 'in'>('rest')

  useEffect(() => {
    const el = ref.current
    if (!el) return

    let first = true
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.some((e) => e.isIntersecting)
        // The first report is where the block stands when the script runs.
        if (first) {
          first = false
          if (visible) return io.disconnect()
          return setState('armed')
        }
        if (visible) {
          setState('in')
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const extra = state === 'armed' ? ' armed' : state === 'in' ? ' armed in' : ''
  return (
    <div ref={ref} className={`${className || ''}${extra}`}>
      {children}
    </div>
  )
}
