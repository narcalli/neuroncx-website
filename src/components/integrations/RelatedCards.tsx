import Link from 'next/link'
import React from 'react'

import { CardFlag } from '@/components/cards/Flag'
import { CardMotion } from '@/components/cards/CardMotion'
import { KeyPointList } from '@/components/cards/KeyPoints'
import { initialOf } from '@/components/cards/types'
import type { MotionSetting } from '@/motion/levels'

/** One related integration, as plain values from the page. */
export type RelatedCard = {
  id: string
  name: string
  /** Tagline, else summary. */
  text: string | null
  /** The integration's own page, when it has one. */
  href: string | null
  logoSrc: string | null
  /** A status pill after the name, such as Pilot. */
  flag?: string | null
  /** Key points listed under the text (the logo card design's "Show key points"). */
  keyPoints?: string[] | null
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

const Body: React.FC<{
  icon: React.ReactNode
  /** No logo file: the tile shows the initial, in a neutral colour, and carries the name. */
  lettered?: boolean
  name: string
  text: string | null
  flag?: string | null
  keyPoints?: string[] | null
  fullText?: boolean
}> = ({ icon, lettered, name, text, flag, keyPoints, fullText }) => (
  <>
    {lettered ? (
      <span className="ncx-irel__tile is-letter" role="img" aria-label={name}>
        {icon}
      </span>
    ) : (
      <span className="ncx-irel__tile" aria-hidden="true">
        {icon}
      </span>
    )}
    <span className="ncx-irel__name">
      {name}
      <CardFlag text={flag} />
    </span>
    {text ? <span className={fullText ? 'ncx-irel__text is-full' : 'ncx-irel__text'}>{text}</span> : null}
    <KeyPointList points={keyPoints} gapAbove={12} />
  </>
)

/**
 * Related integrations as cards, then an "All integrations" card. A card is
 * a link only when that integration has its own page. Cards rise in one
 * after another as the row scrolls into view (CSS only); under reduced
 * motion nothing moves.
 *
 * Also the logo card design (components/cards), which can leave out the end
 * card (`showAllLink`) and set the cards per row on wide screens (`columns`,
 * 4 by default). With `fullText` (the design's "Show key points" on) the
 * text is not cut at 3 lines, and each card lists its key points under it.
 */
export const RelatedCards: React.FC<{
  cards: RelatedCard[]
  showAllLink?: boolean
  columns?: 2 | 3 | 4
  fullText?: boolean
  /** The block's own Motion panel, where it has one. */
  motion?: MotionSetting | null
}> = ({ cards, showAllLink = true, columns, fullText = false, motion }) => (
  <>
    <style>{`
      .ncx-irel{list-style:none;margin:0;padding:0;display:grid;gap:16px;grid-template-columns:repeat(var(--irel-cols,4),minmax(0,1fr))}
      .ncx-irel > li{display:flex}
      .ncx-irel__card{flex:1;display:flex;flex-direction:column;align-items:flex-start;gap:12px;
        background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);
        padding:22px;color:inherit;text-decoration:none}
      .ncx-irel__card.is-all{background:transparent;border:1.5px dashed var(--ncx-rule-strong)}
      .ncx-irel__tile{flex:none;width:56px;height:56px;border-radius:14px;background:var(--ncx-crimson-tint);
        color:var(--ncx-crimson-ink);display:flex;align-items:center;justify-content:center;overflow:hidden}
      .ncx-irel__tile img{max-width:36px;max-height:36px;width:auto;height:auto;object-fit:contain}
      .ncx-irel__tile.is-letter{background:var(--ncx-cloud);color:var(--ncx-muted)}
      .ncx-irel__letter{font-family:var(--font-display),Arial,sans-serif;font-size:22px;font-weight:600}
      .ncx-irel__name{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:18px;
        line-height:1.3;color:var(--ncx-ink)}
      .ncx-irel__text{font-size:15px;line-height:1.55;color:var(--ncx-muted);
        display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:3;line-clamp:3;overflow:hidden}
      .ncx-irel__text.is-full{display:block;-webkit-line-clamp:unset;line-clamp:none;overflow:visible}

      /* Linked cards only: the tile turns solid crimson. The rise and the
         tilt on hover are CardMotion's (components/cards/CardMotion.tsx). */
      a.ncx-irel__card:hover{border-color:var(--ncx-rule-strong)}
      a.ncx-irel__card.is-all:hover{border-color:var(--ncx-crimson)}
      a.ncx-irel__card:hover .ncx-irel__tile{background:var(--ncx-crimson);color:var(--ncx-on-navy)}
      a.ncx-irel__card:hover .ncx-irel__tile img{filter:brightness(0) invert(1)}
      a.ncx-irel__card:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
      a.ncx-irel__card{transition:border-color .25s ease}
      a.ncx-irel__card .ncx-irel__tile{transition:background .25s ease,color .25s ease}
      @media(prefers-reduced-motion:reduce){a.ncx-irel__card{transition:none}}

      @media(max-width:1023.98px){.ncx-irel{grid-template-columns:repeat(var(--irel-mid,2),minmax(0,1fr))}}
      @media(max-width:639.98px){.ncx-irel{grid-template-columns:minmax(0,1fr)}}
    `}</style>
    <ul
      className="ncx-irel"
      style={
        columns
          ? ({ '--irel-cols': columns, '--irel-mid': Math.min(columns, 2) } as React.CSSProperties)
          : undefined
      }
    >
      {cards.map((c, i) => {
        const icon = c.logoSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={c.logoSrc} alt="" loading="lazy" />
        ) : (
          <span className="ncx-irel__letter">{initialOf(c.name)}</span>
        )
        return (
          <li key={c.id}>
            <CardMotion index={i} motion={motion} tilt={Boolean(c.href)}>
              {c.href ? (
                <Link className="ncx-irel__card" href={c.href}>
                  <Body icon={icon} lettered={!c.logoSrc} name={c.name} text={c.text} flag={c.flag} keyPoints={c.keyPoints} fullText={fullText} />
                </Link>
              ) : (
                <div className="ncx-irel__card">
                  <Body icon={icon} lettered={!c.logoSrc} name={c.name} text={c.text} flag={c.flag} keyPoints={c.keyPoints} fullText={fullText} />
                </div>
              )}
            </CardMotion>
          </li>
        )
      })}
      {showAllLink ? (
        <li>
          <CardMotion index={cards.length} motion={motion}>
            <Link className="ncx-irel__card is-all" href="/integrations">
              <Body
                icon={<GridIcon />}
                name="All integrations"
                text="Phone systems, CRMs, payments and more"
              />
            </Link>
          </CardMotion>
        </li>
      ) : null}
    </ul>
  </>
)
