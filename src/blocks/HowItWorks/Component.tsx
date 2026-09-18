import React from 'react'

type Step = { title?: string | null; description?: string | null; id?: string | null }

type Props = {
  label?: string | null
  heading?: string | null
  intro?: string | null
  steps?: Step[] | null
  ctaLabel?: string | null
  ctaLink?: string | null
}

export const HowItWorksBlock: React.FC<Props> = ({
  label, heading, intro, steps, ctaLabel, ctaLink,
}) => {
  const items = steps || []

  return (
    <section className="ncx-how">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-how{--ink:#1A1A2E;--soft:#4A5573;--crimson:#C62828;--rule:#DFE3EA;--paper:#F5F5F7;
          max-width:1120px;margin:0 auto;padding:64px 32px;
          font-family:Inter,Arial,sans-serif;color:var(--ink);border-top:1px solid var(--rule)}
        .ncx-how .label{font-family:Poppins,Arial,sans-serif;font-size:14px;
          color:var(--crimson);margin:0 0 12px}
        .ncx-how h2{font-family:Poppins,Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,36px);letter-spacing:-.025em;margin:0;max-width:22ch}
        .ncx-how .intro{color:var(--soft);margin:14px 0 0;max-width:62ch;font-size:17px}
        .ncx-how .steps{margin-top:48px;display:grid;
          grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:32px}
        .ncx-how .num{font-family:Poppins,Arial,sans-serif;font-weight:700;
          font-size:14px;color:var(--crimson);display:block;margin-bottom:14px;
          padding-bottom:14px;border-bottom:1px solid var(--rule)}
        .ncx-how h3{font-family:Poppins,Arial,sans-serif;font-weight:500;
          font-size:21px;letter-spacing:-.02em;margin:0 0 10px}
        .ncx-how p.desc{color:var(--soft);font-size:16px;line-height:1.6;margin:0}
        .ncx-how .cta{margin-top:44px}
        .ncx-how .btn{font-family:Poppins,Arial,sans-serif;font-size:15px;
          font-weight:500;padding:12px 22px;border-radius:6px;text-decoration:none;
          background:var(--ink);color:#fff;display:inline-block}
        @media(max-width:900px){.ncx-how{padding:44px 20px}.ncx-how .steps{gap:28px;margin-top:34px}}
      `}</style>

      {label ? <p className="label">{label}</p> : null}
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className="intro">{intro}</p> : null}

      <div className="steps">
        {items.map((step, i) => (
          <div key={step.id || i}>
            <span className="num">{String(i + 1).padStart(2, '0')}</span>
            <h3>{step.title}</h3>
            <p className="desc">{step.description}</p>
          </div>
        ))}
      </div>

      {ctaLabel ? (
        <div className="cta">
          <a className="btn" href={ctaLink || '#'}>{ctaLabel}</a>
        </div>
      ) : null}
    </section>
  )
}
