import React from 'react'

type Step = { title?: string | null; description?: string | null; id?: string | null }

type Props = {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
  steps?: Step[] | null
  /** The block's Appearance background, applied by the page wrapper. The circles' ring matches it. */
  background?: 'default' | 'white' | 'cloud' | 'navy' | null
}

/**
 * How it works 2: numbered circles on a line, one column per step (2 to 5),
 * the number from the order. The line runs from the first circle's centre to
 * the last one's, drawn as one segment from each circle to the next, and
 * each circle has a ring in the section's background so the line seems to
 * stop at it. Below 900px the steps stack, circle on the left, and the line
 * runs down between the circles. No button, ever.
 */
export const HowItWorks2Block: React.FC<Props> = ({ eyebrow, heading, intro, steps, background }) => {
  const items = (steps || []).filter((s) => s && s.title)
  if (!items.length) return null
  const bg = background && background !== 'default' ? background : 'default'

  return (
    <section className="ncx-how2 ncx-container" data-bg={bg} style={{ '--n': items.length } as React.CSSProperties}>
      <style>{`
        .ncx-how2{--how2-ring:var(--background);--how2-line:#F2C4C4;--how2-title:#1A2035;--how2-text:#4B5563;
          padding-block:64px;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-how2[data-bg="white"]{--how2-ring:#ffffff}
        .ncx-how2[data-bg="cloud"]{--how2-ring:var(--ncx-cloud)}
        /* Highlight (navy): the wrapper remaps --ncx-navy inside the block, so the ring names the band's own colour. */
        .ncx-how2[data-bg="navy"]{--how2-ring:#1a2035;--how2-line:rgba(242,196,196,.35);
          --how2-title:var(--ncx-on-navy);--how2-text:var(--ncx-on-navy-soft)}

        /* The section head, as on the How it works block. */
        .ncx-how2 .eyebrow{font-family:var(--font-display),Arial,sans-serif;font-size:14px;
          color:var(--ncx-crimson-ink);margin:0 0 12px}
        .ncx-how2 h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;color:var(--ncx-ink);
          font-size:clamp(28px,3.4vw,36px);letter-spacing:-.025em;margin:0;max-width:22ch}
        .ncx-how2 .intro{color:var(--ncx-muted);margin:14px 0 0;max-width:62ch;font-size:17px;line-height:1.6}

        .ncx-how2 ol{list-style:none;margin:48px 0 0;padding:0;display:grid;
          grid-template-columns:repeat(var(--n),minmax(0,1fr));gap:24px}
        .ncx-how2 li{position:relative;min-width:0}
        /* The line: from this circle's centre to the next one's, behind both. */
        .ncx-how2 li:not(:last-child)::after{content:"";position:absolute;z-index:0;
          top:25px;left:26px;width:calc(100% + 24px);height:2px;background:var(--how2-line)}
        .ncx-how2 .num{position:relative;z-index:1;display:flex;align-items:center;justify-content:center;
          width:52px;height:52px;border-radius:50%;background:#C62828;color:#ffffff;
          font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:16px;line-height:1;
          box-shadow:0 0 0 8px var(--how2-ring)}
        .ncx-how2 h3{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:20px;
          line-height:1.3;color:var(--how2-title);margin:22px 0 0}
        .ncx-how2 .desc{font-family:var(--font-body),Arial,sans-serif;font-size:15.5px;line-height:1.6;
          color:var(--how2-text);max-width:240px;margin:8px 0 0}

        @media(max-width:899.98px){
          .ncx-how2{padding-block:44px}
          .ncx-how2 ol{grid-template-columns:minmax(0,1fr);margin-top:34px;gap:24px}
          .ncx-how2 li{display:grid;grid-template-columns:52px minmax(0,1fr);column-gap:20px;align-items:start}
          .ncx-how2 .num{grid-row:1 / span 2}
          /* Down from this circle's centre to the next one's, across the gap. */
          .ncx-how2 li:not(:last-child)::after{top:26px;left:25px;width:2px;height:calc(100% + 24px)}
          .ncx-how2 h3{margin:12px 0 0}
          .ncx-how2 .desc{max-width:none}
        }
      `}</style>

      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className="intro">{intro}</p> : null}

      <ol>
        {items.map((step, i) => (
          <li key={step.id || i}>
            <span className="num" aria-hidden="true">
              {String(i + 1).padStart(2, '0')}
            </span>
            <h3>{step.title}</h3>
            {step.description ? <p className="desc">{step.description}</p> : null}
          </li>
        ))}
      </ol>
    </section>
  )
}
