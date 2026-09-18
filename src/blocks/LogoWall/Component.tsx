import React from 'react'

type LogoItem = {
  name?: string | null
  logo?: any
  scale?: number | null
  id?: string | null
}

type Props = {
  label?: string | null
  heading?: string | null
  intro?: string | null
  display?: 'wordmarks' | 'logos' | null
  logos?: LogoItem[] | null
}

export const LogoWallBlock: React.FC<Props> = ({ label, heading, intro, display, logos }) => {
  const asText = display !== 'logos'

  // In wordmark mode a name is enough. In logo mode the file has to have resolved.
  const items = (logos || []).filter((l) =>
    asText ? l?.name : l?.logo && typeof l.logo === 'object' && l.logo.url,
  )
  if (!items.length) return null

  return (
    <section className="ncx-logowall">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-logowall{--ink:#1A1A2E;--soft:#4A5573;--crimson:#C62828;--violet:#6E5BF2;
          --rule:#E4E7F0;--mist:#F5F5F7;
          background:var(--mist);border-top:1px solid var(--rule);border-bottom:1px solid var(--rule);
          padding:56px 0;font-family:Inter,Arial,sans-serif;color:var(--ink);text-align:center}
        .ncx-logowall .inner{max-width:1120px;margin:0 auto;padding:0 32px}
        .ncx-logowall .label{font-family:Poppins,Arial,sans-serif;font-size:14px;
          margin:0 0 12px;background:linear-gradient(90deg,var(--crimson),var(--violet));
          -webkit-background-clip:text;background-clip:text;color:transparent}
        .ncx-logowall h2{font-family:Poppins,Arial,sans-serif;font-weight:500;
          font-size:32px;letter-spacing:-.025em;margin:0}
        .ncx-logowall .intro{color:var(--soft);margin:12px auto 0;max-width:60ch;font-size:17px}
        .ncx-logowall .grid{margin-top:40px;display:flex;flex-wrap:nowrap;
          gap:20px;align-items:center;justify-content:space-between}
        .ncx-logowall .cell{flex:1 1 0;min-width:0;
          display:flex;align-items:center;justify-content:center;height:44px}
        .ncx-logowall img{width:auto;max-width:100%;object-fit:contain;display:block;
          filter:grayscale(1);opacity:.7;mix-blend-mode:multiply;transition:opacity .2s,filter .2s}
        .ncx-logowall img:hover{filter:none;opacity:1}
        .ncx-logowall .wordmark{font-family:Poppins,Arial,sans-serif;
          font-size:16px;font-weight:600;letter-spacing:-.01em;color:#8A93AB;
          white-space:nowrap;transition:color .2s}
        .ncx-logowall .cell:hover .wordmark{color:var(--ink)}
        @media(max-width:900px){.ncx-logowall{padding:40px 0}
          .ncx-logowall .inner{padding:0 20px}
          .ncx-logowall .grid{flex-wrap:wrap;justify-content:center;gap:26px 20px}
          .ncx-logowall .cell{flex:0 0 26%;height:34px}}
        @media(max-width:560px){.ncx-logowall .cell{flex:0 0 40%}}
      `}</style>

      <div className="inner">
        {label ? <p className="label">{label}</p> : null}
        {heading ? <h2>{heading}</h2> : null}
        {intro ? <p className="intro">{intro}</p> : null}

        <div className="grid">
          {items.map((l, i) => {
            if (asText) {
              return (
                <div className="cell" key={l.id || i}>
                  <span className="wordmark">{l.name}</span>
                </div>
              )
            }

            const pct = typeof l.scale === 'number' && l.scale > 0 ? l.scale : 100
            return (
              <div className="cell" key={l.id || i}>
                <img
                  src={l.logo.url}
                  alt={l.name || l.logo.alt || ''}
                  loading="lazy"
                  style={{ height: `${pct}%`, maxHeight: '100%' }}
                />
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
