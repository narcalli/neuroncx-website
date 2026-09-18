import React from 'react'

type Props = {
  heading?: string | null
  subhead?: string | null
  primaryLabel?: string | null
  primaryLink?: string | null
  secondaryLabel?: string | null
  secondaryLink?: string | null
  tagline?: string | null
}

export const ClosingCtaBlock: React.FC<Props> = ({
  heading,
  subhead,
  primaryLabel,
  primaryLink,
  secondaryLabel,
  secondaryLink,
  tagline,
}) => {
  if (!heading) return null

  return (
    <section className="ncx-closing">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-closing{--navy:#1A2035;--crimson:#C62828;--cloud:#F5F5F7;
          background:var(--cloud);padding:64px 0;font-family:Inter,Arial,sans-serif}
        .ncx-closing .inner{max-width:1180px;margin:0 auto;padding:0 32px}
        .ncx-closing .card{position:relative;overflow:hidden;background:var(--navy);color:#fff;
          border-radius:24px;padding:72px 40px;text-align:center;
          box-shadow:0 40px 80px -40px rgba(15,18,32,.6)}
        .ncx-closing .glow{position:absolute;width:520px;height:520px;border-radius:50%;
          filter:blur(120px);opacity:.26;top:-240px;left:50%;transform:translateX(-50%);
          background:radial-gradient(circle,rgba(198,40,40,.9),transparent 65%);pointer-events:none}
        .ncx-closing .body{position:relative;z-index:2}
        .ncx-closing h2{font-family:Poppins,Arial,sans-serif;font-weight:700;
          font-size:clamp(1.9rem,3.6vw,2.7rem);line-height:1.1;letter-spacing:-.02em;
          margin:0 auto;max-width:22ch}
        .ncx-closing .sub{margin:20px auto 0;color:rgba(255,255,255,.76);font-size:1.04rem;
          line-height:1.6;max-width:56ch}
        .ncx-closing .cta{margin-top:32px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
        .ncx-closing .btn{display:inline-flex;align-items:center;gap:9px;
          font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:.98rem;
          padding:15px 28px;border-radius:10px;border:1px solid transparent;text-decoration:none;
          transition:transform .18s ease,box-shadow .18s ease,background .18s ease}
        .ncx-closing .primary{background:var(--crimson);color:#fff;
          box-shadow:0 10px 26px -10px rgba(198,40,40,.75)}
        .ncx-closing .primary:hover{transform:translateY(-2px)}
        .ncx-closing .ghost{background:transparent;color:#fff;border-color:rgba(255,255,255,.28)}
        .ncx-closing .ghost:hover{background:rgba(255,255,255,.08)}
        .ncx-closing .btn:focus-visible{outline:2px solid #fff;outline-offset:3px}
        .ncx-closing .tagline{margin:26px 0 0;font-style:italic;color:rgba(255,255,255,.62);
          font-size:.98rem}
        @media(max-width:900px){
          .ncx-closing{padding:44px 0}
          .ncx-closing .inner{padding:0 20px}
          .ncx-closing .card{padding:48px 24px;border-radius:20px}
          .ncx-closing .glow{filter:blur(70px)}
        }
        @media(prefers-reduced-motion:reduce){.ncx-closing .btn{transition:none}}
      `}</style>

      <div className="inner">
        <div className="card">
          <div className="glow" />
          <div className="body">
            <h2>{heading}</h2>
            {subhead ? <p className="sub">{subhead}</p> : null}

            {primaryLabel || secondaryLabel ? (
              <div className="cta">
                {primaryLabel ? (
                  <a className="btn primary" href={primaryLink || '/contact'}>
                    {primaryLabel}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" />
                    </svg>
                  </a>
                ) : null}
                {secondaryLabel ? (
                  <a className="btn ghost" href={secondaryLink || '#'}>
                    {secondaryLabel}
                  </a>
                ) : null}
              </div>
            ) : null}

            {tagline ? <p className="tagline">{tagline}</p> : null}
          </div>
        </div>
      </div>
    </section>
  )
}
