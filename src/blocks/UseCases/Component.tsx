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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-usecases{--ink:#1A1A2E;--soft:#4A5573;--crimson:#C62828;--rule:#DFE3EA;--paper:#F5F5F7;
          background:var(--paper);padding:48px 0;font-family:Inter,Arial,sans-serif;color:var(--ink)}
        .ncx-usecases .inner{max-width:1120px;margin:0 auto;padding:0 32px}
        .ncx-usecases .label{font-family:Poppins,Arial,sans-serif;font-size:14px;
          color:var(--crimson);margin:0 0 12px}
        .ncx-usecases h2{font-family:Poppins,Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,38px);letter-spacing:-.03em;margin:0;max-width:22ch}
        .ncx-usecases .intro{color:var(--soft);margin:14px 0 0;max-width:64ch;font-size:18px;line-height:1.6}
        .ncx-usecases .grid{margin-top:44px;display:grid;
          grid-template-columns:repeat(auto-fit,minmax(300px,1fr));gap:20px}
        .ncx-usecases .card{background:#fff;border:1px solid var(--rule);border-radius:12px;padding:26px 24px}
        .ncx-usecases .sector{font-family:Poppins,Arial,sans-serif;font-size:13px;
          color:var(--soft);margin:0 0 10px}
        .ncx-usecases h3{font-family:Poppins,Arial,sans-serif;font-weight:500;
          font-size:20px;letter-spacing:-.015em;margin:0;line-height:1.3}
        .ncx-usecases .desc{margin:12px 0 0;color:var(--soft);font-size:17px;line-height:1.6}
        .ncx-usecases .outcome{margin:18px 0 0;padding-top:16px;border-top:1px solid var(--rule);
          font-family:Poppins,Arial,sans-serif;font-size:15px;color:var(--ink)}
        @media(max-width:820px){.ncx-usecases{padding:36px 0}
          .ncx-usecases .inner{padding:0 20px}}
      `}</style>

      <div className="inner">
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
