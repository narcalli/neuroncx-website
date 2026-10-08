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
  <path d="M0 -9 L2.4 -2.4 L9 0 L2.4 2.4 L0 9 L-2.4 2.4 L-9 0 L-2.4 -2.4Z" fill="var(--ncx-on-navy)" />
)

const PersonIcon = () => (
  <>
    <circle cy={-5} r={5} fill="var(--ncx-ink)" />
    <path d="M-10 12 C-10 3 10 3 10 12 Z" fill="var(--ncx-ink)" />
  </>
)

const NodeBadge = ({ node, x, y, i }: { node: Node; x: number; y: number; i: number }) => {
  const delay = -(i * 0.5)
  if (node.kind === 'human') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle className="ncx-pr" r={22} fill="none" stroke="rgba(26,32,53,.4)" strokeWidth={1.5} style={{ animationDelay: `${delay}s` }} />
        <circle r={22} fill="var(--ncx-paper)" />
        <PersonIcon />
      </g>
    )
  }
  if (node.kind === 'system') {
    return (
      <g transform={`translate(${x} ${y})`}>
        <circle r={22} fill="none" stroke="rgba(26,32,53,.45)" strokeWidth={1.5} />
        <rect x={-8} y={-8} width={16} height={16} rx={3} fill="none" stroke="var(--ncx-ink)" strokeWidth={1.6} />
      </g>
    )
  }
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle className="ncx-pr" r={22} fill="none" stroke="rgba(26,32,53,.4)" strokeWidth={1.5} style={{ animationDelay: `${delay}s` }} />
      <circle r={22} fill="var(--ncx-navy-tint)" stroke="rgba(26,32,53,.35)" strokeWidth={1.5} />
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
        .ncx-hero{position:relative;overflow:hidden;isolation:isolate;
          background:var(--wash);color:var(--ncx-body);
          padding:calc(64px + clamp(44px,6vw,76px)) 0 clamp(64px,8vw,100px);
          font-family:var(--font-body),Arial,sans-serif}
        /* The stage, as on conversationHero and statHero: full bleed, four
           blooms on one composited layer. */
        .ncx-hero::before{
          content:"";position:absolute;inset:-35%;z-index:0;pointer-events:none;
          background:
            radial-gradient(38% 46% at 18% 28%, var(--g1), transparent 66%),
            radial-gradient(44% 52% at 78% 16%, var(--g2), transparent 66%),
            radial-gradient(46% 54% at 62% 88%, var(--g3), transparent 66%),
            radial-gradient(42% 50% at 8% 86%, var(--g4), transparent 66%);
          animation:ncxDrift 26s ease-in-out infinite alternate;
          will-change:transform}
        @keyframes ncxDrift{
          0%{transform:translate3d(0,0,0) scale(1) rotate(0deg)}
          50%{transform:translate3d(5%,-4%,0) scale(1.16) rotate(4deg)}
          100%{transform:translate3d(-4%,5%,0) scale(1.06) rotate(-3deg)}
        }
        @media(prefers-reduced-motion:reduce){.ncx-hero::before{animation:none}}
        .ncx-hero .wrap{position:relative;z-index:1}
        .ncx-hero h1{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:clamp(2.4rem,6.2vw,4.1rem);
          line-height:1.1;max-width:16ch;letter-spacing:-.02em;margin:0}
        .ncx-hero .w{display:inline-block}
        .ncx-hero .acc{position:relative}
        .ncx-hero .acc::after{content:"";position:absolute;left:0;right:0;bottom:.02em;height:.09em;border-radius:4px;
          background:var(--ncx-crimson);transform:scaleX(0);transform-origin:left center;
          animation:ncxUnderline .9s 1.1s cubic-bezier(.2,.8,.2,1) forwards}
        @keyframes ncxUnderline{to{transform:scaleX(1)}}
        .ncx-hero .hero-p{color:var(--ncx-muted);font-size:clamp(1.05rem,2.2vw,1.3rem);max-width:54ch;margin:26px 0 0;line-height:1.6}
        .ncx-hero .btn{display:inline-block;background:var(--ncx-crimson);color:var(--ncx-on-navy);font-family:var(--font-display),Arial,sans-serif;font-weight:600;
          font-size:1rem;text-decoration:none;padding:15px 30px;border-radius:8px;margin-top:34px}
        .ncx-hero .btn:hover{background:var(--ncx-crimson-hover)}
        /* The diagram lives in the content column, anchored to its right edge,
           and the copy takes the column's left share. Both are fractions of the
           same column, so they keep the same relationship at every width. It
           used to be positioned against the whole hero, which knew nothing of
           the column, and its leftmost node landed on the intro text.
           The numbers: the leftmost node's ping ring sits 12% into the
           diagram, so a 56% diagram leaves the copy 47% with at least 24px of
           air from 861px up. */
        .ncx-hero .net{position:absolute;right:0;top:50%;transform:translateY(-50%);
          width:min(640px,56%);height:auto;z-index:-1;pointer-events:none}
        @media (min-width:861px){
          .ncx-hero h1{max-width:min(16ch,47%)}
          .ncx-hero .hero-p{max-width:min(54ch,47%)}
        }
        .ncx-hero .ln{stroke-dasharray:3 9;animation:ncxFlow 1.4s linear infinite}
        @keyframes ncxFlow{to{stroke-dashoffset:-24}}
        .ncx-hero .ncx-pr{transform-box:fill-box;transform-origin:center;animation:ncxPing 3.2s ease-out infinite}
        @keyframes ncxPing{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.1);opacity:0}}
        @media (max-width:860px){
          .ncx-hero{padding:60px 0 72px}
          .ncx-hero .net{right:-170px;width:min(640px,72vw);opacity:.32}
        }
        @media (prefers-reduced-motion:reduce){
          .ncx-hero *,.ncx-hero *::before,.ncx-hero *::after{animation:none!important}
        }
      `}</style>

      <div className="wrap ncx-container">
        {slotNodes.length > 0 ? (
          <svg className="net" viewBox="0 0 600 420" aria-hidden="true" focusable="false">
            <g fill="none" strokeWidth={1.6} strokeLinecap="round" stroke="rgba(26,32,53,.28)">
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
              <circle className="ncx-pr" r={32} fill="none" stroke="var(--ncx-crimson)" strokeWidth={2} />
              <g transform="scale(2.4) translate(-13 -13)">
                <circle cx={13} cy={13} r={13} fill="var(--ncx-crimson)" />
                <path d="M13 6c-2.5 0-4.5 2-4.5 4.5 0 3.2 4.5 8 4.5 8s4.5-4.8 4.5-8C17.5 8 15.5 6 13 6z" fill="var(--ncx-on-navy)" />
                <circle cx={13} cy={10.6} r={1.8} fill="var(--ncx-crimson)" />
              </g>
            </g>
            {slotNodes.map((node, i) => (
              <NodeBadge key={i} node={node} x={SLOTS[i][0]} y={SLOTS[i][1]} i={i} />
            ))}
          </svg>
        ) : null}
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
