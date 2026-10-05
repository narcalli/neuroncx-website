'use client'

import React, { useRef } from 'react'
import { motion, useMotionValue, useSpring } from 'motion/react'

import type { AgenticClosingBlock as AgenticClosingProps } from '@/payload-types'

export const AgenticClosingBlock: React.FC<AgenticClosingProps> = ({ heading, ctaLabel, ctaUrl }) => {
  const sectionRef = useRef<HTMLElement>(null)
  const btnRef = useRef<HTMLAnchorElement>(null)
  const mx = useMotionValue(0)
  const my = useMotionValue(0)
  const sx = useSpring(mx, { stiffness: 220, damping: 20 })
  const sy = useSpring(my, { stiffness: 220, damping: 20 })

  const onMove = (e: React.PointerEvent<HTMLElement>) => {
    const btn = btnRef.current
    if (!btn) return
    const r = btn.getBoundingClientRect()
    const dx = e.clientX - (r.left + r.width / 2)
    const dy = e.clientY - (r.top + r.height / 2)
    const near = Math.hypot(dx, dy) < 190
    mx.set(near ? dx * 0.22 : 0)
    my.set(near ? dy * 0.22 : 0)
  }

  return (
    <section
      ref={sectionRef}
      className="ncx-closing"
      onPointerMove={onMove}
      onPointerLeave={() => {
        mx.set(0)
        my.set(0)
      }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@600;700&display=swap');
        .ncx-closing{padding:84px 0;text-align:center;background:linear-gradient(120deg,#fff,#FFF1F2 45%,#F6F7FA);background-size:240% 240%;
          animation:ncxBgMove 14s ease-in-out infinite alternate}
        @keyframes ncxBgMove{from{background-position:0% 40%}to{background-position:100% 60%}}
        .ncx-closing h2{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:clamp(1.6rem,3.6vw,2.2rem);max-width:20ch;margin:0 auto;color:var(--ncx-navy)}
        .ncx-closing .btn{display:inline-block;margin-top:30px;background:var(--ncx-crimson);color:#fff;font-family:Poppins,Arial,sans-serif;font-weight:600;
          font-size:1rem;text-decoration:none;padding:15px 30px;border-radius:8px}
        .ncx-closing .btn:hover{background:#A91F1F}
        @media (prefers-reduced-motion:reduce){.ncx-closing{animation:none}}
      `}</style>
      <div className="wrap" style={{ maxWidth: 1080, margin: '0 auto', padding: '0 24px' }}>
        <h2>{heading}</h2>
        <motion.a ref={btnRef} className="btn" href={ctaUrl} style={{ x: sx, y: sy }}>
          {ctaLabel}
        </motion.a>
      </div>
    </section>
  )
}
