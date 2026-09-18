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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-strip{--ink:#1A1A2E;--muted:#6B7280;--line:#E4E4EA;--crimson:#C62828;--cloud:#F5F5F7;
          background:#fff;border-bottom:1px solid var(--line);
          padding:26px 0;font-family:Inter,Arial,sans-serif}
        .ncx-strip .inner{max-width:1180px;margin:0 auto;padding:0 32px;
          display:flex;align-items:center;justify-content:center;gap:14px 34px;flex-wrap:wrap}
        .ncx-strip .intro{color:var(--muted);font-size:.92rem;margin:0}
        .ncx-strip .name{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:1.02rem;
          color:#9AA1B2;white-space:nowrap;transition:color .2s}
        .ncx-strip .name:hover{color:var(--ink)}
        .ncx-strip .badge{display:inline-flex;align-items:center;gap:7px;
          border:1px solid var(--line);background:var(--cloud);border-radius:100px;padding:6px 14px}
        .ncx-strip .badge b{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:.8rem;
          color:var(--crimson);letter-spacing:.02em}
        .ncx-strip .badge span{font-size:.8rem;color:var(--muted)}
        @media(max-width:900px){
          .ncx-strip{padding:22px 0}
          .ncx-strip .inner{padding:0 20px;gap:12px 20px}
          .ncx-strip .name{font-size:.94rem}
        }
      `}</style>

      <div className="inner">
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
