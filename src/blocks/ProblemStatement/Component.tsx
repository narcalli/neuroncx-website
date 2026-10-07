import React from 'react'

type Props = {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
  problems?: { title?: string | null; description?: string | null; id?: string | null }[] | null
  note?: string | null
  systems?: { name?: string | null; detail?: string | null; id?: string | null }[] | null
  gapLine?: string | null
  resolutionLine?: string | null
  resolutionHighlight?: string | null
}

export const ProblemStatementBlock: React.FC<Props> = ({
  eyebrow,
  heading,
  intro,
  problems,
  note,
  systems,
  gapLine,
  resolutionLine,
  resolutionHighlight,
}) => {
  const items = problems || []
  const cols = systems || []
  if (!items.length && !cols.length) return null

  return (
    <section className="ncx-prob">
      <style>{`
        .ncx-prob{
          background:var(--ncx-cloud);padding:72px 0;
          font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-prob .grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
        .ncx-prob .eyebrow{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.82rem;
          letter-spacing:.04em;color:var(--ncx-crimson-ink);margin:0 0 14px}
        .ncx-prob h2{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
          font-size:clamp(1.7rem,3vw,2.4rem);line-height:1.12;letter-spacing:-.02em;
          margin:0;max-width:20ch}
        .ncx-prob .intro{color:var(--ncx-muted);margin:16px 0 0;font-size:1.02rem;line-height:1.6;max-width:52ch}
        .ncx-prob .list{display:flex;flex-direction:column;gap:14px;margin-top:26px}
        .ncx-prob .item{display:flex;gap:14px;align-items:flex-start;background:var(--ncx-white);
          border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);padding:16px 18px}
        .ncx-prob .mark{flex:0 0 26px;width:26px;height:26px;border-radius:8px;
          background:var(--ncx-crimson-tint);color:var(--ncx-crimson);display:flex;align-items:center;
          justify-content:center;font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:.9rem}
        .ncx-prob .item p{margin:0;font-size:.98rem;line-height:1.55;color:var(--ncx-muted)}
        .ncx-prob .item b{color:var(--ncx-body);font-weight:600}
        .ncx-prob .note{margin:16px 0 0;font-size:.86rem;color:var(--ncx-muted);font-style:italic}

        .ncx-prob .visual{background:var(--ncx-navy);border-radius:18px;padding:30px;color:var(--ncx-on-navy)}
        .ncx-prob .silo{display:flex;justify-content:space-between;gap:12px}
        .ncx-prob .col{flex:1;background:var(--ncx-navy-tint);border:1px solid rgba(255,255,255,.08);
          border-radius:10px;padding:16px 10px;text-align:center}
        .ncx-prob .col b{display:block;font-family:var(--font-display),Arial,sans-serif;font-weight:600;
          font-size:.92rem;color:var(--ncx-on-navy)}
        .ncx-prob .col span{display:block;font-size:.74rem;color:rgba(255,255,255,.55);margin-top:5px}
        .ncx-prob .gap{margin:26px 0 0;text-align:center;font-size:.88rem;color:var(--ncx-crimson-on-navy);
          display:block}
        .ncx-prob .gap svg{width:13px;height:13px;display:inline-block;vertical-align:-1px;
          margin-right:6px;flex:none}
        .ncx-prob .after{margin-top:18px;padding-top:18px;
          border-top:1px dashed rgba(255,255,255,.16);text-align:center;
          font-family:var(--font-display),Arial,sans-serif;font-weight:600;color:var(--ncx-on-navy);font-size:.98rem}
        .ncx-prob .after em{font-style:normal;color:var(--ncx-teal-on-navy)}

        @media(max-width:900px){
          .ncx-prob{padding:48px 0}
          .ncx-prob .grid{grid-template-columns:1fr;gap:32px}
          .ncx-prob h2{max-width:100%}
          .ncx-prob .visual{padding:22px}
        }
      `}</style>

      <div className="inner ncx-container">
        <div className="grid">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2>{heading}</h2>
            {intro ? <p className="intro">{intro}</p> : null}

            {items.length ? (
              <div className="list">
                {items.map((p, i) => (
                  <div className="item" key={p.id || i}>
                    <span className="mark" aria-hidden="true">
                      !
                    </span>
                    <p>
                      <b>{p.title}</b> {p.description}
                    </p>
                  </div>
                ))}
              </div>
            ) : null}

            {note ? <p className="note">{note}</p> : null}
          </div>

          {cols.length ? (
            <div className="visual">
              <div className="silo">
                {cols.map((c, i) => (
                  <div className="col" key={c.id || i}>
                    <b>{c.name}</b>
                    {c.detail ? <span>{c.detail}</span> : null}
                  </div>
                ))}
              </div>

              {gapLine ? (
                <p className="gap">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" aria-hidden="true">
                    <path d="M18 6L6 18M6 6l12 12" />
                  </svg>
                  {gapLine}
                </p>
              ) : null}

              {resolutionLine || resolutionHighlight ? (
                <p className="after">
                  {resolutionLine} {resolutionHighlight ? <em>{resolutionHighlight}</em> : null}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
