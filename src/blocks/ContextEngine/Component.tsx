import React from 'react'

type Props = {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
  points?: { title?: string | null; description?: string | null; id?: string | null }[] | null
  calloutTerm?: string | null
  calloutText?: string | null
  centreLabel?: string | null
  satellites?: { label?: string | null; id?: string | null }[] | null
}

const W = 560
const H = 470
const CX = W / 2
const CY = H / 2
const R = 170 // orbit radius
const NODE_R = 30

export const ContextEngineBlock: React.FC<Props> = ({
  eyebrow,
  heading,
  intro,
  points,
  calloutTerm,
  calloutText,
  centreLabel,
  satellites,
}) => {
  const items = points || []
  const nodes = (satellites || []).filter((s) => s?.label)
  if (!items.length && !nodes.length) return null

  // Spread the nodes evenly, starting at the top.
  const placed = nodes.map((s, i) => {
    const angle = (Math.PI * 2 * i) / nodes.length - Math.PI / 2
    return {
      label: s.label as string,
      x: CX + R * Math.cos(angle),
      y: CY + R * Math.sin(angle),
      id: s.id || String(i),
    }
  })

  return (
    <section className="ncx-ctx">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-ctx{--navy:#1A2035;--navy-2:#252D4A;--crimson:#C62828;--ink:#1A1A2E;
          --muted:#6B7280;--line:#E4E4EA;--cloud:#F5F5F7;
          background:var(--cloud);padding:72px 0;font-family:Inter,Arial,sans-serif;color:var(--ink)}
        .ncx-ctx .inner{max-width:1180px;margin:0 auto;padding:0 32px}
        .ncx-ctx .grid{display:grid;grid-template-columns:1fr 1fr;gap:56px;align-items:center}
        .ncx-ctx .eyebrow{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:.82rem;
          letter-spacing:.04em;color:var(--crimson);margin:0 0 14px}
        .ncx-ctx h2{font-family:Poppins,Arial,sans-serif;font-weight:700;
          font-size:clamp(1.9rem,3.4vw,2.6rem);line-height:1.1;letter-spacing:-.02em;
          margin:0;max-width:16ch}
        .ncx-ctx .intro{color:var(--muted);margin:18px 0 0;font-size:1.02rem;line-height:1.6;max-width:52ch}
        .ncx-ctx .points{margin:28px 0 0;padding:0;list-style:none;display:flex;
          flex-direction:column;gap:18px}
        .ncx-ctx .points li{display:flex;gap:14px;align-items:flex-start}
        .ncx-ctx .tick{flex:0 0 22px;width:22px;height:22px;border-radius:6px;background:var(--navy);
          color:#fff;display:flex;align-items:center;justify-content:center;margin-top:2px}
        .ncx-ctx .tick svg{width:13px;height:13px}
        .ncx-ctx .points p{margin:0;font-size:1rem;line-height:1.55;color:var(--muted)}
        .ncx-ctx .points b{color:var(--ink);font-weight:600}
        .ncx-ctx .callout{margin-top:26px;background:#fff;border:1px solid var(--line);
          border-radius:12px;padding:16px 18px;display:flex;gap:14px;align-items:flex-start}
        .ncx-ctx .callout .mark{flex:0 0 30px;width:30px;height:30px;border-radius:9px;
          background:var(--navy);color:#fff;display:flex;align-items:center;justify-content:center}
        .ncx-ctx .callout .mark svg{width:15px;height:15px}
        .ncx-ctx .callout p{margin:0;font-size:.98rem;line-height:1.55;color:var(--muted)}
        .ncx-ctx .callout b{font-family:Poppins,Arial,sans-serif;color:var(--ink);font-weight:700}

        .ncx-ctx .panel{background:var(--navy);border-radius:18px;padding:18px;
          box-shadow:0 30px 60px -30px rgba(15,18,32,.5)}
        .ncx-ctx svg.map{display:block;width:100%;height:auto}
        .ncx-ctx .edge{stroke:rgba(255,255,255,.16);stroke-width:1.5;
          stroke-dasharray:240;stroke-dashoffset:240;
          animation:ncxEdge 1s ease forwards}
        @keyframes ncxEdge{to{stroke-dashoffset:0}}
        .ncx-ctx .sat circle{fill:#232C47;stroke:rgba(255,255,255,.18);stroke-width:1}
        .ncx-ctx .sat text{fill:rgba(255,255,255,.9);font-family:Inter,Arial,sans-serif;
          font-size:12px;font-weight:500}
        .ncx-ctx .sat{opacity:0;animation:ncxSat .5s cubic-bezier(.34,1.56,.64,1) forwards}
        @keyframes ncxSat{to{opacity:1}}
        .ncx-ctx .core-glow{fill:var(--crimson);opacity:.28;
          animation:ncxPulse 3.2s ease-in-out infinite}
        @keyframes ncxPulse{0%,100%{opacity:.2}50%{opacity:.4}}
        .ncx-ctx .core circle.body{fill:#161D33;stroke:var(--crimson);stroke-width:2}
        .ncx-ctx .core text{fill:#fff;font-family:Poppins,Arial,sans-serif;font-size:13px;
          font-weight:700}

        @media(max-width:900px){
          .ncx-ctx{padding:48px 0}
          .ncx-ctx .inner{padding:0 20px}
          .ncx-ctx .grid{grid-template-columns:1fr;gap:34px}
          .ncx-ctx h2{max-width:100%}
        }
        @media(prefers-reduced-motion:reduce){
          .ncx-ctx .edge{animation:none;stroke-dashoffset:0}
          .ncx-ctx .sat{animation:none;opacity:1}
          .ncx-ctx .core-glow{animation:none;opacity:.3}
        }
      `}</style>

      <div className="inner">
        <div className="grid">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2>{heading}</h2>
            {intro ? <p className="intro">{intro}</p> : null}

            {items.length ? (
              <ul className="points">
                {items.map((p, i) => (
                  <li key={p.id || i}>
                    <span className="tick" aria-hidden="true">
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M5 13l4 4L19 7" />
                      </svg>
                    </span>
                    <p>
                      <b>{p.title}</b> {p.description}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}

            {calloutTerm || calloutText ? (
              <div className="callout">
                <span className="mark" aria-hidden="true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M8 7l-4 5 4 5M16 7l4 5-4 5" />
                  </svg>
                </span>
                <p>
                  <b>{calloutTerm}</b> {calloutText}
                </p>
              </div>
            ) : null}
          </div>

          {placed.length ? (
            <div className="panel">
              <svg className="map" viewBox={`0 0 ${W} ${H}`} role="img"
                aria-label={`${centreLabel || 'Context engine'} connected to ${placed.map((p) => p.label).join(', ')}`}>
                {placed.map((p, i) => (
                  <line
                    key={`e-${p.id}`}
                    className="edge"
                    x1={CX}
                    y1={CY}
                    x2={p.x}
                    y2={p.y}
                    style={{ animationDelay: `${0.15 + i * 0.09}s` }}
                  />
                ))}

                {placed.map((p, i) => (
                  <g className="sat" key={`s-${p.id}`} style={{ animationDelay: `${0.4 + i * 0.09}s` }}>
                    <circle cx={p.x} cy={p.y} r={NODE_R} />
                    <text x={p.x} y={p.y + 4} textAnchor="middle">
                      {p.label}
                    </text>
                  </g>
                ))}

                <circle className="core-glow" cx={CX} cy={CY} r={54} />
                <g className="core">
                  <circle className="body" cx={CX} cy={CY} r={42} />
                  <text x={CX} y={CY - 2} textAnchor="middle">
                    {(centreLabel || 'Context Engine').split(' ')[0]}
                  </text>
                  <text x={CX} y={CY + 14} textAnchor="middle">
                    {(centreLabel || 'Context Engine').split(' ').slice(1).join(' ')}
                  </text>
                </g>
              </svg>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
