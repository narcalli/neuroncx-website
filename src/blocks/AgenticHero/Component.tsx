'use client'

import React from 'react'
import { motion } from 'motion/react'

import type { AgenticHeroBlock as AgenticHeroProps } from '@/payload-types'

type Node = NonNullable<AgenticHeroProps['nodes']>[number]

// Fixed slots around the centre, matching the reference network layout.
const SLOTS: [number, number][] = [
  [150, 90],
  [455, 95],
  [470, 320],
  [105, 270],
  [250, 375],
  [330, 38],
]

const SparkIcon = () => (
  <path d="M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4Z" fill="#fff" />
)

const PersonIcon = () => (
  <>
    <circle cy={-5} r={5} fill="#1A2035" />
    <path d="M-10 12 C-10 3 10 3 10 12 Z" fill="#1A2035" />
  </>
)

const NodeBadge = ({ node, x, y, i }: { node: Node; x: number; y: number; i: number }) => {
  const delay = -(i * 0.5)
  if (node.kind === 'human') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle className="ncx-pr" r={22} fill="none" stroke="rgba(255,255,255,.6)" strokeWidth={1.5} style={{ animationDelay: `${delay}s` }} />
        <circle r={22} fill="#F5F6FA" />
        <PersonIcon />
      </g>
    )
  }
  if (node.kind === 'system') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r={22} fill="none" stroke="rgba(255,255,255,.7)" strokeWidth={1.5} />
        <rect x={-8} y={-8} width={16} height={16} rx={3} fill="none" stroke="#fff" strokeWidth={1.6} />
      </g>
    )
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle className="ncx-pr" r={22} fill="none" stroke="rgba(255,255,255,.6)" strokeWidth={1.5} style={{ animationDelay: `${delay}s` }} />
      <circle r={22} fill="#2B3563" stroke="rgba(255,255,255,.5)" strokeWidth={1.5} />
      <SparkIcon />
    </g>
  )
}

export const AgenticHeroBlock: React.FC<AgenticHeroProps> = ({ headline, accentWords, intro, ctaLabel, ctaUrl, nodes }) => {
  const words = (headline || '').split(' ').filter(Boolean)
  const accents = new Set(
    (accentWords || '')
      .split(',')
      .map((w) => w.trim().toLowerCase())
      .filter(Boolean),
  )
  const slotNodes = (nodes || []).slice(0, SLOTS.length)

  return (
    <section className="ncx-hero">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700&display=swap');
        .ncx-hero{position:relative;overflow:hidden;isolation:isolate;background:var(--ncx-navy);color:#fff;
          padding:84px 0 100px;font-family:Inter,Arial,sans-serif}
        .ncx-hero .mesh{position:absolute;inset:-20%;z-index:-2;pointer-events:none}
        .ncx-hero .mesh i{position:absolute;border-radius:50%;will-change:transform}
        .ncx-hero .b1{width:44vmax;height:44vmax;left:-8%;top:-32%;opacity:.38;background:radial-gradient(circle,#C62828,transparent 64%);animation:ncxDrift1 22s ease-in-out infinite alternate}
        .ncx-hero .b2{width:44vmax;height:44vmax;right:-8%;top:-16%;opacity:.55;background:radial-gradient(circle,#4A5AA8,transparent 64%);animation:ncxDrift2 26s ease-in-out infinite alternate}
        .ncx-hero .b3{width:38vmax;height:38vmax;left:30%;bottom:-44%;opacity:.6;background:radial-gradient(circle,#2F3B78,transparent 64%);animation:ncxDrift3 30s ease-in-out infinite alternate}
        @keyframes ncxDrift1{to{transform:translate(12vmax,8vmax) scale(1.15)}}
        @keyframes ncxDrift2{to{transform:translate(-10vmax,10vmax) scale(.9)}}
        @keyframes ncxDrift3{to{transform:translate(-14vmax,-6vmax) scale(1.2)}}
        .ncx-hero::after{content:"";position:absolute;inset:0;z-index:-1;pointer-events:none;
          background-image:radial-gradient(rgba(255,255,255,.08) 1px,transparent 1.2px);background-size:28px 28px;
          -webkit-mask-image:linear-gradient(180deg,#000,transparent 85%);mask-image:linear-gradient(180deg,#000,transparent 85%)}
        .ncx-hero .wrap{max-width:1080px;margin:0 auto;padding:0 24px;position:relative;z-index:1}
        .ncx-hero h1{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:clamp(2.4rem,6.2vw,4.1rem);
          line-height:1.1;max-width:16ch;letter-spacing:-.02em;margin:0}
        .ncx-hero .w{display:inline-block}
        .ncx-hero .acc{position:relative}
        .ncx-hero .acc::after{content:"";position:absolute;left:0;right:0;bottom:.02em;height:.09em;border-radius:4px;
          background:linear-gradient(90deg,#FF5A5F,#C62828);transform:scaleX(0);transform-origin:left center;
          animation:ncxUnderline .9s 1.1s cubic-bezier(.2,.8,.2,1) forwards}
        @keyframes ncxUnderline{to{transform:scaleX(1)}}
        .ncx-hero .hero-p{color:#D8DAE4;font-size:clamp(1.05rem,2.2vw,1.3rem);max-width:54ch;margin:26px 0 0;line-height:1.6}
        .ncx-hero .btn{display:inline-block;background:#C62828;color:#fff;font-family:Poppins,Arial,sans-serif;font-weight:600;
          font-size:1rem;text-decoration:none;padding:15px 30px;border-radius:8px;margin-top:34px}
        .ncx-hero .btn:hover{background:#A91F1F}
        .ncx-hero .net{position:absolute;right:max(-60px,calc(50% - 650px));top:50%;transform:translateY(-50%);
          width:min(640px,72vw);height:auto;z-index:-1;pointer-events:none}
        .ncx-hero .ln{stroke-dasharray:3 9;animation:ncxFlow 1.4s linear infinite}
        @keyframes ncxFlow{to{stroke-dashoffset:-24}}
        .ncx-hero .ncx-pr{transform-box:fill-box;transform-origin:center;animation:ncxPing 3.2s ease-out infinite}
        @keyframes ncxPing{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.1);opacity:0}}
        @media (max-width:860px){
          .ncx-hero{padding:60px 0 72px}
          .ncx-hero .net{right:-170px;opacity:.32}
        }
        @media (prefers-reduced-motion:reduce){
          .ncx-hero *,.ncx-hero *::before,.ncx-hero *::after{animation:none!important}
        }
      `}</style>

      <div className="mesh" aria-hidden="true">
        <i className="b1" />
        <i className="b2" />
        <i className="b3" />
      </div>

      {slotNodes.length > 0 ? (
        <svg className="net" viewBox="0 0 600 420" aria-hidden="true" focusable="false">
          <g fill="none" strokeWidth={1.6} strokeLinecap="round" stroke="rgba(255,255,255,.4)">
            {slotNodes.map((_, i) => (
              <line
                key={i}
                className="ln"
                x1={300}
                y1={210}
                x2={SLOTS[i][0]}
                y2={SLOTS[i][1]}
                style={{ animationDelay: `${-(i * 0.2)}s` }}
              />
            ))}
          </g>
          <g transform="translate(300 210)">
            <circle className="ncx-pr" r={32} fill="none" stroke="#FF5A5F" strokeWidth={2} />
            <g transform="scale(2.4) translate(-13 -13)">
              <circle cx={13} cy={13} r={13} fill="#C62828" />
              <path d="M13 6c-2.5 0-4.5 2-4.5 4.5 0 3.2 4.5 8 4.5 8s4.5-4.8 4.5-8C17.5 8 15.5 6 13 6z" fill="#fff" />
              <circle cx={13} cy={10.6} r={1.8} fill="#C62828" />
            </g>
          </g>
          {slotNodes.map((node, i) => (
            <NodeBadge key={i} node={node} x={SLOTS[i][0]} y={SLOTS[i][1]} i={i} />
          ))}
        </svg>
      ) : null}

      <div className="wrap">
        <h1 aria-label={headline || undefined}>
          {words.map((word, i) => {
            const plain = word.replace(/[^a-z0-9]/gi, '').toLowerCase()
            const isAccent = accents.has(plain)
            return (
              <React.Fragment key={i}>
                <motion.span
                  className={isAccent ? 'w acc' : 'w'}
                  aria-hidden="true"
                  initial={{ opacity: 0, y: 34, filter: 'blur(8px)' }}
                  animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                  transition={{ duration: 0.8, delay: 0.1 + i * 0.09, ease: [0.22, 1, 0.36, 1] }}
                >
                  {word}
                </motion.span>{' '}
              </React.Fragment>
            )
          })}
        </h1>

        {intro ? (
          <motion.p
            className="hero-p"
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {intro}
          </motion.p>
        ) : null}

        {ctaLabel && ctaUrl ? (
          <motion.a
            className="btn"
            href={ctaUrl}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.85, ease: [0.22, 1, 0.36, 1] }}
          >
            {ctaLabel}
          </motion.a>
        ) : null}
      </div>
    </section>
  )
}
