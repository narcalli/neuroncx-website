import React from 'react'
import { BlockIcon } from '@/components/BlockIcon'

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
        .ncx-trust{
          background:var(--ncx-navy);color:var(--ncx-on-navy);padding:80px 0;font-family:var(--font-body),Arial,sans-serif}
        .ncx-trust .grid{display:grid;grid-template-columns:1fr 1.1fr;gap:56px;align-items:center}
        .ncx-trust .eyebrow{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.82rem;
          letter-spacing:.04em;color:var(--ncx-crimson-on-navy);margin:0 0 14px}
        .ncx-trust h2{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
          font-size:clamp(1.9rem,3.6vw,2.7rem);line-height:1.1;letter-spacing:-.02em;
          margin:0;max-width:14ch}
        .ncx-trust .intro{color:var(--ncx-on-navy-soft);margin:18px 0 0;font-size:1.02rem;
          line-height:1.6;max-width:50ch}
        .ncx-trust .btn{display:inline-flex;align-items:center;gap:9px;margin-top:30px;
          font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.98rem;
          background:var(--ncx-crimson);color:var(--ncx-on-navy);padding:15px 28px;border-radius:10px;
          text-decoration:none;box-shadow:0 10px 26px -10px rgba(198,40,40,.75);
          transition:transform .18s ease,box-shadow .18s ease}
        .ncx-trust .btn:hover{transform:translateY(-2px);box-shadow:0 14px 30px -10px rgba(198,40,40,.85)}
        .ncx-trust .btn:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}

        .ncx-trust .cards{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
        .ncx-trust .card{background:var(--ncx-navy-tint);border:1px solid var(--ncx-on-navy-rule);
          border-radius:14px;padding:24px}
        .ncx-trust .mark{width:38px;height:38px;border-radius:10px;background:var(--ncx-crimson-wash-on-navy);
          color:var(--ncx-crimson-on-navy);display:flex;align-items:center;justify-content:center;margin-bottom:16px}
        .ncx-trust .mark svg{width:19px;height:19px}
        .ncx-trust h3{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:1.06rem;
          margin:0;color:var(--ncx-on-navy)}
        .ncx-trust .card p{margin:8px 0 0;color:var(--ncx-on-navy-soft);font-size:.94rem;line-height:1.55}

        @media(max-width:900px){
          .ncx-trust{padding:52px 0}
          .ncx-trust .grid{grid-template-columns:1fr;gap:34px}
          .ncx-trust h2{max-width:100%}
          .ncx-trust .cards{grid-template-columns:1fr}
        }
        @media(prefers-reduced-motion:reduce){.ncx-trust .btn{transition:none}}
      `}</style>

      <div className="inner ncx-container">
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
                    <BlockIcon name={c.icon} fallback="shield" round />
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
