'use client'

import React from 'react'
import { motion, useMotionValue, useSpring, useTransform } from 'motion/react'

import type { AgenticCasesBlock as AgenticCasesProps } from '@/payload-types'

type Case = NonNullable<AgenticCasesProps['cases']>[number]

function TiltCard({ item, index, glow }: { item: Case; index: number; glow: boolean }) {
  const x = useMotionValue(0.5)
  const y = useMotionValue(0.5)
  const rx = useSpring(useTransform(y, [0, 1], [4, -4]), { stiffness: 180, damping: 18 })
  const ry = useSpring(useTransform(x, [0, 1], [-5, 5]), { stiffness: 180, damping: 18 })

  const onMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const el = e.currentTarget
    const r = el.getBoundingClientRect()
    const px = (e.clientX - r.left) / r.width
    const py = (e.clientY - r.top) / r.height
    x.set(px)
    y.set(py)
    if (glow) {
      el.style.setProperty('--mx', `${(px * 100).toFixed(1)}%`)
      el.style.setProperty('--my', `${(py * 100).toFixed(1)}%`)
    }
  }
  const onLeave = () => {
    x.set(0.5)
    y.set(0.5)
  }

  return (
    <motion.div
      className={glow ? 'case glow' : 'case'}
      onPointerMove={onMove}
      onPointerLeave={onLeave}
      style={{ rotateX: rx, rotateY: ry, transformPerspective: 900 }}
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.8, delay: index * 0.12, ease: [0.22, 1, 0.36, 1] }}
    >
      <h3>{item.title}</h3>
      <p>{item.text}</p>
      {item.linkLabel && item.linkUrl ? (
        <a href={item.linkUrl} className="case-link">
          {item.linkLabel}
        </a>
      ) : null}
      {item.clientPending ? <span className="pendtag">client name to confirm</span> : null}
    </motion.div>
  )
}

export const AgenticCasesBlock: React.FC<AgenticCasesProps> = ({ heading, cases, hoverGlow }) => {
  const list: Case[] = (cases || []).filter((c) => c && c.title)
  if (!list.length) return null
  const glow = hoverGlow !== false

  return (
    <section className="ncx-cases">
      <style>{`
        .ncx-cases{padding:84px 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-cases h2{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:clamp(1.55rem,3.4vw,2.2rem);max-width:24ch;margin:0 0 40px;color:var(--ncx-ink)}
        .ncx-cases .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
        .ncx-cases .case{position:relative;padding:24px 22px;border-radius:14px;background:var(--ncx-white);border:1px solid var(--ncx-rule);transform-style:preserve-3d}
        .ncx-cases .case:hover{box-shadow:0 26px 44px -30px var(--ncx-rule)}
        .ncx-cases .case h3{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:1.02rem;margin:0 0 10px;color:var(--ncx-ink)}
        .ncx-cases .case p{font-size:.95rem;margin:0;color:var(--ncx-body)}
        /* Both are crimson at small scale, where flat --ncx-crimson measured
           2.87:1 on navy. They part company inside a highlight: the link is
           interactive, so it goes to --ncx-on-navy and keeps its affordance;
           the tag is read-only, so it steps down to the soft tint. */
        .ncx-cases .case-link{display:inline-block;margin-top:14px;color:var(--ncx-link);font-weight:500;text-decoration:none}
        .ncx-cases .case-link:hover{text-decoration:underline}
        .ncx-cases .pendtag{display:inline-block;font-size:.68rem;letter-spacing:.04em;color:var(--ncx-crimson-ink);border:1px solid var(--ncx-crimson-tint);background:var(--ncx-crimson-tint);border-radius:4px;padding:2px 7px;margin-top:12px}

        /* Hover glow: a crimson-to-indigo border that fades in, and a spotlight that follows the cursor. */
        .ncx-cases .case.glow::before{content:"";position:absolute;inset:-1px;border-radius:15px;padding:2px;
          background:linear-gradient(135deg,var(--ncx-crimson),var(--ncx-navy-tint));
          /* #000 here is a mask stencil, not a colour: the gradient only supplies
             an alpha channel, so there is no token to point it at. */
          -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;
          mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
          opacity:0;transition:opacity .35s;pointer-events:none}
        .ncx-cases .case.glow::after{content:"";position:absolute;inset:0;border-radius:14px;pointer-events:none;opacity:0;transition:opacity .3s;
          background:radial-gradient(circle at var(--mx,50%) var(--my,0%),var(--ncx-crimson-tint),transparent 58%)}
        .ncx-cases .case.glow:hover::before,.ncx-cases .case.glow:hover::after,.ncx-cases .case.glow:focus-within::before{opacity:1}

        @media (max-width:860px){.ncx-cases .grid{grid-template-columns:1fr;gap:28px}}
        @media (prefers-reduced-motion:reduce){
          .ncx-cases .case.glow::before,.ncx-cases .case.glow::after{transition:none}
        }
      `}</style>
      <div className="wrap ncx-container-narrow">
        <h2>{heading}</h2>
        <div className="grid">
          {list.map((c, i) => (
            <TiltCard key={i} item={c} index={i} glow={glow} />
          ))}
        </div>
      </div>
    </section>
  )
}
