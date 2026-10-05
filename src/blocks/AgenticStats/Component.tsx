'use client'

import React, { useEffect, useRef, useState } from 'react'
import { animate, motion, useInView } from 'motion/react'

import type { AgenticStatsBlock as AgenticStatsProps } from '@/payload-types'

type Stat = NonNullable<AgenticStatsProps['stats']>[number]

function CountUp({ to, suffix }: { to: number; suffix?: string | null }) {
  const ref = useRef<HTMLSpanElement>(null)
  const inView = useInView(ref, { once: true, amount: 0.5 })
  const [shown, setShown] = useState(to)

  useEffect(() => {
    if (!inView || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const controls = animate(0, to, {
      duration: 1.8,
      ease: 'easeOut',
      onUpdate: (v) => setShown(Math.round(v)),
    })
    return () => controls.stop()
  }, [inView, to])

  return (
    <span ref={ref}>
      {shown}
      {suffix ?? ''}
    </span>
  )
}

export const AgenticStatsBlock: React.FC<AgenticStatsProps> = ({ eyebrow, heading, stats }) => {
  const list: Stat[] = (stats || []).filter((s) => s && s.label)
  if (!list.length) return null

  return (
    <section className="ncx-stats">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500&family=Poppins:wght@600;700&display=swap');
        .ncx-stats{padding:70px 0;background:var(--ncx-cloud);border-block:1px solid var(--ncx-rule);font-family:Inter,Arial,sans-serif;color:var(--ncx-body)}
        .ncx-stats .wrap{max-width:1080px;margin:0 auto;padding:0 24px}
        .ncx-stats .eyebrow{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:14px;margin:0 0 12px;color:var(--ncx-crimson)}
        .ncx-stats h2{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:clamp(1.4rem,2.6vw,1.8rem);margin:0 0 30px;color:var(--ncx-navy)}
        .ncx-stats .tiles{display:grid;grid-template-columns:repeat(4,1fr);gap:22px}
        .ncx-stats .tile{position:relative;padding:26px 18px 20px;border-radius:14px;background:#fff;border:1px solid var(--ncx-rule)}
        .ncx-stats .tile::before{content:"";position:absolute;left:18px;top:-1px;width:32px;height:3px;border-radius:0 0 3px 3px;background:var(--ncx-crimson)}
        .ncx-stats .num{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:2.5rem;line-height:1;color:var(--ncx-navy);font-variant-numeric:tabular-nums}
        .ncx-stats .num.pending{display:inline-block;padding-bottom:3px;border-bottom:2px dashed var(--rule2,#CBD0DC);color:transparent;
          background:linear-gradient(100deg,#B4BBCB 30%,#E4E7EF 50%,#B4BBCB 70%);background-size:220% 100%;-webkit-background-clip:text;background-clip:text;
          animation:ncxShimmer 2.4s linear infinite}
        @keyframes ncxShimmer{from{background-position:120% 0}to{background-position:-120% 0}}
        .ncx-stats .lab{font-size:.92rem;color:var(--ncx-muted);margin-top:12px;line-height:1.45}
        .ncx-stats .pendtag{display:inline-block;font-size:.68rem;letter-spacing:.04em;color:#9A3330;border:1px solid #E3B9B6;background:#FFEBEE;border-radius:4px;padding:2px 7px;margin-top:10px}
        @media (max-width:860px){.ncx-stats .tiles{grid-template-columns:1fr 1fr}}
        @media (max-width:480px){.ncx-stats .tiles{grid-template-columns:1fr}}
        @media (prefers-reduced-motion:reduce){.ncx-stats .num.pending{animation:none}}
      `}</style>
      <div className="wrap">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {heading ? <h2>{heading}</h2> : null}
        <div className="tiles">
          {list.map((s, i) => (
            <motion.div
              key={i}
              className="tile"
              initial={{ opacity: 0, y: 22 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.3 }}
              transition={{ duration: 0.8, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            >
              {s.pending ? (
                <div className="num pending">00{s.suffix ?? ''}</div>
              ) : (
                <div className="num">
                  <CountUp to={s.value ?? 0} suffix={s.suffix} />
                </div>
              )}
              <div className="lab">{s.label}</div>
              {s.pending ? <span className="pendtag">figure to confirm</span> : null}
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  )
}
