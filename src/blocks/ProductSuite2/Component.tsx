import React from 'react'

import { cardNumbers, cardTokens, OptionCard } from '@/components/blocks/OptionCard/OptionCard'
import type { CardLinkData, CardOptionFields } from '@/components/blocks/OptionCard/types'

type Card = CardOptionFields & {
  icon?: string | null
  title?: string | null
  description?: string | null
  link?: CardLinkData | null
  id?: string | null
}

type Props = {
  eyebrow?: string | null
  heading?: string | null
  intro?: string | null
  cards?: Card[] | null
}

export const ProductSuite2Block: React.FC<Props> = ({ eyebrow, heading, intro, cards }) => {
  const items = (cards || []).filter((c) => c && c.title)
  if (!items.length) return null

  const numbers = cardNumbers(items)

  return (
    <section className="ncx-suite2">
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600&display=swap');
        .ncx-suite2{--crimson:#C62828;--soft:#F4F6FB;--ink:#0B1F3A;--muted:#5B6478;
          background:var(--soft);padding:56px 32px;
          font-family:Inter,Arial,sans-serif;color:var(--ink)}
        .ncx-suite2 .inner{max-width:1120px;margin:0 auto}
        .ncx-suite2 .eyebrow{font-family:Poppins,Arial,sans-serif;font-size:14px;font-weight:600;
          margin:0 0 12px;color:var(--crimson)}
        .ncx-suite2 h2{font-family:Poppins,Arial,sans-serif;font-weight:700;
          font-size:clamp(26px,3.2vw,38px);letter-spacing:-.02em;line-height:1.15;margin:0;max-width:26ch}
        .ncx-suite2 .intro{color:var(--muted);margin:14px 0 0;max-width:62ch;font-size:16.5px;line-height:1.65}

        .ncx-suite2 .grid{margin-top:40px;display:grid;
          grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:20px;align-items:stretch}

        @media(max-width:900px){
          .ncx-suite2{padding:40px 20px}
          .ncx-suite2 .grid{margin-top:28px}
        }
      `}</style>

      <div className="inner">
        {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
        {heading ? <h2>{heading}</h2> : null}
        {intro ? <p className="intro">{intro}</p> : null}

        <div className={`grid ${cardTokens}`}>
          {items.map((card, i) => (
            <OptionCard
              key={card.id || i}
              options={card}
              number={numbers[i]}
              defaultColor="white"
              icon={card.icon}
              title={card.title || ''}
              body={card.description}
              link={card.link?.url ? { ...card.link, label: card.link.label || 'Learn more' } : null}
            />
          ))}
        </div>
      </div>
    </section>
  )
}
