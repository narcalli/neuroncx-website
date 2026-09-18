import React from 'react'

type Product = {
  name?: string | null
  summary?: string | null
  points?: { text?: string | null; id?: string | null }[] | null
  linkLabel?: string | null
  linkHref?: string | null
  id?: string | null
}

type Props = {
  label?: string | null
  heading?: string | null
  intro?: string | null
  products?: Product[] | null
}

export const ProductSuiteBlock: React.FC<Props> = ({ label, heading, intro, products }) => {
  const items = products || []
  if (!items.length) return null

  return (
    <section className="ncx-suite">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-suite{--ink:#1A1A2E;--soft:#4A5573;--crimson:#C62828;--violet:#6E5BF2;
          --cyan:#18B6AE;--rule:#E4E7F0;--mist:#F5F5F7;
          max-width:1120px;margin:0 auto;padding:56px 32px;
          font-family:Inter,Arial,sans-serif;color:var(--ink)}
        .ncx-suite .label{font-family:Poppins,Arial,sans-serif;font-size:14px;
          margin:0 0 12px;background:linear-gradient(90deg,var(--crimson),var(--violet));
          -webkit-background-clip:text;background-clip:text;color:transparent}
        .ncx-suite h2{font-family:Poppins,Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,40px);letter-spacing:-.03em;margin:0;max-width:22ch}
        .ncx-suite .intro{color:var(--soft);margin:14px 0 0;max-width:62ch;font-size:18px;line-height:1.6}
        .ncx-suite .grid{margin-top:44px;display:grid;
          grid-template-columns:repeat(auto-fit,minmax(290px,1fr));gap:18px}
        .ncx-suite .card{border-radius:16px;padding:1px;
          background:linear-gradient(160deg,rgba(110,91,242,.35),rgba(24,182,174,.18),var(--rule))}
        .ncx-suite .in{background:#fff;border-radius:15px;padding:26px 24px;height:100%}
        .ncx-suite h3{font-family:Poppins,Arial,sans-serif;font-weight:500;
          font-size:21px;letter-spacing:-.02em;margin:0}
        .ncx-suite .summary{color:var(--soft);font-size:16px;line-height:1.6;margin:12px 0 0}
        .ncx-suite ul{margin:18px 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:8px}
        .ncx-suite li{font-family:Poppins,Arial,sans-serif;font-size:12.5px;
          color:var(--soft);border:1px solid var(--rule);background:var(--mist);
          padding:5px 11px;border-radius:999px}
        .ncx-suite .more{display:inline-block;margin-top:20px;
          font-family:Poppins,Arial,sans-serif;font-size:14px;
          color:var(--crimson);text-decoration:none;border-bottom:1px solid transparent}
        .ncx-suite .more:hover{border-bottom-color:var(--crimson)}
        .ncx-suite .more:focus-visible{outline:2px solid var(--violet);outline-offset:3px}
        @media(max-width:900px){.ncx-suite{padding:40px 20px}
          .ncx-suite .grid{margin-top:32px}}
      `}</style>

      {label ? <p className="label">{label}</p> : null}
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className="intro">{intro}</p> : null}

      <div className="grid">
        {items.map((p, i) => (
          <div className="card" key={p.id || i}>
            <div className="in">
              <h3>{p.name}</h3>
              {p.summary ? <p className="summary">{p.summary}</p> : null}
              {p.points && p.points.length ? (
                <ul>
                  {p.points.map((pt, j) => (
                    <li key={pt.id || j}>{pt.text}</li>
                  ))}
                </ul>
              ) : null}
              {p.linkHref ? (
                <a className="more" href={p.linkHref}>
                  {p.linkLabel || 'Read more'}
                </a>
              ) : null}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
