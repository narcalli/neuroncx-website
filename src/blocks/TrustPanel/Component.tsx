import React from 'react'

type Card = {
  title?: string | null
  description?: string | null
  icon?: string | null
  id?: string | null
}

type Props = {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
  buttonLabel?: string | null
  buttonHref?: string | null
  cards?: Card[] | null
}

const ICONS: Record<string, React.ReactNode> = {
  shield: <path d="M12 3l8 3v6c0 4.4-3.4 7.9-8 9-4.6-1.1-8-4.6-8-9V6l8-3z" />,
  lock: (
    <>
      <rect x="4" y="10" width="16" height="11" rx="2" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.5 2.6 2.5 15 0 18-2.5-3-2.5-15.4 0-18z" />
    </>
  ),
  shieldCheck: (
    <>
      <path d="M12 3l8 3v6c0 4.4-3.4 7.9-8 9-4.6-1.1-8-4.6-8-9V6l8-3z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  server: (
    <>
      <rect x="3" y="4" width="18" height="7" rx="2" />
      <rect x="3" y="13" width="18" height="7" rx="2" />
      <path d="M7 7.5h.01M7 16.5h.01" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3.6-7 10-7 10 7 10 7-3.6 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
}

export const TrustPanelBlock: React.FC<Props> = ({
  eyebrow,
  heading,
  intro,
  buttonLabel,
  buttonHref,
  cards,
}) => {
  const items = cards || []
  if (!items.length && !heading) return null

  return (
    <section className="ncx-trust">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-trust{--navy:#1A2035;--navy-2:#252D4A;--crimson:#C62828;--line:rgba(255,255,255,.1);
          background:var(--navy);color:#fff;padding:80px 0;font-family:Inter,Arial,sans-serif}
        .ncx-trust .inner{max-width:1180px;margin:0 auto;padding:0 32px}
        .ncx-trust .grid{display:grid;grid-template-columns:1fr 1.1fr;gap:56px;align-items:center}
        .ncx-trust .eyebrow{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:.82rem;
          letter-spacing:.04em;color:#FF8F8F;margin:0 0 14px}
        .ncx-trust h2{font-family:Poppins,Arial,sans-serif;font-weight:700;
          font-size:clamp(1.9rem,3.6vw,2.7rem);line-height:1.1;letter-spacing:-.02em;
          margin:0;max-width:14ch}
        .ncx-trust .intro{color:rgba(255,255,255,.74);margin:18px 0 0;font-size:1.02rem;
          line-height:1.6;max-width:50ch}
        .ncx-trust .btn{display:inline-flex;align-items:center;gap:9px;margin-top:30px;
          font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:.98rem;
          background:var(--crimson);color:#fff;padding:15px 28px;border-radius:10px;
          text-decoration:none;box-shadow:0 10px 26px -10px rgba(198,40,40,.75);
          transition:transform .18s ease,box-shadow .18s ease}
        .ncx-trust .btn:hover{transform:translateY(-2px);box-shadow:0 14px 30px -10px rgba(198,40,40,.85)}
        .ncx-trust .btn:focus-visible{outline:2px solid #fff;outline-offset:3px}

        .ncx-trust .cards{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
        .ncx-trust .card{background:var(--navy-2);border:1px solid var(--line);
          border-radius:14px;padding:24px}
        .ncx-trust .mark{width:38px;height:38px;border-radius:10px;background:rgba(198,40,40,.18);
          color:#FF8F8F;display:flex;align-items:center;justify-content:center;margin-bottom:16px}
        .ncx-trust .mark svg{width:19px;height:19px}
        .ncx-trust h3{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:1.06rem;
          margin:0;color:#fff}
        .ncx-trust .card p{margin:8px 0 0;color:rgba(255,255,255,.66);font-size:.94rem;line-height:1.55}

        @media(max-width:900px){
          .ncx-trust{padding:52px 0}
          .ncx-trust .inner{padding:0 20px}
          .ncx-trust .grid{grid-template-columns:1fr;gap:34px}
          .ncx-trust h2{max-width:100%}
          .ncx-trust .cards{grid-template-columns:1fr}
        }
        @media(prefers-reduced-motion:reduce){.ncx-trust .btn{transition:none}}
      `}</style>

      <div className="inner">
        <div className="grid">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
            <h2>{heading}</h2>
            {intro ? <p className="intro">{intro}</p> : null}
            {buttonLabel ? (
              <a className="btn" href={buttonHref || '/contact'}>
                {buttonLabel}
              </a>
            ) : null}
          </div>

          {items.length ? (
            <div className="cards">
              {items.map((c, i) => (
                <div className="card" key={c.id || i}>
                  <span className="mark" aria-hidden="true">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      {ICONS[c.icon || 'shield'] || ICONS.shield}
                    </svg>
                  </span>
                  <h3>{c.title}</h3>
                  <p>{c.description}</p>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}
