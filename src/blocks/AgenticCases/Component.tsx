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
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Poppins:wght@600&display=swap');
        .ncx-cases{--ncx-indigo:#3B4A8C;padding:84px 0;font-family:Inter,Arial,sans-serif;color:var(--ncx-body)}
        .ncx-cases .wrap{max-width:1080px;margin:0 auto;padding:0 24px}
        .ncx-cases h2{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:clamp(1.55rem,3.4vw,2.2rem);max-width:24ch;margin:0 0 40px;color:var(--ncx-navy)}
        .ncx-cases .grid{display:grid;grid-template-columns:repeat(3,1fr);gap:24px}
        .ncx-cases .case{position:relative;padding:24px 22px;border-radius:14px;background:#fff;border:1px solid var(--ncx-rule);transform-style:preserve-3d}
        .ncx-cases .case:hover{box-shadow:0 26px 44px -30px rgba(26,32,53,.25)}
        .ncx-cases .case h3{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:1.02rem;margin:0 0 10px;color:var(--ncx-navy)}
        .ncx-cases .case p{font-size:.95rem;margin:0;color:var(--ncx-body)}
        .ncx-cases .case-link{display:inline-block;margin-top:14px;color:var(--ncx-crimson);font-weight:500;text-decoration:none}
        .ncx-cases .case-link:hover{text-decoration:underline}
        .ncx-cases .pendtag{display:inline-block;font-size:.68rem;letter-spacing:.04em;color:#9A3330;border:1px solid #E3B9B6;background:#FFEBEE;border-radius:4px;padding:2px 7px;margin-top:12px}

        /* Hover glow: a crimson-to-indigo border that fades in, and a spotlight that follows the cursor. */
        .ncx-cases .case.glow::before{content:"";position:absolute;inset:-1px;border-radius:15px;padding:2px;
          background:linear-gradient(135deg,var(--ncx-crimson),var(--ncx-indigo));
          -webkit-mask:linear-gradient(#000 0 0) content-box,linear-gradient(#000 0 0);-webkit-mask-composite:xor;
          mask:linear-gradient(#000 0 0) content-box exclude,linear-gradient(#000 0 0);
          opacity:0;transition:opacity .35s;pointer-events:none}
        .ncx-cases .case.glow::after{content:"";position:absolute;inset:0;border-radius:14px;pointer-events:none;opacity:0;transition:opacity .3s;
          background:radial-gradient(circle at var(--mx,50%) var(--my,0%),rgba(198,40,40,.08),transparent 58%)}
        .ncx-cases .case.glow:hover::before,.ncx-cases .case.glow:hover::after,.ncx-cases .case.glow:focus-within::before{opacity:1}

        @media (max-width:860px){.ncx-cases .grid{grid-template-columns:1fr;gap:28px}}
        @media (prefers-reduced-motion:reduce){
          .ncx-cases .case.glow::before,.ncx-cases .case.glow::after{transition:none}
        }
      `}</style>
      <div className="wrap">
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
