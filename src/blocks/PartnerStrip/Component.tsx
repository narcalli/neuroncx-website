import React from 'react'

type Props = {
  intro?: string | null
  partners?: { name?: string | null; id?: string | null }[] | null
  badges?: { name?: string | null; suffix?: string | null; id?: string | null }[] | null
}

export const PartnerStripBlock: React.FC<Props> = ({ intro, partners, badges }) => {
  const names = partners || []
  const marks = badges || []
  if (!names.length && !marks.length && !intro) return null

  return (
    <section className="ncx-strip">
      <style>{`
        .ncx-strip{
          /* No band: the page is paper. The existing bottom hairline is the only
             separation this strip needs. */
          border-bottom:1px solid var(--ncx-rule);
          padding:26px 0;font-family:var(--font-body),Arial,sans-serif}
        .ncx-strip .inner{display:flex;align-items:center;justify-content:center;gap:14px 34px;flex-wrap:wrap}
        .ncx-strip .intro{color:var(--ncx-muted);font-size:.92rem;margin:0}
        .ncx-strip .name{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:1.02rem;
          color:var(--ncx-faint);white-space:nowrap;transition:color .2s}
        .ncx-strip .name:hover{color:var(--ncx-body)}
        .ncx-strip .badge{display:inline-flex;align-items:center;gap:7px;
          border:1px solid var(--ncx-rule);background:var(--ncx-cloud);border-radius:100px;padding:6px 14px}
        .ncx-strip .badge b{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:.8rem;
          color:var(--ncx-crimson);letter-spacing:.02em}
        .ncx-strip .badge span{font-size:.8rem;color:var(--ncx-muted)}
        @media(max-width:900px){
          .ncx-strip{padding:22px 0}
          .ncx-strip .inner{gap:12px 20px}
          .ncx-strip .name{font-size:.94rem}
        }
      `}</style>

      <div className="inner ncx-container">
        {intro ? <p className="intro">{intro}</p> : null}

        {names.map((p, i) => (
          <span className="name" key={p.id || i}>
            {p.name}
          </span>
        ))}

        {marks.map((b, i) => (
          <span className="badge" key={b.id || i}>
            <b>{b.name}</b>
            {b.suffix ? <span>{b.suffix}</span> : null}
          </span>
        ))}
      </div>
    </section>
  )
}
