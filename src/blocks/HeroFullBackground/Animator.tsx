'use client'

import React, { useEffect, useRef, useState } from 'react'

type Props = {
  className?: string
  children: React.ReactNode
}

/**
 * Adds an "in" class once this block has entered the viewport, which is
 * what actually triggers the CSS entrance animations in Component.tsx.
 *
 * Everything inside is rendered by the server and already fully visible on
 * its own — this only ever adds motion on top. If this script never runs
 * (JS disabled, an error, a slow connection), the content stays exactly as
 * the server sent it: present and readable, just without the animation.
 */
export const Animator: React.FC<Props> = ({ className, children }) => {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return

    // A hero is normally in view immediately on load, but this still covers
    // the block being placed further down a page.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true)
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div ref={ref} className={`${className || ''}${inView ? ' in' : ''}`}>
      {children}
    </div>
  )
}
