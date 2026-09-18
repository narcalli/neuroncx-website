import React from 'react'

type Item = { title?: string | null; description?: string | null; id?: string | null }

type Props = {
  label?: string | null
  heading?: string | null
  items?: Item[] | null
}

export const BenefitsBlock: React.FC<Props> = ({ label, heading, items }) => {
  const list = items || []
  if (!list.length) return null

  return (
    <section className="ncx-benefits">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-benefits{--ink:#1A1A2E;--soft:#4A5573;--crimson:#C62828;--rule:#DFE3EA;
          max-width:1120px;margin:0 auto;padding:48px 32px;
          font-family:Inter,Arial,sans-serif;color:var(--ink)}
        .ncx-benefits .label{font-family:Poppins,Arial,sans-serif;font-size:14px;
          color:var(--crimson);margin:0 0 12px}
        .ncx-benefits h2{font-family:Poppins,Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,38px);letter-spacing:-.03em;margin:0;max-width:24ch}
        .ncx-benefits .grid{margin-top:44px;display:grid;
          grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:36px 48px}
        .ncx-benefits h3{font-family:Poppins,Arial,sans-serif;font-weight:500;
          font-size:19px;letter-spacing:-.015em;margin:0;padding-top:16px;border-top:2px solid var(--ink)}
        .ncx-benefits p{margin:10px 0 0;color:var(--soft);font-size:17px;line-height:1.6;max-width:44ch}
        @media(max-width:820px){.ncx-benefits{padding:36px 20px}
          .ncx-benefits .grid{margin-top:32px;gap:28px}}
      `}</style>

      {label ? <p className="label">{label}</p> : null}
      {heading ? <h2>{heading}</h2> : null}

      <div className="grid">
        {list.map((b, i) => (
          <div key={b.id || i}>
            <h3>{b.title}</h3>
            {b.description ? <p>{b.description}</p> : null}
          </div>
        ))}
      </div>
    </section>
  )
}
