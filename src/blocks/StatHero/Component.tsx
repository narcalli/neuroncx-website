import React from 'react'

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
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-stathero{--ink:#1A1A2E;--soft:#4A5573;--crimson:#C62828;--violet:#6E5BF2;
          --cyan:#18B6AE;--rule:#E4E7F0;--mist:#F5F5F7;
          position:relative;overflow:hidden;padding:48px 0 72px;text-align:center;
          font-family:Inter,Arial,sans-serif;color:var(--ink)}
        .ncx-stathero .glow{position:absolute;border-radius:50%;filter:blur(110px);pointer-events:none}
        .ncx-stathero .g1{width:720px;height:720px;left:50%;top:-380px;transform:translateX(-50%);
          opacity:.30;background:radial-gradient(circle,rgba(110,91,242,.85),transparent 65%)}
        .ncx-stathero .g2{width:520px;height:520px;left:4%;top:40px;opacity:.22;
          background:radial-gradient(circle,rgba(198,40,40,.8),transparent 65%)}
        .ncx-stathero .g3{width:500px;height:500px;right:2%;top:0;opacity:.20;
          background:radial-gradient(circle,rgba(24,182,174,.85),transparent 65%)}
        .ncx-stathero .grid-bg{position:absolute;inset:0;pointer-events:none;opacity:.55;
          background-image:linear-gradient(rgba(22,32,58,.06) 1px,transparent 1px),
                           linear-gradient(90deg,rgba(22,32,58,.06) 1px,transparent 1px);
          background-size:64px 64px;
          -webkit-mask-image:radial-gradient(ellipse at 50% 0%,#000 25%,transparent 70%);
          mask-image:radial-gradient(ellipse at 50% 0%,#000 25%,transparent 70%)}
        .ncx-stathero .inner{position:relative;z-index:2;max-width:1120px;margin:0 auto;padding:0 32px}
        .ncx-stathero .pill{display:inline-flex;align-items:center;gap:9px;
          font-family:Poppins,Arial,sans-serif;font-size:13px;color:var(--soft);
          border:1px solid var(--rule);background:rgba(255,255,255,.75);
          padding:7px 15px;border-radius:999px;margin:0 0 24px}
        .ncx-stathero .spark{width:7px;height:7px;border-radius:50%;
          background:linear-gradient(135deg,var(--crimson),var(--violet))}
        .ncx-stathero h1{font-family:Poppins,Arial,sans-serif;font-weight:500;
          font-size:clamp(36px,4.6vw,56px);line-height:1.06;letter-spacing:-.035em;
          margin:0 auto;max-width:20ch;text-wrap:balance;
          background:linear-gradient(170deg,#16203A 55%,#2E3C7E 100%);
          -webkit-background-clip:text;background-clip:text;color:transparent}
        .ncx-stathero .sub{margin:24px auto 0;max-width:60ch;font-size:19px;line-height:1.65;color:var(--soft)}
        .ncx-stathero .cta{margin-top:34px;display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
        .ncx-stathero .btn{font-family:Poppins,Arial,sans-serif;font-size:15px;
          font-weight:500;padding:13px 24px;border-radius:8px;text-decoration:none;display:inline-block}
        .ncx-stathero .solid{background:var(--ink);color:#fff}
        .ncx-stathero .ghost{border:1px solid var(--rule);color:var(--ink);background:#fff}
        .ncx-stathero .btn:focus-visible{outline:2px solid var(--violet);outline-offset:3px}
        .ncx-stathero .stats{margin:56px auto 0;max-width:900px;display:grid;
          grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:1px;
          background:var(--rule);border:1px solid var(--rule);border-radius:14px;overflow:hidden}
        .ncx-stathero .stat{background:rgba(255,255,255,.88);padding:26px 16px}
        .ncx-stathero .value{font-family:Poppins,Arial,sans-serif;font-weight:700;
          font-size:34px;letter-spacing:-.03em;
          background:linear-gradient(135deg,var(--violet),var(--cyan));
          -webkit-background-clip:text;background-clip:text;color:transparent}
        .ncx-stathero .slabel{font-family:Poppins,Arial,sans-serif;font-size:13px;
          color:var(--soft);margin-top:8px}
        @media(max-width:900px){.ncx-stathero{padding:28px 0 48px}
          .ncx-stathero .inner{padding:0 20px}
          .ncx-stathero .glow{filter:blur(70px)}
          .ncx-stathero .stats{margin-top:40px}
          .ncx-stathero .value{font-size:28px}}
        @media(prefers-reduced-motion:reduce){.ncx-stathero *{transition:none!important}}
      `}</style>

      <div className="grid-bg" />
      <div className="glow g1" />
      <div className="glow g2" />
      <div className="glow g3" />

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
                <div className="value">{s.value}</div>
                <div className="slabel">{s.label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
