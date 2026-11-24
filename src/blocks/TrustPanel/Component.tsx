import React from 'react'
import { BlockIcon } from '@/components/BlockIcon'
import { SplitHeading } from '@/motion/SplitHeading'
import { Reveal } from '@/motion/Reveal'

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
  /** The block's Appearance > Background, which also decides whether the panel reads light or dark. */
  background?: string | null
}

/**
 * Light on a pale section, dark everywhere else. The panel paints its own navy
 * only on "Default (as designed)": on "Highlight (navy)" the wrapper has
 * already painted it, and painting again would land a tint on top of it.
 */
const themeFor = (background?: string | null) =>
  background === 'white' || background === 'cloud' ? 'light' : 'dark'

export const TrustPanelBlock: React.FC<Props> = ({
  eyebrow,
  heading,
  intro,
  buttonLabel,
  buttonHref,
  cards,
  background,
}) => {
  const items = cards || []
  if (!items.length && !heading) return null
  const theme = themeFor(background)
  const paintsOwnBackground = !background || background === 'default'

  return (
    <section
      className="ncx-trust"
      data-theme={theme}
      data-surface={theme === 'light' ? background : undefined}
      data-own-bg={paintsOwnBackground ? '' : undefined}
    >
      <style>{`
        /* One set of rules, two palettes. Dark is the default so existing pages are untouched. */
        .ncx-trust{
          --trust-ink:var(--ncx-on-navy);
          --trust-body:var(--ncx-on-navy-soft);
          --trust-accent:var(--ncx-crimson-on-navy);
          --trust-accent-wash:var(--ncx-crimson-wash-on-navy);
          --trust-card:var(--ncx-navy-tint);
          --trust-rule:var(--ncx-on-navy-rule);
          --trust-btn-ink:var(--ncx-on-navy);
          color:var(--trust-ink);padding:80px 0;font-family:var(--font-body),Arial,sans-serif}
        /* Only when no section background was chosen: on Highlight (navy) the wrapper painted it. */
        .ncx-trust[data-own-bg]{background:var(--ncx-navy)}
        .ncx-trust[data-theme="light"]{
          --trust-ink:var(--ncx-ink);
          --trust-body:var(--ncx-muted);
          --trust-accent:var(--ncx-crimson-ink);
          --trust-accent-wash:var(--ncx-crimson-tint);
          --trust-card:var(--ncx-white);
          --trust-rule:var(--ncx-rule);
          --trust-btn-ink:#fff}
        /* A card has to sit off its section: pale on white, white on pale grey. */
        .ncx-trust[data-surface="white"]{--trust-card:var(--ncx-paper)}
        .ncx-trust .grid{display:grid;grid-template-columns:1fr 1.1fr;gap:56px;align-items:center}
        /* Nothing beside the text: it takes the full width. */
        .ncx-trust .grid[data-cols="1"]{grid-template-columns:minmax(0,1fr)}
        .ncx-trust .grid[data-cols="1"] .intro{max-width:none}
        .ncx-trust .eyebrow{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.82rem;
          letter-spacing:.04em;color:var(--trust-accent);margin:0 0 14px}
        .ncx-trust h2{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
          font-size:clamp(1.9rem,3.6vw,2.7rem);line-height:1.1;letter-spacing:-.02em;
          margin:0;max-width:var(--ncx-heading-max)}
        .ncx-trust .intro{color:var(--trust-body);margin:18px 0 0;font-size:1.02rem;
          line-height:1.6;max-width:50ch}
        .ncx-trust .btn{display:inline-flex;align-items:center;gap:9px;margin-top:30px;
          font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.98rem;
          background:var(--ncx-crimson);color:var(--trust-btn-ink);padding:15px 28px;border-radius:10px;
          text-decoration:none;box-shadow:0 10px 26px -10px rgba(198,40,40,.75);
          transition:transform .18s ease,box-shadow .18s ease}
        .ncx-trust .btn:hover{transform:translateY(-2px);box-shadow:0 14px 30px -10px rgba(198,40,40,.85)}
        .ncx-trust .btn:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}

        .ncx-trust .cards{display:grid;grid-template-columns:repeat(2,1fr);gap:18px}
        .ncx-trust .card{background:var(--trust-card);border:1px solid var(--trust-rule);
          border-radius:14px;padding:24px}
        .ncx-trust .mark{width:38px;height:38px;border-radius:10px;background:var(--trust-accent-wash);
          color:var(--trust-accent);display:flex;align-items:center;justify-content:center;margin-bottom:16px}
        .ncx-trust .mark svg{width:19px;height:19px}
        .ncx-trust h3{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:1.06rem;
          margin:0;color:var(--trust-ink)}
        .ncx-trust .card p{margin:8px 0 0;color:var(--trust-body);font-size:.94rem;line-height:1.55}

        @media(max-width:900px){
          .ncx-trust{padding:52px 0}
          .ncx-trust .grid{grid-template-columns:1fr;gap:34px}
          .ncx-trust h2{max-width:100%}
          .ncx-trust .cards{grid-template-columns:1fr}
        }
        @media(prefers-reduced-motion:reduce){.ncx-trust .btn{transition:none}}
      `}</style>

      <div className="inner ncx-container">
        <div className="grid" data-cols={items.length ? '2' : '1'}>
          <div>
            {eyebrow ? <Reveal as="p" from="left" className="eyebrow">{eyebrow}</Reveal> : null}
            <SplitHeading as="h2">{heading}</SplitHeading>
            {intro ? <Reveal as="p" className="intro">{intro}</Reveal> : null}
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
