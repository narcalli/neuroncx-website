import React from 'react'
import Image from 'next/image'
import Link from 'next/link'

import { getMany, CMS_TAG } from '@/utilities/cms'
import { pickMedia, type MediaValue } from '@/utilities/media'
import { customerHref, publicCustomerQuery, publicCustomers, sectorIds } from '@/utilities/customers'
import type { CaseStudyGridBlock as CaseStudyGridProps, Customer } from '@/payload-types'

import { TiltAnchor } from './TiltAnchor'

const MAX_CARDS = 6

// The three placeholder gradients from the approved mockup, used as written.
const PLACEHOLDER_CLASSES = ['ncx-cs__img--1', 'ncx-cs__img--2', 'ncx-cs__img--3']

// name is already anonymised by the CMS when Show real name is off, and a
// logo only arrives when it is on. A card links only to a customer with its
// own page.
const CaseCard = ({ c, index, tilt }: { c: Customer; index: number; tilt: boolean }) => {
  const href = customerHref(c)
  const logo = pickMedia(c.image as MediaValue)

  const frame = logo ? (
    <div className="ncx-cs__img ncx-cs__img--logo">
      <Image
        className="ncx-cs__logo"
        src={logo.src}
        alt={c.name}
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
        <span className="ncx-cs__name">{c.name}</span>
      </span>
    </div>
  )

  const inner = (
    <>
      {frame}
      <span className="ncx-cs__body">
        {/* The placeholder art already shows the name; a logo card needs it in text. */}
        {logo ? <span className="ncx-cs__client">{c.name}</span> : null}
        <span className="ncx-cs__title">{c.summary}</span>
        {href ? <span className="ncx-cs__more">Read story &rarr;</span> : null}
      </span>
    </>
  )

  if (!href) return <div className="ncx-cs__card ncx-cs__card--static">{inner}</div>

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
  let docs: (Customer | string | null | undefined)[] = []

  if (populateBy === 'selection') {
    docs = selectedDocs || []
  } else {
    const ids = sectorIds(sectors)
    const query: Record<string, string | number | boolean | undefined> = {
      ...publicCustomerQuery,
      sort: '-updatedAt',
      limit: Math.min(limit || MAX_CARDS, MAX_CARDS),
      depth: 1,
    }
    if (ids.length) query['where[sectors][in]'] = ids.join(',')
    docs = await getMany<Customer>('customers', query, { tags: [CMS_TAG, 'customers'] })
  }

  const items = publicCustomers(docs).slice(0, MAX_CARDS)
  if (!items.length) return null

  const tilt = cardStyle !== 'plain'

  return (
    <section className="ncx-cs">
      <style>{`
        .ncx-cs{
          /* Placeholder artwork ramps. Not UI colour: each needs a second tone to
             make a gradient, and no token pair does that. */
          --art-navy-2:#2E3A63;--art-slate-1:#3E4A6B;--art-slate-2:#7F93AD;--art-crimson-deep:#7A1F1F;
          padding:88px 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-cs__wrap{display:flex;flex-direction:column;gap:40px}
        .ncx-cs__head{display:flex;flex-direction:column;gap:12px;max-width:60ch}
        .ncx-cs__eyebrow{font-weight:600;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ncx-crimson-ink);margin:0}
        .ncx-cs__heading{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:clamp(1.6rem,3vw,2rem);color:var(--ncx-ink);margin:0}
        .ncx-cs__intro{font-size:15px;line-height:1.6;color:var(--ncx-muted);margin:0}
        .ncx-cs__grid{display:grid;grid-template-columns:1fr;gap:32px}
        @media(min-width:860px){.ncx-cs__grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
        .ncx-cs__tilt{height:100%}
        .ncx-cs__card{display:flex;flex-direction:column;gap:20px;text-decoration:none;color:inherit;height:100%}
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
        .ncx-cs__client{font-weight:600;font-size:12px;letter-spacing:.06em;text-transform:uppercase;color:var(--ncx-muted)}
        .ncx-cs__card--static:hover .ncx-cs__img{transform:none}
        .ncx-cs__card--static:hover .ncx-cs__title{color:var(--ncx-ink)}
      `}</style>
      <div className="ncx-cs__wrap ncx-container">
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
