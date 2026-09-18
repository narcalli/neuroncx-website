import React from 'react'

type Props = {
  stats?: { value?: string | null; label?: string | null; id?: string | null }[] | null
  note?: string | null
}

export const StatBandBlock: React.FC<Props> = ({ stats, note }) => {
  const items = stats || []
  if (!items.length) return null

  return (
    <section className="ncx-band">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-band{--crimson:#C62828;
          background:var(--crimson);color:#fff;padding:72px 0;
          font-family:Inter,Arial,sans-serif;text-align:center}
        .ncx-band .inner{max-width:1180px;margin:0 auto;padding:0 32px}
        .ncx-band .grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(200px,1fr));
          gap:38px 24px;align-items:start}
        .ncx-band .value{font-family:Poppins,Arial,sans-serif;font-weight:700;
          font-size:clamp(2.2rem,4vw,3.2rem);line-height:1.05;letter-spacing:-.02em}
        .ncx-band .label{margin-top:10px;font-size:.98rem;color:rgba(255,255,255,.82)}
        .ncx-band .note{margin:44px 0 0;font-size:.86rem;color:rgba(255,255,255,.66)}
        @media(max-width:900px){
          .ncx-band{padding:48px 0}
          .ncx-band .inner{padding:0 20px}
          .ncx-band .grid{gap:28px 18px}
          .ncx-band .note{margin-top:30px}
        }
      `}</style>

      <div className="inner">
        <div className="grid">
          {items.map((s, i) => (
            <div key={s.id || i}>
              <div className="value">{s.value}</div>
              <div className="label">{s.label}</div>
            </div>
          ))}
        </div>
        {note ? <p className="note">{note}</p> : null}
      </div>
    </section>
  )
}
