import React from 'react'

type Item = {
  name?: string | null
  summary?: string | null
  logo?: any
  id?: string | null
}

type Props = {
  label?: string | null
  heading?: string | null
  intro?: string | null
  items?: Item[] | null
  footnote?: string | null
}

export const IntegrationsBlock: React.FC<Props> = ({ label, heading, intro, items, footnote }) => {
  const list = items || []
  if (!list.length) return null

  return (
    <section className="ncx-integrations ncx-container">
      <style>{`
        .ncx-integrations{
          padding-block:48px;
          font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-integrations .label{font-family:var(--font-display),Arial,sans-serif;font-size:14px;
          color:var(--ncx-crimson-ink);margin:0 0 12px}
        .ncx-integrations h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,38px);letter-spacing:-.03em;margin:0;max-width:22ch}
        .ncx-integrations .intro{color:var(--ncx-muted);margin:14px 0 0;max-width:64ch;font-size:18px;line-height:1.6}
        .ncx-integrations .grid{margin-top:44px;display:grid;
          grid-template-columns:repeat(auto-fill,minmax(260px,1fr));gap:1px;
          background:var(--ncx-rule);border:1px solid var(--ncx-rule);border-radius:12px;overflow:hidden}
        .ncx-integrations .cell{background:var(--ncx-white);padding:24px 22px;display:flex;gap:14px;align-items:flex-start}
        .ncx-integrations .mark{width:34px;height:34px;flex:0 0 34px;border-radius:8px;background:var(--ncx-cloud);
          display:flex;align-items:center;justify-content:center;overflow:hidden}
        .ncx-integrations .mark img{max-width:26px;max-height:26px;width:auto;height:auto;
          object-fit:contain;mix-blend-mode:multiply}
        .ncx-integrations .initial{font-family:var(--font-display),Arial,sans-serif;font-size:15px;
          font-weight:500;color:var(--ncx-muted)}
        .ncx-integrations .name{font-family:var(--font-display),Arial,sans-serif;font-size:16px;
          font-weight:500;margin:0}
        .ncx-integrations .summary{margin:6px 0 0;color:var(--ncx-muted);font-size:15px;line-height:1.55}
        .ncx-integrations .footnote{margin:24px 0 0;color:var(--ncx-muted);font-size:16px}
        @media(max-width:820px){.ncx-integrations{padding-block:36px}
          .ncx-integrations .grid{margin-top:32px}}
      `}</style>

      {label ? <p className="label">{label}</p> : null}
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className="intro">{intro}</p> : null}

      <div className="grid">
        {list.map((it, i) => {
          const hasLogo = it.logo && typeof it.logo === 'object' && it.logo.url
          return (
            <div className="cell" key={it.id || i}>
              <div className="mark">
                {hasLogo ? (
                  <img src={it.logo.url} alt="" loading="lazy" />
                ) : (
                  <span className="initial">{(it.name || '?').charAt(0)}</span>
                )}
              </div>
              <div>
                <p className="name">{it.name}</p>
                {it.summary ? <p className="summary">{it.summary}</p> : null}
              </div>
            </div>
          )
        })}
      </div>

      {footnote ? <p className="footnote">{footnote}</p> : null}
    </section>
  )
}
