'use client'

import React, { useEffect, useRef, useState } from 'react'
import { BlockIcon } from '@/components/BlockIcon'

type Layer = {
  title?: string | null
  description?: string | null
  tag?: string | null
  icon?: string | null
  id?: string | null
}

type Props = {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
  layers?: Layer[] | null
}

export const PlatformLayersBlock: React.FC<Props> = ({ eyebrow, heading, intro, layers }) => {
  const items = layers || []
  const [active, setActive] = useState(0)
  const stepRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    if (!items.length) return

    // Whichever step is crossing the middle of the viewport is the active layer.
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            const i = Number((e.target as HTMLElement).dataset.index)
            if (!Number.isNaN(i)) setActive(i)
          }
        })
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    )

    stepRefs.current.forEach((el) => el && io.observe(el))
    return () => io.disconnect()
  }, [items.length])

  if (!items.length) return null

  return (
    <section className="ncx-layers">
      <style>{`
        .ncx-layers{background:var(--ncx-navy);color:var(--ncx-on-navy);font-family:var(--font-body),Arial,sans-serif;padding:72px 0 0}
        .ncx-layers .eyebrow{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.82rem;
          letter-spacing:.04em;color:var(--ncx-crimson-on-navy);margin:0 0 14px}
        .ncx-layers h2{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
          font-size:clamp(1.9rem,3.6vw,2.8rem);line-height:1.1;letter-spacing:-.02em;
          margin:0;max-width:18ch}
        .ncx-layers .intro{color:var(--ncx-on-navy-soft);margin:18px 0 0;font-size:1.02rem}

        .ncx-layers .scroller{position:relative;margin-top:44px}
        .ncx-layers .stage{position:sticky;top:96px;height:min(62vh,440px)}
        .ncx-layers .card{position:absolute;inset:0;background:var(--ncx-navy-tint);
          border:1px solid var(--ncx-on-navy-rule);border-radius:22px;padding:44px;
          display:flex;align-items:center;gap:30px;
          opacity:0;transform:translateY(18px);transition:opacity .45s ease,transform .45s ease;
          pointer-events:none}
        .ncx-layers .card.on{opacity:1;transform:translateY(0);pointer-events:auto}
        .ncx-layers .badge{flex:0 0 68px;width:68px;height:68px;border-radius:18px;
          background:var(--ncx-crimson);display:flex;align-items:center;justify-content:center}
        .ncx-layers .badge svg{width:30px;height:30px}
        .ncx-layers h3{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:1.5rem;
          margin:0;letter-spacing:-.01em}
        .ncx-layers .desc{margin:12px 0 0;color:var(--ncx-on-navy-soft);font-size:1.02rem;
          line-height:1.6;max-width:56ch}
        .ncx-layers .tag{display:inline-block;margin-top:16px;font-family:var(--font-display),Arial,sans-serif;
          font-size:.76rem;font-weight:600;color:var(--ncx-crimson-on-navy);background:var(--ncx-crimson-wash-on-navy);
          border-radius:999px;padding:6px 14px}
        .ncx-layers .step{height:45vh}
        .ncx-layers .dots{display:flex;justify-content:center;gap:9px;padding:26px 0 72px}
        .ncx-layers .dot{width:9px;height:9px;border-radius:50%;background:var(--ncx-on-navy-rule-strong);
          transition:background .3s,transform .3s}
        .ncx-layers .dot.on{background:var(--ncx-crimson);transform:scale(1.25)}

        @media(max-width:900px){
          .ncx-layers{padding:48px 0 0}
          .ncx-layers .stage{position:static;height:auto}
          .ncx-layers .card{position:static;opacity:1;transform:none;pointer-events:auto;
            padding:26px;gap:18px;flex-direction:column;align-items:flex-start;margin-bottom:16px}
          .ncx-layers .step{height:auto}
          .ncx-layers .dots{display:none}
        }
        @media(prefers-reduced-motion:reduce){.ncx-layers .card{transition:none}}
      `}</style>

      <div className="inner ncx-container">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{heading}</h2>
        {intro ? <p className="intro">{intro}</p> : null}

        <div className="scroller">
          <div className="stage">
            {items.map((l, i) => (
              <article className={`card${i === active ? ' on' : ''}`} key={l.id || i}>
                <span className="badge">
                  <BlockIcon name={l.icon} fallback="message" round />
                </span>
                <div>
                  <h3>{l.title}</h3>
                  <p className="desc">{l.description}</p>
                  {l.tag ? <span className="tag">{l.tag}</span> : null}
                </div>
              </article>
            ))}
          </div>

          {/* Invisible scroll steps — one per layer — drive which card is shown. */}
          {items.map((l, i) => (
            <div
              className="step"
              key={`step-${l.id || i}`}
              data-index={i}
              ref={(el) => {
                stepRefs.current[i] = el
              }}
              aria-hidden="true"
            />
          ))}
        </div>

        <div className="dots">
          {items.map((l, i) => (
            <span className={`dot${i === active ? ' on' : ''}`} key={`dot-${l.id || i}`} />
          ))}
        </div>
      </div>
    </section>
  )
}
