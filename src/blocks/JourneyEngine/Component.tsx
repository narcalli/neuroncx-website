'use client'

import React, { useEffect, useRef, useState } from 'react'

type Stage = { label?: string | null; icon?: string | null; id?: string | null }
type Detail = { title?: string | null; description?: string | null; id?: string | null }
type Industry = { name?: string | null; details?: Detail[] | null; id?: string | null }

type Props = {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
  stages?: Stage[] | null
  industries?: Industry[] | null
}

const ICONS: Record<string, React.ReactNode> = {
  message: <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />,
  check: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="4" width="18" height="18" rx="2" />
      <path d="M16 2v4M8 2v4M3 10h18" />
    </>
  ),
  card: (
    <>
      <rect x="2" y="5" width="20" height="14" rx="2" />
      <path d="M2 10h20" />
    </>
  ),
  document: (
    <>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M9 15l2 2 4-4" />
    </>
  ),
  chat: (
    <>
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
      <path d="M8 9h8M8 13h5" />
    </>
  ),
  refresh: (
    <>
      <path d="M3 12a9 9 0 1 0 3-6.7" />
      <path d="M3 4v5h5" />
    </>
  ),
}

export const JourneyEngineBlock: React.FC<Props> = ({
  eyebrow,
  heading,
  intro,
  stages,
  industries,
}) => {
  const steps = stages || []
  const tabs = industries || []
  const [tab, setTab] = useState(0)
  const [step, setStep] = useState(0)
  const [manual, setManual] = useState(false)
  const wrapRef = useRef<HTMLDivElement | null>(null)

  const count = steps.length

  // Walks the stages on its own, but only while the section is on screen and
  // only until the visitor clicks something — then it is theirs to drive.
  useEffect(() => {
    if (!count || manual) return

    let timer: ReturnType<typeof setInterval> | null = null
    const start = () => {
      if (timer) return
      timer = setInterval(() => setStep((s) => (s + 1) % count), 2200)
    }
    const stop = () => {
      if (timer) clearInterval(timer)
      timer = null
    }

    const io = new IntersectionObserver(
      ([e]) => (e.isIntersecting ? start() : stop()),
      { threshold: 0.35 },
    )
    if (wrapRef.current) io.observe(wrapRef.current)

    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    if (reduce.matches) {
      stop()
      io.disconnect()
      return
    }

    return () => {
      stop()
      io.disconnect()
    }
  }, [count, manual, tab])

  if (!steps.length || !tabs.length) return null

  const details = (tabs[tab]?.details as Detail[]) || []
  const detail = details[step]

  return (
    <section className="ncx-journey">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-journey{--navy:#1A2035;--crimson:#C62828;--ink:#1A1A2E;--muted:#6B7280;
          --line:#E4E4EA;--cloud:#F5F5F7;
          background:#fff;padding:72px 0;font-family:Inter,Arial,sans-serif;color:var(--ink)}
        .ncx-journey .inner{max-width:1180px;margin:0 auto;padding:0 32px}
        .ncx-journey .eyebrow{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:.82rem;
          letter-spacing:.04em;color:var(--crimson);margin:0 0 14px}
        .ncx-journey h2{font-family:Poppins,Arial,sans-serif;font-weight:700;
          font-size:clamp(1.9rem,3.6vw,2.7rem);line-height:1.1;letter-spacing:-.02em;
          margin:0;max-width:18ch}
        .ncx-journey .intro{color:var(--muted);margin:16px 0 0;font-size:1.02rem;line-height:1.6;
          max-width:58ch}

        .ncx-journey .tabs{display:flex;flex-wrap:wrap;gap:10px;margin-top:28px}
        .ncx-journey .tab{font-family:Poppins,Arial,sans-serif;font-size:.92rem;font-weight:600;
          padding:11px 20px;border-radius:999px;border:1px solid var(--line);background:#fff;
          color:var(--muted);cursor:pointer;transition:all .2s}
        .ncx-journey .tab:hover{border-color:#C9CDD8;color:var(--ink)}
        .ncx-journey .tab.on{background:var(--navy);border-color:var(--navy);color:#fff}
        .ncx-journey .tab:focus-visible{outline:2px solid var(--crimson);outline-offset:2px}

        .ncx-journey .rail{position:relative;margin-top:44px;display:flex;
          justify-content:space-between;gap:6px;overflow-x:auto;padding-bottom:4px}
        .ncx-journey .rail:before{content:"";position:absolute;left:28px;right:28px;top:29px;
          height:2px;background:var(--line)}
        .ncx-journey .fill{position:absolute;left:28px;top:29px;height:2px;background:var(--crimson);
          transition:width .5s cubic-bezier(.22,.61,.36,1);z-index:1}
        .ncx-journey .stage{position:relative;z-index:2;flex:1;min-width:92px;background:none;
          border:0;padding:0;cursor:pointer;display:flex;flex-direction:column;align-items:center;
          gap:10px;font-family:Poppins,Arial,sans-serif;font-size:.82rem;font-weight:600;
          color:var(--muted);transition:color .2s}
        .ncx-journey .stage:hover{color:var(--ink)}
        .ncx-journey .stage .ring{width:58px;height:58px;border-radius:50%;background:#fff;
          border:2px solid var(--line);color:#B9BEC9;display:flex;align-items:center;
          justify-content:center;
          transition:background .25s,color .25s,border-color .25s,transform .25s}
        .ncx-journey .stage.done .ring{border-color:var(--crimson);color:var(--crimson)}
        .ncx-journey .stage .ring svg{width:22px;height:22px}
        .ncx-journey .stage.done{color:var(--ink)}
        .ncx-journey .stage.on{color:var(--ink)}
        .ncx-journey .stage.on .ring{background:var(--crimson);color:#fff;transform:scale(1.06)}
        .ncx-journey .stage:focus-visible{outline:2px solid var(--crimson);outline-offset:4px;
          border-radius:10px}

        .ncx-journey .detail{margin-top:34px;background:var(--cloud);border:1px solid var(--line);
          border-radius:16px;padding:28px;display:flex;align-items:flex-start;gap:22px}
        .ncx-journey .detail .mark{flex:0 0 54px;width:54px;height:54px;border-radius:14px;
          background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center}
        .ncx-journey .detail .mark svg{width:24px;height:24px}
        .ncx-journey .detail h3{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:1.2rem;
          margin:0}
        .ncx-journey .detail p{margin:8px 0 0;color:var(--muted);font-size:1rem;line-height:1.6}

        @media(max-width:900px){
          .ncx-journey{padding:48px 0}
          .ncx-journey .inner{padding:0 20px}
          .ncx-journey h2{max-width:100%}
          .ncx-journey .rail{justify-content:flex-start}
          .ncx-journey .rail:before{display:none}
          .ncx-journey .stage{min-width:84px}
          .ncx-journey .stage .ring{width:48px;height:48px}
          .ncx-journey .detail{padding:20px;gap:16px;flex-direction:column}
        }
        @media(prefers-reduced-motion:reduce){.ncx-journey *{transition:none!important}}
      `}</style>

      <div className="inner">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{heading}</h2>
        {intro ? <p className="intro">{intro}</p> : null}

        <div className="tabs" role="tablist">
          {tabs.map((t, i) => (
            <button
              type="button"
              role="tab"
              aria-selected={i === tab}
              className={`tab${i === tab ? ' on' : ''}`}
              key={t.id || i}
              onClick={() => {
                setTab(i)
                setStep(0)
                setManual(true)
              }}
            >
              {t.name}
            </button>
          ))}
        </div>

        <div className="rail" ref={wrapRef}>
          <span
            className="fill"
            style={{
              width: count > 1 ? `calc((100% - 56px) * ${step / (count - 1)})` : '0px',
            }}
            aria-hidden="true"
          />
          {steps.map((s, i) => (
            <button
              type="button"
              className={`stage${i <= step ? ' done' : ''}${i === step ? ' on' : ''}`}
              key={s.id || i}
              onClick={() => {
                setStep(i)
                setManual(true)
              }}
              aria-label={`${s.label} stage`}
            >
              <span className="ring">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  {ICONS[s.icon || 'message'] || ICONS.message}
                </svg>
              </span>
              {s.label}
            </button>
          ))}
        </div>

        {detail ? (
          <div className="detail">
            <span className="mark">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {ICONS[steps[step]?.icon || 'message'] || ICONS.message}
              </svg>
            </span>
            <div>
              <h3>{detail.title}</h3>
              <p>{detail.description}</p>
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
