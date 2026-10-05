import React from 'react'

import { BlockIcon } from '@/components/BlockIcon'
import { Animator } from '../HeroFullBackground/Animator'

type LinkGroup = {
  type?: 'reference' | 'custom' | null
  reference?: {
    relationTo?: 'pages' | 'posts'
    value?: { slug?: string | null } | string | number | null
  } | null
  url?: string | null
  label: string
  newTab?: boolean | null
}

type Card = {
  icon?: string | null
  label?: string | null
  title?: string | null
  description?: string | null
  id?: string | null
}

type Props = {
  eyebrow?: string | null
  headline?: string | null
  subhead?: string | null
  cta?: LinkGroup | null
  theme?: 'dark' | 'red' | 'white' | null
  speed?: 'slow' | 'medium' | 'fast' | null
  columns?: '2' | '3' | '4' | null
  cards?: Card[] | null
}

/** Resolves a CTA group into a real address, or null when there is nothing to link to. */
const resolveHref = (cta: LinkGroup | null | undefined): string | null => {
  if (!cta) return null
  if (cta.type === 'custom') return cta.url || null
  if (cta.type === 'reference' && cta.reference && typeof cta.reference.value === 'object') {
    const slug = cta.reference.value?.slug
    if (!slug) return null
    return cta.reference.relationTo === 'posts' ? `/posts/${slug}` : `/${slug}`
  }
  return null
}

// One base duration per possible column, deliberately uneven so parallel
// columns never look mechanically synced. Multiplied down by the speed field.
const BASE_DURATIONS = [34, 29, 38, 26]
const SPEED_MULT: Record<string, number> = { slow: 1, medium: 1.7, fast: 2.6 }

/** Splits the flat card list round-robin across N columns, in entry order. */
const distribute = (cards: Card[], columnCount: number): Card[][] => {
  const columns: Card[][] = Array.from({ length: columnCount }, () => [])
  cards.forEach((card, i) => columns[i % columnCount].push(card))
  return columns
}

const CardTile: React.FC<{ card: Card; hidden?: boolean }> = ({ card, hidden }) => (
  <div className="card" tabIndex={hidden ? -1 : 0} aria-hidden={hidden || undefined}>
    <span className="card__ic" aria-hidden="true">
      <BlockIcon name={card.icon} fallback="bot" />
    </span>
    {card.label ? <span className="card__tag">{card.label}</span> : null}
    <h3 className="card__title">{card.title}</h3>
    {card.description ? <p className="card__desc">{card.description}</p> : null}
  </div>
)

export const HeroWorkforceGridBlock: React.FC<Props> = ({
  eyebrow,
  headline,
  subhead,
  cta,
  theme,
  speed,
  columns,
  cards,
}) => {
  if (!headline) return null

  const words = headline.trim().split(/\s+/)
  const columnCount = Number(columns) === 2 || Number(columns) === 4 ? Number(columns) : 3
  const cols = distribute((cards || []).filter((c) => c && c.title), columnCount)
  const href = resolveHref(cta)
  const mult = SPEED_MULT[speed || 'medium'] || SPEED_MULT.medium

  return (
    <section className="ncx-hwg" data-theme={theme || 'dark'}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');

        .ncx-hwg{
          --crimson:#C62828;
          --h-bg:#1A2035;--h-text:#fff;--h-sub:#C9CEDC;--h-muted:#A7AEC2;
          --h-eyebrow:#F3B6B3;--h-glow-1:rgba(198,40,40,.16);--h-glow-2:rgba(70,95,180,.2);
          --card-bg:#212843;--card-border:rgba(255,255,255,.1);--card-shadow:none;
          --card-hover-bg:#242C4C;--card-hover-border:rgba(224,96,90,.5);
          --ic-bg:rgba(198,40,40,.16);--ic-fg:#F3B6B3;
          --btn-bg:var(--crimson);--btn-fg:#fff;--btn-bg-hover:#B02222;
          position:relative;overflow:hidden;isolation:isolate;
          background:var(--h-bg);color:var(--h-text);
          font-family:Inter,Arial,sans-serif}

        .ncx-hwg[data-theme="red"]{
          --h-bg:#7A1616;--h-text:#fff;--h-sub:#F3D4D2;--h-muted:#E8B9B6;
          --h-eyebrow:#FFE1DE;--h-glow-1:rgba(255,255,255,.1);--h-glow-2:rgba(0,0,0,.18);
          --card-bg:rgba(255,255,255,.1);--card-border:rgba(255,255,255,.22);--card-shadow:none;
          --card-hover-bg:rgba(255,255,255,.16);--card-hover-border:rgba(255,255,255,.5);
          --ic-bg:rgba(255,255,255,.18);--ic-fg:#fff;
          --btn-bg:#fff;--btn-fg:#7A1616;--btn-bg-hover:#F2E5E4}

        .ncx-hwg[data-theme="white"]{
          --h-bg:#F5F5F7;--h-text:#171A2B;--h-sub:#454B63;--h-muted:#6B7185;
          --h-eyebrow:#B0201F;--h-glow-1:rgba(198,40,40,.07);--h-glow-2:rgba(70,95,180,.08);
          --card-bg:#fff;--card-border:rgba(23,26,43,.08);
          --card-shadow:0 10px 26px -14px rgba(23,26,43,.18);
          --card-hover-bg:#fff;--card-hover-border:rgba(198,40,40,.35);
          --ic-bg:rgba(198,40,40,.09);--ic-fg:#C62828;
          --btn-bg:var(--crimson);--btn-fg:#fff;--btn-bg-hover:#B02222}

        .ncx-hwg .bg{position:absolute;inset:0;z-index:0;pointer-events:none;
          background:
            radial-gradient(650px 500px at 90% 0%,var(--h-glow-1),transparent 70%),
            radial-gradient(700px 550px at 0% 100%,var(--h-glow-2),transparent 70%)}

        .ncx-hwg .inner{position:relative;z-index:1;max-width:1280px;margin:0 auto;
          padding:clamp(48px,7vw,88px) 24px;display:grid;
          grid-template-columns:minmax(0,.85fr) minmax(0,1.15fr);
          gap:clamp(28px,4vw,56px);align-items:center}

        .ncx-hwg .eyebrow{display:inline-flex;align-items:center;gap:8px;margin:0 0 16px;
          font-family:Poppins,Arial,sans-serif;font-size:14px;font-weight:600;color:var(--h-eyebrow)}
        .ncx-hwg .eyebrow::before{content:"";width:8px;height:8px;border-radius:50%;
          background:var(--crimson);box-shadow:0 0 0 4px rgba(198,40,40,.25)}
        .ncx-hwg h1{font-family:Poppins,Arial,sans-serif;font-weight:600;letter-spacing:-.025em;
          line-height:1.06;font-size:clamp(38px,4.2vw,58px);margin:0 0 20px;
          max-width:11ch;text-wrap:balance;color:var(--h-text)}
        .ncx-hwg .word{display:inline-block;white-space:pre}
        .ncx-hwg .subhead{color:var(--h-sub);font-size:clamp(16px,1.3vw,18px);line-height:1.65;
          margin:0 0 30px;max-width:44ch}
        .ncx-hwg .btn{display:inline-flex;align-items:center;gap:10px;padding:14px 22px;
          border-radius:12px;font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:15.5px;
          text-decoration:none;white-space:nowrap;
          background:var(--btn-bg);color:var(--btn-fg);
          transition:background .2s,transform .2s ease}
        .ncx-hwg .btn:hover{background:var(--btn-bg-hover);transform:translateY(-1px)}
        .ncx-hwg .btn:focus-visible{outline:2px solid currentColor;outline-offset:3px}
        .ncx-hwg .btn svg{flex:none;width:16px;height:16px}

        .ncx-hwg .grid-wrap{position:relative;height:clamp(460px,62vw,620px);
          display:grid;grid-template-columns:repeat(var(--cols,3),1fr);gap:16px;
          -webkit-mask-image:linear-gradient(to bottom,transparent 0,#000 12%,#000 88%,transparent 100%);
          mask-image:linear-gradient(to bottom,transparent 0,#000 12%,#000 88%,transparent 100%)}
        .ncx-hwg .col{position:relative;overflow:hidden;border-radius:4px}
        .ncx-hwg .track{display:flex;flex-direction:column;gap:16px;will-change:transform}
        .ncx-hwg .col[data-dir="up"] .track{animation:ncx-hwg-scroll var(--dur,32s) linear infinite}
        .ncx-hwg .col[data-dir="down"] .track{animation:ncx-hwg-scroll var(--dur,32s) linear infinite reverse}
        .ncx-hwg .col:hover .track,.ncx-hwg .col:focus-within .track{animation-play-state:paused}
        @keyframes ncx-hwg-scroll{to{transform:translateY(-50%)}}

        .ncx-hwg .card{background:var(--card-bg);border:1px solid var(--card-border);
          box-shadow:var(--card-shadow);border-radius:14px;padding:16px 18px;
          transition:border-color .2s,background .2s,box-shadow .2s}
        .ncx-hwg .card:hover,.ncx-hwg .card:focus-within{
          border-color:var(--card-hover-border);background:var(--card-hover-bg)}
        .ncx-hwg .card:focus-visible{outline:2px solid var(--crimson);outline-offset:2px}
        .ncx-hwg .card__ic{width:32px;height:32px;border-radius:9px;background:var(--ic-bg);
          color:var(--ic-fg);display:grid;place-items:center;margin-bottom:10px}
        .ncx-hwg .card__ic svg{width:17px;height:17px}
        .ncx-hwg .card__tag{display:block;font-family:Poppins,Arial,sans-serif;font-size:10.5px;
          letter-spacing:.06em;text-transform:uppercase;color:var(--h-muted);margin-bottom:2px}
        .ncx-hwg .card__title{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:15px;
          margin:0 0 6px;color:var(--h-text)}
        .ncx-hwg .card__desc{font-size:13px;line-height:1.55;color:var(--h-muted);margin:0}

        /* Entrance. Base state is fully visible — this only adds motion once
           the Animator client component marks the block as in view. */
        .ncx-hwg .word{opacity:0;transform:translateY(.5em)}
        .ncx-hwg .subhead,.ncx-hwg .cta-row{opacity:0;transform:translateY(16px)}
        .ncx-hwg .grid-wrap{opacity:0}
        .ncx-hwg .copy.in .word{animation:ncx-hwg-word .75s cubic-bezier(.2,.8,.2,1) forwards;
          animation-delay:calc(var(--i) * 45ms)}
        .ncx-hwg .copy.in .subhead{animation:ncx-hwg-rise .75s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:.3s}
        .ncx-hwg .copy.in .cta-row{animation:ncx-hwg-rise .75s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:.45s}
        .ncx-hwg .copy.in ~ .grid-wrap{
          animation:ncx-hwg-fadein .8s cubic-bezier(.2,.8,.2,1) forwards;animation-delay:.25s}
        @keyframes ncx-hwg-word{to{opacity:1;transform:none}}
        @keyframes ncx-hwg-rise{to{opacity:1;transform:none}}
        @keyframes ncx-hwg-fadein{to{opacity:1}}

        @media(prefers-reduced-motion:reduce){
          .ncx-hwg .track{animation:none!important}
          .ncx-hwg .word,.ncx-hwg .subhead,.ncx-hwg .cta-row,.ncx-hwg .grid-wrap{
            animation:none!important;opacity:1!important;transform:none!important}
          .ncx-hwg .btn{transition:none}
        }

        @media(max-width:980px){
          .ncx-hwg .inner{grid-template-columns:1fr}
          .ncx-hwg .grid-wrap{grid-template-columns:repeat(2,1fr);height:440px}
          .ncx-hwg .col:nth-child(n+3){display:none}
        }

        @media(max-width:640px){
          .ncx-hwg .inner{padding:40px 20px}
          .ncx-hwg .grid-wrap{display:flex;overflow-x:auto;height:auto;gap:12px;
            -webkit-mask-image:none;mask-image:none;padding-bottom:4px;scroll-snap-type:x proximity}
          .ncx-hwg .grid-wrap .col{overflow:visible;min-width:78%;scroll-snap-align:start}
          .ncx-hwg .track{flex-direction:row;animation:none!important;gap:12px}
          .ncx-hwg .card{min-width:100%}
        }
      `}</style>

      <div className="bg" />

      <div className="inner">
        <Animator className="copy">
          <div>
            {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}

            <h1 aria-label={headline}>
              {words.map((word, i) => (
                <React.Fragment key={i}>
                  <span className="word" style={{ '--i': i } as React.CSSProperties} aria-hidden="true">
                    {word}
                  </span>
                  {i < words.length - 1 ? ' ' : ''}
                </React.Fragment>
              ))}
            </h1>

            {subhead ? <p className="subhead">{subhead}</p> : null}

            {href && cta?.label ? (
              <div className="cta-row">
                <a
                  className="btn"
                  href={href}
                  {...(cta.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {cta.label}
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M3 8h10M9 4l4 4-4 4" />
                  </svg>
                </a>
              </div>
            ) : null}
          </div>
        </Animator>

        <div className="grid-wrap" style={{ '--cols': columnCount } as React.CSSProperties}>
          {cols.map((colCards, i) => (
            <div
              className="col"
              data-dir={i % 2 === 0 ? 'up' : 'down'}
              style={{ '--dur': `${(BASE_DURATIONS[i % BASE_DURATIONS.length] / mult).toFixed(1)}s` } as React.CSSProperties}
              key={i}
            >
              <div className="track">
                {colCards.map((card, j) => (
                  <CardTile card={card} key={j} />
                ))}
                {/* An identical clone, so the translateY(-50%) loop has no seam.
                    Hidden from the accessibility tree and skipped in tab order —
                    it is a visual loop trick, not distinct content. */}
                {colCards.map((card, j) => (
                  <CardTile card={card} key={'dup-' + j} hidden />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
