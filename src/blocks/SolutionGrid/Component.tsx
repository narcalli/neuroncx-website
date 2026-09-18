import React from 'react'
import Link from 'next/link'

type Item = { label?: string | null; href?: string | null; id?: string | null }
type Group = { title?: string | null; items?: Item[] | null; id?: string | null }

type Props = {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
  groups?: Group[] | null
}

export const SolutionGridBlock: React.FC<Props> = ({ eyebrow, heading, intro, groups }) => {
  const rows = (groups || []).filter((g) => (g?.items || []).length)
  if (!rows.length) return null

  return (
    <section className="ncx-sol">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-sol{--navy:#1A2035;--crimson:#C62828;--ink:#1A1A2E;--muted:#6B7280;
          --line:#E4E4EA;--cloud:#F5F5F7;
          background:#fff;padding:72px 0;font-family:Inter,Arial,sans-serif;color:var(--ink)}
        .ncx-sol .inner{max-width:1180px;margin:0 auto;padding:0 32px}
        .ncx-sol .eyebrow{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:.82rem;
          letter-spacing:.04em;color:var(--crimson);margin:0 0 14px}
        .ncx-sol h2{font-family:Poppins,Arial,sans-serif;font-weight:700;
          font-size:clamp(1.9rem,3.6vw,2.7rem);line-height:1.1;letter-spacing:-.02em;
          margin:0;max-width:20ch}
        .ncx-sol .intro{color:var(--muted);margin:16px 0 0;font-size:1.02rem;line-height:1.6;max-width:58ch}
        .ncx-sol .group{margin-top:42px}
        .ncx-sol h3{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:1.05rem;
          margin:0 0 16px}
        .ncx-sol .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px}
        .ncx-sol .card{display:flex;align-items:center;min-height:82px;
          border:1px solid var(--line);border-radius:12px;padding:18px 20px;background:#fff;
          font-size:.98rem;line-height:1.4;color:var(--ink);text-decoration:none;
          transition:border-color .2s,transform .2s,box-shadow .2s}
        .ncx-sol a.card:hover{border-color:var(--crimson);transform:translateY(-2px);
          box-shadow:0 12px 24px -16px rgba(15,18,32,.5)}
        .ncx-sol a.card:focus-visible{outline:2px solid var(--crimson);outline-offset:2px}
        @media(max-width:900px){
          .ncx-sol{padding:48px 0}
          .ncx-sol .inner{padding:0 20px}
          .ncx-sol h2{max-width:100%}
          .ncx-sol .group{margin-top:30px}
          .ncx-sol .cards{grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
          .ncx-sol .card{min-height:68px;padding:14px 16px;font-size:.92rem}
        }
      `}</style>

      <div className="inner">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        <h2>{heading}</h2>
        {intro ? <p className="intro">{intro}</p> : null}

        {rows.map((g, i) => (
          <div className="group" key={g.id || i}>
            {g.title ? <h3>{g.title}</h3> : null}
            <div className="cards">
              {(g.items || []).map((it, j) =>
                it?.href ? (
                  <Link className="card" href={it.href} key={it.id || j}>
                    {it.label}
                  </Link>
                ) : (
                  <div className="card" key={it.id || j}>
                    {it?.label}
                  </div>
                ),
              )}
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
