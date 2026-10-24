import React from 'react'

import { getMany, CMS_TAG } from '@/utilities/cms'
import { pickMedia, type MediaValue } from '@/utilities/media'
import { customerHref, publicCustomerQuery, publicCustomers, sectorIds } from '@/utilities/customers'
import type { CaseStudyGridBlock as CaseStudyGridProps, Customer } from '@/payload-types'

import { CaseCard, caseArtVars, caseCardCss } from './CaseCard'

const MAX_CARDS = 6

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
          ${caseArtVars}
          padding:88px 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-cs__wrap{display:flex;flex-direction:column;gap:40px}
        .ncx-cs__head{display:flex;flex-direction:column;gap:12px}
        .ncx-cs__eyebrow{font-weight:600;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ncx-crimson-ink);margin:0}
        .ncx-cs__heading{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:clamp(1.6rem,3vw,2rem);color:var(--ncx-ink);margin:0}
        .ncx-cs__intro{font-size:15px;line-height:1.6;color:var(--ncx-muted);margin:0;max-width:60ch}
        .ncx-cs__grid{display:grid;grid-template-columns:1fr;gap:32px}
        @media(min-width:860px){.ncx-cs__grid{grid-template-columns:repeat(3,minmax(0,1fr))}}
${caseCardCss}`}</style>
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
              <CaseCard
                item={{
                  // name is already anonymised by the CMS when Show real name is
                  // off, and a logo only arrives when it is on. A card links
                  // only to a customer with its own page.
                  id: c.id,
                  label: c.name,
                  title: c.summary,
                  logo: pickMedia(c.image as MediaValue),
                  href: customerHref(c),
                }}
                index={i}
                tilt={tilt}
              />
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
