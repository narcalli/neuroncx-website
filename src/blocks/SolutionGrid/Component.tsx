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
        .ncx-sol{
          /* No band: the page is paper and this section sits on it. A hairline
             carries the separation the white band used to. */
          border-block:1px solid var(--ncx-rule-soft);padding:72px 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-sol .eyebrow{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.82rem;
          letter-spacing:.04em;color:var(--ncx-crimson-ink);margin:0 0 14px}
        .ncx-sol h2{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
          font-size:clamp(1.9rem,3.6vw,2.7rem);line-height:1.1;letter-spacing:-.02em;
          margin:0;max-width:20ch}
        .ncx-sol .intro{color:var(--ncx-muted);margin:16px 0 0;font-size:1.02rem;line-height:1.6;max-width:58ch}
        .ncx-sol .group{margin-top:42px}
        .ncx-sol h3{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:1.05rem;
          margin:0 0 16px}
        .ncx-sol .cards{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:16px}
        .ncx-sol .card{display:flex;align-items:center;min-height:82px;
          border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);padding:18px 20px;background:var(--ncx-white);
          font-size:.98rem;line-height:1.4;color:var(--ncx-body);text-decoration:none;
          transition:border-color .2s,transform .2s,box-shadow .2s}
        .ncx-sol a.card:hover{border-color:var(--ncx-hover-line);transform:translateY(-2px);
          box-shadow:0 12px 24px -16px rgba(15,18,32,.5)}
        .ncx-sol a.card:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:2px}
        @media(max-width:900px){
          .ncx-sol{padding:48px 0}
          .ncx-sol h2{max-width:100%}
          .ncx-sol .group{margin-top:30px}
          .ncx-sol .cards{grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}
          .ncx-sol .card{min-height:68px;padding:14px 16px;font-size:.92rem}
        }
      `}</style>

      <div className="inner ncx-container">
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
