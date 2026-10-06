import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { getMany, CMS_TAG } from '@/utilities/cms'
import { pickMedia, type MediaValue } from '@/utilities/media'
import { publicCaseStudyQuery, publicCases, sectorIds } from '@/utilities/caseStudies'
import type { CaseStudy, CaseStudyGridBlock as CaseStudyGridProps } from '@/payload-types'

import { TiltAnchor } from './TiltAnchor'

const MAX_CARDS = 6

// The three placeholder gradients from the approved mockup, used as written.
const PLACEHOLDER_CLASSES = ['ncx-cs__img--1', 'ncx-cs__img--2', 'ncx-cs__img--3']

const CaseCard = ({ c, index, tilt }: { c: CaseStudy; index: number; tilt: boolean }) => {
  const href = `/customers/${c.slug}`
  const logo = pickMedia(c.logo as MediaValue)
  const title = c.outcomeHeadline || c.title

  const frame = logo ? (
    <div className="ncx-cs__img ncx-cs__img--logo">
      <Image
        className="ncx-cs__logo"
        src={logo.src}
        alt={c.clientName}
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
        <span className="ncx-cs__name">{c.clientName}</span>
      </span>
    </div>
  )

  const inner = (
    <>
      {frame}
      <span className="ncx-cs__body">
        <span className="ncx-cs__title">{title}</span>
        <span className="ncx-cs__more">Read story &rarr;</span>
      </span>
    </>
  )

  return tilt ? (
    <TiltAnchor href={href} className="ncx-cs__card">
      {inner}
    </TiltAnchor>
  ) : (
    <Link href={href} className="ncx-cs__card">
      {inner}
    </Link>
  )
}

export const CaseStudyGridBlock: React.FC<CaseStudyGridProps> = async ({
  eyebrow,
  heading,
  intro,
  populateBy,
  sectors,
  limit,
  selectedDocs,
  cardStyle,
}) => {
  let docs: (CaseStudy | null | undefined)[] = []

  if (populateBy === 'selection') {
    docs = (selectedDocs || []).map((d) => (typeof d === 'object' ? d : null))
  } else {
    const ids = sectorIds(sectors)
    const query: Record<string, string | number | boolean | undefined> = {
      ...publicCaseStudyQuery,
      sort: '-updatedAt',
      limit: Math.min(limit || MAX_CARDS, MAX_CARDS),
      depth: 1,
    }
    if (ids.length) query['where[sectors][in]'] = ids.join(',')
    docs = await getMany<CaseStudy>('caseStudies', query, { tags: [CMS_TAG, 'case-studies'] })
  }

  const items = publicCases(docs).slice(0, MAX_CARDS)
  if (!items.length) return null

  const tilt = cardStyle !== 'plain'

  return (
    <section className="ncx-cs">
      <style>{`
        .ncx-cs{padding:88px 0;background:#fff;font-family:Inter,Arial,sans-serif;color:#1A1A2E}
        .ncx-cs__wrap{max-width:1120px;margin:0 auto;padding:0 24px;display:flex;flex-direction:column;gap:40px}
        .ncx-cs__head{display:flex;flex-direction:column;gap:12px;max-width:60ch}
        .ncx-cs__eyebrow{font-weight:600;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ncx-crimson);margin:0}
        .ncx-cs__heading{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:clamp(1.6rem,3vw,2rem);color:var(--ncx-navy);margin:0}
        .ncx-cs__intro{font-size:15px;line-height:1.6;color:var(--ncx-muted);margin:0}
        .ncx-cs__grid{display:grid;grid-template-columns:1fr;gap:32px}
        @media(min-width:860px){.ncx-cs__grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
        .ncx-cs__tilt{height:100%}
        .ncx-cs__card{display:flex;flex-direction:column;gap:20px;text-decoration:none;color:inherit;height:100%}
        .ncx-cs__img{width:100%;aspect-ratio:4/3.2;border-radius:12px;overflow:hidden;display:flex;align-items:center;justify-content:center;transition:transform .35s ease}
        .ncx-cs__card:hover .ncx-cs__img{transform:scale(1.03)}
        .ncx-cs__img--1{background:radial-gradient(ellipse at 22% 28%,rgba(255,255,255,0.20) 0%,transparent 50%),radial-gradient(ellipse at 80% 75%,rgba(198,40,40,0.40) 0%,transparent 55%),linear-gradient(135deg,#1A2035 0%,#2E3A63 100%)}
        .ncx-cs__img--2{background:radial-gradient(ellipse at 75% 25%,rgba(255,255,255,0.22) 0%,transparent 50%),radial-gradient(ellipse at 25% 80%,rgba(37,49,79,0.55) 0%,transparent 55%),linear-gradient(135deg,#3E4A6B 0%,#7F93AD 100%)}
        .ncx-cs__img--3{background:radial-gradient(ellipse at 25% 25%,rgba(255,255,255,0.18) 0%,transparent 50%),radial-gradient(ellipse at 78% 72%,rgba(26,32,53,0.55) 0%,transparent 55%),linear-gradient(135deg,#7A1F1F 0%,#C62828 100%)}
        .ncx-cs__img--logo{background:#fff;border:1px solid #E8E9EF;padding:24px}
        .ncx-cs__logo{width:auto;height:auto;max-width:80%;max-height:70%;object-fit:contain}
        .ncx-cs__lockup{display:flex;align-items:center;gap:10px}
        .ncx-cs__dot{width:30px;height:30px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;flex-shrink:0}
        .ncx-cs__dot span{width:10px;height:10px;border-radius:50%;background:var(--ncx-navy);display:block}
        .ncx-cs__name{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:20px;color:#fff;letter-spacing:-.01em}
        .ncx-cs__body{display:flex;flex-direction:column;gap:8px}
        .ncx-cs__title{font-family:Poppins,Arial,sans-serif;font-weight:600;font-size:18px;line-height:1.4;color:var(--ncx-navy);transition:color .2s ease}
        .ncx-cs__card:hover .ncx-cs__title{color:var(--ncx-crimson)}
        .ncx-cs__more{font-weight:500;font-size:14px;color:var(--ncx-crimson)}
      `}</style>
      <div className="ncx-cs__wrap">
        {eyebrow || heading || intro ? (
          <header className="ncx-cs__head">
            {eyebrow ? <p className="ncx-cs__eyebrow">{eyebrow}</p> : null}
            {heading ? <h2 className="ncx-cs__heading">{heading}</h2> : null}
            {intro ? <p className="ncx-cs__intro">{intro}</p> : null}
          </header>
        ) : null}
        <ol className="ncx-cs__grid">
          {items.map((c, i) => (
            <li key={c.id}>
              <CaseCard c={c} index={i} tilt={tilt} />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
