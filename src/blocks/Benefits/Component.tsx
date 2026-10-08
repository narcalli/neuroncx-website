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
    <section className="ncx-benefits ncx-container">
      <style>{`
        .ncx-benefits{
          padding-block:48px;
          font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-benefits .label{font-family:var(--font-display),Arial,sans-serif;font-size:14px;
          color:var(--ncx-crimson-ink);margin:0 0 12px}
        .ncx-benefits h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,38px);letter-spacing:-.03em;margin:0;max-width:24ch}
        .ncx-benefits .grid{margin-top:44px;display:grid;
          grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:36px 48px}
        .ncx-benefits h3{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:19px;letter-spacing:-.015em;margin:0;padding-top:16px;border-top:2px solid var(--ncx-body)}
        .ncx-benefits p{margin:10px 0 0;color:var(--ncx-muted);font-size:17px;line-height:1.6;max-width:44ch}
        @media(max-width:820px){.ncx-benefits{padding-block:36px}
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
