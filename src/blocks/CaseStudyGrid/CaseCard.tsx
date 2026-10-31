import Image from 'next/image'
import Link from 'next/link'
import React from 'react'

import { CardMotion } from '@/components/cards/CardMotion'
import { KeyPointList } from '@/components/cards/KeyPoints'
import type { MotionSetting } from '@/motion/levels'

/**
 * One case study card: a logo on a white frame (or, without a logo, one of
 * three placeholder gradients with the name on it), then the name as a small
 * label, the title, and a link line when the card has somewhere to go.
 *
 * Used by the Case Study Grid block (customers) and the story card design.
 * `caseCardCss` holds its styles and `caseArtVars` the placeholder colours;
 * whatever wraps the cards includes both.
 */

/** Placeholder artwork ramps. Not UI colour: each needs a second tone to make a gradient. */
export const caseArtVars =
  '--art-navy-2:#2E3A63;--art-slate-1:#3E4A6B;--art-slate-2:#7F93AD;--art-crimson-deep:#7A1F1F;'

export type CaseCardItem = {
  id: string
  /** The name: on the placeholder art, or as a small label above the title when there is a logo. */
  label: string
  title: string
  logo?: {
    src: string
    width?: number | null
    height?: number | null
    unoptimized?: boolean
  } | null
  /** Only when the card has its own page. */
  href?: string | null
  /** Key points listed under the title, above the link (the story design's "Show key points"). */
  keyPoints?: string[] | null
}

// The three placeholder gradients from the approved mockup, used as written.
const PLACEHOLDER_CLASSES = ['ncx-cs__img--1', 'ncx-cs__img--2', 'ncx-cs__img--3']

export const CaseCard = ({
  item,
  index,
  tilt,
  linkLabel = 'Read story →',
  motion,
}: {
  item: CaseCardItem
  index: number
  tilt: boolean
  linkLabel?: string
  /** The block's own Motion panel, where it has one. */
  motion?: MotionSetting | null
}) => {
  const { href, logo } = item

  const frame = logo ? (
    <div className="ncx-cs__img ncx-cs__img--logo">
      <Image
        className="ncx-cs__logo"
        src={logo.src}
        alt={item.label}
        width={logo.width || 400}
        height={logo.height || 200}
        sizes="(min-width: 860px) 33vw, 100vw"
        unoptimized={logo.unoptimized}
      />
    </div>
  ) : (
    <div className={`ncx-cs__img ${PLACEHOLDER_CLASSES[index % PLACEHOLDER_CLASSES.length]}`}>
      <span className="ncx-cs__lockup">
        <span className="ncx-cs__dot" aria-hidden="true">
          <span />
        </span>
        <span className="ncx-cs__name">{item.label}</span>
      </span>
    </div>
  )

  const inner = (
    <>
      {frame}
      <div className="ncx-cs__body">
        {/* The placeholder art already shows the name; a logo card needs it in text. */}
        {logo ? <span className="ncx-cs__client">{item.label}</span> : null}
        <span className="ncx-cs__title">{item.title}</span>
        <KeyPointList points={item.keyPoints} gapAbove={8} />
        {href ? <span className="ncx-cs__more">{linkLabel}</span> : null}
      </div>
    </>
  )

  if (!href) {
    return (
      <CardMotion index={index} motion={motion} tilt={false}>
        <div className="ncx-cs__card ncx-cs__card--static">{inner}</div>
      </CardMotion>
    )
  }

  return (
    <CardMotion index={index} motion={motion} tilt={tilt}>
      <Link href={href} className="ncx-cs__card">
        {inner}
      </Link>
    </CardMotion>
  )
}

/** The card's styles, for the element that wraps the cards. */
export const caseCardCss = `        .ncx-cs__card{display:flex;flex-direction:column;gap:20px;text-decoration:none;color:inherit;height:100%}
        .ncx-cs__img{width:100%;aspect-ratio:4/3.2;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;transition:transform .35s ease}
        .ncx-cs__card:hover .ncx-cs__img{transform:scale(1.03)}
        .ncx-cs__img--1{background:radial-gradient(ellipse at 22% 28%,rgba(255,255,255,0.20) 0%,transparent 50%),radial-gradient(ellipse at 80% 75%,rgba(198,40,40,0.40) 0%,transparent 55%),linear-gradient(135deg,var(--ncx-navy) 0%,var(--art-navy-2) 100%)}
        .ncx-cs__img--2{background:radial-gradient(ellipse at 75% 25%,rgba(255,255,255,0.22) 0%,transparent 50%),radial-gradient(ellipse at 25% 80%,rgba(37,49,79,0.55) 0%,transparent 55%),linear-gradient(135deg,var(--art-slate-1) 0%,var(--art-slate-2) 100%)}
        .ncx-cs__img--3{background:radial-gradient(ellipse at 25% 25%,rgba(255,255,255,0.18) 0%,transparent 50%),radial-gradient(ellipse at 78% 72%,rgba(26,32,53,0.55) 0%,transparent 55%),linear-gradient(135deg,var(--art-crimson-deep) 0%,var(--ncx-crimson) 100%)}
        .ncx-cs__img--logo{background:var(--ncx-white);border:1px solid var(--ncx-rule);padding:24px}
        .ncx-cs__logo{width:auto;height:auto;max-width:80%;max-height:70%;object-fit:contain}
        .ncx-cs__lockup{display:flex;align-items:center;gap:10px}
        .ncx-cs__dot{width:30px;height:30px;border-radius:50%;background:var(--ncx-white);display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .ncx-cs__dot span{width:10px;height:10px;border-radius:50%;background:var(--ncx-navy);display:block}
        .ncx-cs__name{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:20px;color:var(--ncx-on-navy);letter-spacing:-.01em}
        .ncx-cs__body{display:flex;flex-direction:column;gap:8px}
        .ncx-cs__title{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:18px;line-height:1.4;color:var(--ncx-ink);transition:color .2s ease}
        .ncx-cs__card:hover .ncx-cs__title{color:var(--ncx-link)}
        .ncx-cs__more{font-weight:500;font-size:14px;color:var(--ncx-link)}
        /* With key points, the body fills the card and the link line sits at its foot. */
        .ncx-cs__body:has(.ncx-keypts){flex:1}
        .ncx-cs__body:has(.ncx-keypts) .ncx-cs__more{margin-top:auto;padding-top:6px}
        .ncx-cs__client{font-weight:600;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ncx-muted)}
        .ncx-cs__card--static:hover .ncx-cs__img{transform:none}
        .ncx-cs__card--static:hover .ncx-cs__title{color:var(--ncx-ink)}
      `
