import React from 'react'
import { StatValue } from '@/utilities/statValue'

type Stat = { value?: string | null; label?: string | null; id?: string | null }

type Props = {
  eyebrow?: string | null
  headline?: string | null
  subhead?: string | null
  primaryLabel?: string | null
  primaryLink?: string | null
  secondaryLabel?: string | null
  secondaryLink?: string | null
  stats?: Stat[] | null
}

export const StatHeroBlock: React.FC<Props> = ({
  eyebrow,
  headline,
  subhead,
  primaryLabel,
  primaryLink,
  secondaryLabel,
  secondaryLink,
  stats,
}) => {
  const items = stats || []

  return (
    <section className="ncx-stathero">
      <style>{`
        .ncx-stathero{
          /* The same stage as conversationHero: full bleed, four blooms on one
             composited layer, drifting as a single element. */
          position:relative;overflow:hidden;isolation:isolate;text-align:center;
          background:var(--wash);color:var(--ncx-body);
          padding:0 0 clamp(48px,6vw,72px);
          font-family:var(--font-body),Arial,sans-serif}
        .ncx-stathero::before{
          content:"";position:absolute;inset:-35%;z-index:0;
          background:
            radial-gradient(38% 46% at 18% 28%, var(--g1), transparent 66%),
            radial-gradient(44% 52% at 78% 16%, var(--g2), transparent 66%),
            radial-gradient(46% 54% at 62% 88%, var(--g3), transparent 66%),
            radial-gradient(42% 50% at 8% 86%, var(--g4), transparent 66%);
          animation:ncxDrift 26s ease-in-out infinite alternate;
          will-change:transform}
        @keyframes ncxDrift{
          0%{transform:translate3d(0,0,0) scale(1) rotate(0deg)}
          50%{transform:translate3d(5%,-4%,0) scale(1.16) rotate(4deg)}
          100%{transform:translate3d(-4%,5%,0) scale(1.06) rotate(-3deg)}
        }
        @media(prefers-reduced-motion:reduce){.ncx-stathero::before{animation:none}}
        .ncx-stathero .inner{position:relative;z-index:1;max-width:1120px;margin:0 auto;
          padding:calc(64px + clamp(44px,6vw,76px)) clamp(20px,5vw,64px) 0}
        .ncx-stathero .pill{display:inline-flex;align-items:center;gap:9px;
          font-family:var(--font-display),Arial,sans-serif;font-size:13px;color:var(--ncx-muted);
          border:1px solid var(--ncx-rule);background:var(--ncx-white);
          padding:7px 15px;border-radius:999px;margin:0 0 24px}
        .ncx-stathero .spark{width:7px;height:7px;border-radius:50%;background:var(--ncx-crimson)}
        .ncx-stathero h1{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(36px,4.6vw,56px);line-height:1.06;letter-spacing:-.035em;
          margin:0 auto;max-width:20ch;text-wrap:balance;color:var(--ncx-ink)}
        .ncx-stathero .sub{margin:24px auto 0;max-width:60ch;font-size:19px;line-height:1.65;color:var(--ncx-muted)}
        .ncx-stathero .cta{margin-top:34px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
        .ncx-stathero .btn{font-family:var(--font-display),Arial,sans-serif;font-size:15px;
          font-weight:500;padding:13px 24px;border-radius:8px;text-decoration:none;display:inline-block}
        .ncx-stathero .solid{background:var(--ncx-navy);color:var(--ncx-on-navy)}
        .ncx-stathero .ghost{border:1px solid var(--ncx-rule);color:var(--ncx-ink);background:var(--ncx-white)}
        .ncx-stathero .btn:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
        .ncx-stathero .stats{margin:56px auto 0;max-width:900px;display:grid;
          grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1px;
          background:var(--ncx-rule);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);overflow:hidden}
        .ncx-stathero .stat{background:var(--ncx-white);padding:26px 16px}
        .ncx-stathero .value{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
          font-size:34px;letter-spacing:-.03em;color:var(--ncx-ink)}
        .ncx-stathero .slabel{font-family:var(--font-display),Arial,sans-serif;font-size:13px;
          color:var(--ncx-muted);margin-top:8px}
        @media(max-width:900px){
          .ncx-stathero .stats{margin-top:40px}
          .ncx-stathero .value{font-size:28px}}
        @media(prefers-reduced-motion:reduce){.ncx-stathero *{transition:none!important}}
              .ncx-stathero .ncx-unit{font-style:normal;color:var(--ncx-crimson-ink)}
      `}</style>

      <div className="inner">
        {eyebrow ? (
          <p className="pill">
            <span className="spark" />
            {eyebrow}
          </p>
        ) : null}
        <h1>{headline}</h1>
        {subhead ? <p className="sub">{subhead}</p> : null}

        {primaryLabel || secondaryLabel ? (
          <div className="cta">
            {primaryLabel ? (
              <a className="btn solid" href={primaryLink || '#'}>
                {primaryLabel}
              </a>
            ) : null}
            {secondaryLabel ? (
              <a className="btn ghost" href={secondaryLink || '#'}>
                {secondaryLabel}
              </a>
            ) : null}
          </div>
        ) : null}

        {items.length ? (
          <div className="stats">
            {items.map((s, i) => (
              <div className="stat" key={s.id || i}>
                <div className="value"><StatValue value={s.value} /></div>
                <div className="slabel">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
