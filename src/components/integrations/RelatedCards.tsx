import Link from 'next/link'
import React from 'react'

/** One related integration, as plain values from the page. */
export type RelatedCard = {
  id: string
  name: string
  /** Tagline, else summary. */
  text: string | null
  /** The integration's own page, when it has one. */
  href: string | null
  logoSrc: string | null
}

const GridIcon = () => (
  <svg
    viewBox="0 0 24 24"
    width="24"
    height="24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
  >
    <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" />
    <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" />
    <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" />
  </svg>
)

const Body: React.FC<{ icon: React.ReactNode; name: string; text: string | null }> = ({
  icon,
  name,
  text,
}) => (
  <>
    <span className="ncx-irel__tile" aria-hidden="true">
      {icon}
    </span>
    <span className="ncx-irel__name">{name}</span>
    {text ? <span className="ncx-irel__text">{text}</span> : null}
  </>
)

/**
 * Related integrations as cards, then an "All integrations" card. A card is
 * a link only when that integration has its own page. Cards rise in one
 * after another as the row scrolls into view (CSS only); under reduced
 * motion nothing moves.
 */
export const RelatedCards: React.FC<{ cards: RelatedCard[] }> = ({ cards }) => (
  <>
    <style>{`
      .ncx-irel{list-style:none;margin:0;padding:0;display:grid;gap:16px;grid-template-columns:repeat(4,minmax(0,1fr))}
      .ncx-irel > li{display:flex}
      .ncx-irel__card{flex:1;display:flex;flex-direction:column;align-items:flex-start;gap:12px;
        background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);
        padding:22px;color:inherit;text-decoration:none}
      .ncx-irel__card.is-all{background:transparent;border:1.5px dashed var(--ncx-rule-strong)}
      .ncx-irel__tile{flex:none;width:56px;height:56px;border-radius:14px;background:var(--ncx-crimson-tint);
        color:var(--ncx-crimson-ink);display:flex;align-items:center;justify-content:center;overflow:hidden}
      .ncx-irel__tile img{max-width:36px;max-height:36px;width:auto;height:auto;object-fit:contain}
      .ncx-irel__letter{font-family:var(--font-display),Arial,sans-serif;font-size:22px;font-weight:600}
      .ncx-irel__name{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:18px;
        line-height:1.3;color:var(--ncx-ink)}
      .ncx-irel__text{font-size:15px;line-height:1.55;color:var(--ncx-muted);
        display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;overflow:hidden}

      /* Linked cards only: lift, and the tile turns solid crimson. */
      a.ncx-irel__card:hover{box-shadow:var(--ncx-lift);border-color:var(--ncx-rule-strong);transform:translateY(-4px)}
      a.ncx-irel__card.is-all:hover{border-color:var(--ncx-crimson)}
      a.ncx-irel__card:hover .ncx-irel__tile{background:var(--ncx-crimson);color:var(--ncx-on-navy)}
      a.ncx-irel__card:hover .ncx-irel__tile img{filter:brightness(0) invert(1)}
      a.ncx-irel__card:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}

      @media(prefers-reduced-motion:no-preference){
        a.ncx-irel__card{transition:transform .25s ease,box-shadow .25s ease,border-color .25s ease}
        a.ncx-irel__card .ncx-irel__tile{transition:background .25s ease,color .25s ease}
        /* Each card starts its rise a little further into the scroll than
           the one before, so a row comes in one card after another. */
        @supports (animation-timeline: view()){
          .ncx-irel > li{animation:ncxRelRise linear both;animation-timeline:view();
            animation-range:entry calc(var(--i) * 12%) entry calc(55% + var(--i) * 12%)}
        }
      }
      @media(prefers-reduced-motion:reduce){a.ncx-irel__card:hover{transform:none}}
      @keyframes ncxRelRise{from{opacity:0;transform:translateY(28px)}to{opacity:1;transform:none}}

      @media(max-width:1023.98px){.ncx-irel{grid-template-columns:repeat(2,minmax(0,1fr))}}
      @media(max-width:639.98px){.ncx-irel{grid-template-columns:minmax(0,1fr)}}
    `}</style>
    <ul className="ncx-irel">
      {cards.map((c, i) => {
        const icon = c.logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.logoSrc} alt="" loading="lazy" />
        ) : (
          <span className="ncx-irel__letter">{c.name.charAt(0)}</span>
        )
        return (
          <li key={c.id} style={{ '--i': i % 4 } as React.CSSProperties}>
            {c.href ? (
              <Link className="ncx-irel__card" href={c.href}>
                <Body icon={icon} name={c.name} text={c.text} />
              </Link>
            ) : (
              <div className="ncx-irel__card">
                <Body icon={icon} name={c.name} text={c.text} />
              </div>
            )}
          </li>
        )
      })}
      <li style={{ '--i': cards.length % 4 } as React.CSSProperties}>
        <Link className="ncx-irel__card is-all" href="/integrations">
          <Body
            icon={<GridIcon />}
            name="All integrations"
            text="Phone systems, CRMs, payments and more"
          />
        </Link>
      </li>
    </ul>
  </>
)
