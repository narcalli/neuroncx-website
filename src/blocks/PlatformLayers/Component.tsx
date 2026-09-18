'use client'

import React, { useEffect, useRef, useState } from 'react'

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

const ICONS: Record<string, React.ReactNode> = {
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  bolt: <path d="M13 2L4.5 13H11l-1 9 8.5-11H12l1-9z" />,
  layers: (
    <>
      <path d="M12 2l9 5-9 5-9-5 9-5z" />
      <path d="M3 12l9 5 9-5M3 17l9 5 9-5" />
    </>
  ),
  gauge: (
    <>
      <path d="M12 21a9 9 0 1 1 9-9" />
      <path d="M12 12l5-3" />
    </>
  ),
  plug: (
    <>
      <path d="M9 2v6M15 2v6" />
      <path d="M6 8h12v3a6 6 0 0 1-12 0V8zM12 17v5" />
    </>
  ),
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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-layers{--navy:#1A2035;--navy-2:#252D4A;--crimson:#C62828;--line:rgba(255,255,255,.1);
          background:var(--navy);color:#fff;font-family:Inter,Arial,sans-serif;padding:72px 0 0}
        .ncx-layers .inner{max-width:1180px;margin:0 auto;padding:0 32px}
        .ncx-layers .eyebrow{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:.82rem;
          letter-spacing:.04em;color:#FF8F8F;margin:0 0 14px}
        .ncx-layers h2{font-family:Poppins,Arial,sans-serif;font-weight:700;
          font-size:clamp(1.9rem,3.6vw,2.8rem);line-height:1.1;letter-spacing:-.02em;
          margin:0;max-width:18ch}
        .ncx-layers .intro{color:rgba(255,255,255,.7);margin:18px 0 0;font-size:1.02rem}

        .ncx-layers .scroller{position:relative;margin-top:44px}
        .ncx-layers .stage{position:sticky;top:96px;height:min(62vh,440px)}
        .ncx-layers .card{position:absolute;inset:0;background:var(--navy-2);
          border:1px solid var(--line);border-radius:22px;padding:44px;
          display:flex;align-items:center;gap:30px;
          opacity:0;transform:translateY(18px);transition:opacity .45s ease,transform .45s ease;
          pointer-events:none}
        .ncx-layers .card.on{opacity:1;transform:translateY(0);pointer-events:auto}
        .ncx-layers .badge{flex:0 0 68px;width:68px;height:68px;border-radius:18px;
          background:var(--crimson);display:flex;align-items:center;justify-content:center;
          box-shadow:0 14px 30px -12px rgba(198,40,40,.8)}
        .ncx-layers .badge svg{width:30px;height:30px}
        .ncx-layers h3{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:1.5rem;
          margin:0;letter-spacing:-.01em}
        .ncx-layers .desc{margin:12px 0 0;color:rgba(255,255,255,.72);font-size:1.02rem;
          line-height:1.6;max-width:56ch}
        .ncx-layers .tag{display:inline-block;margin-top:16px;font-family:Poppins,Arial,sans-serif;
          font-size:.76rem;font-weight:600;color:#FF8F8F;background:rgba(198,40,40,.22);
          border-radius:999px;padding:6px 14px}
        .ncx-layers .step{height:78vh}
        .ncx-layers .dots{display:flex;justify-content:center;gap:9px;padding:26px 0 72px}
        .ncx-layers .dot{width:9px;height:9px;border-radius:50%;background:rgba(255,255,255,.22);
          transition:background .3s,transform .3s}
        .ncx-layers .dot.on{background:var(--crimson);transform:scale(1.25)}

        @media(max-width:900px){
          .ncx-layers{padding:48px 0 0}
          .ncx-layers .inner{padding:0 20px}
          .ncx-layers .stage{position:static;height:auto}
          .ncx-layers .card{position:static;opacity:1;transform:none;pointer-events:auto;
            padding:26px;gap:18px;flex-direction:column;align-items:flex-start;margin-bottom:16px}
          .ncx-layers .step{height:auto}
          .ncx-layers .dots{display:none}
        }
        @media(prefers-reduced-motion:reduce){.ncx-layers .card{transition:none}}
      `}</style>

      <div className="inner">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{heading}</h2>
        {intro ? <p className="intro">{intro}</p> : null}

        <div className="scroller">
          <div className="stage">
            {items.map((l, i) => (
              <article className={`card${i === active ? ' on' : ''}`} key={l.id || i}>
                <span className="badge">
                  <svg viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    {ICONS[l.icon || 'message'] || ICONS.message}
                  </svg>
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
