import React from 'react'

type Case = {
  sector?: string | null
  title?: string | null
  description?: string | null
  outcome?: string | null
  id?: string | null
}

type Props = {
  label?: string | null
  heading?: string | null
  intro?: string | null
  cases?: Case[] | null
}

export const UseCasesBlock: React.FC<Props> = ({ label, heading, intro, cases }) => {
  const items = cases || []
  if (!items.length) return null

  return (
    <section className="ncx-usecases">
      <style>{`
        .ncx-usecases{
          background:var(--ncx-cloud);padding:48px 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-usecases .label{font-family:var(--font-display),Arial,sans-serif;font-size:14px;
          color:var(--ncx-crimson-ink);margin:0 0 12px}
        .ncx-usecases h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,38px);letter-spacing:-.03em;margin:0;max-width:22ch}
        .ncx-usecases .intro{color:var(--ncx-muted);margin:14px 0 0;max-width:64ch;font-size:18px;line-height:1.6}
        .ncx-usecases .grid{margin-top:44px;display:grid;
          grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}
        .ncx-usecases .card{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);padding:26px 24px}
        .ncx-usecases .sector{font-family:var(--font-display),Arial,sans-serif;font-size:13px;
          color:var(--ncx-muted);margin:0 0 10px}
        .ncx-usecases h3{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:20px;letter-spacing:-.015em;margin:0;line-height:1.3}
        .ncx-usecases .desc{margin:12px 0 0;color:var(--ncx-muted);font-size:17px;line-height:1.6}
        .ncx-usecases .outcome{margin:18px 0 0;padding-top:16px;border-top:1px solid var(--ncx-rule);
          font-family:var(--font-display),Arial,sans-serif;font-size:15px;color:var(--ncx-body)}
        @media(max-width:820px){.ncx-usecases{padding:36px 0}
          }
      `}</style>

      <div className="inner ncx-container">
        {label ? <p className="label">{label}</p> : null}
        {heading ? <h2>{heading}</h2> : null}
        {intro ? <p className="intro">{intro}</p> : null}

        <div className="grid">
          {items.map((c, i) => (
            <div className="card" key={c.id || i}>
              {c.sector ? <p className="sector">{c.sector}</p> : null}
              <h3>{c.title}</h3>
              {c.description ? <p className="desc">{c.description}</p> : null}
              {c.outcome ? <p className="outcome">{c.outcome}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
