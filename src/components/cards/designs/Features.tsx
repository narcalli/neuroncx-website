import React from 'react'

import { cardTokens, OptionCard } from '@/components/blocks/OptionCard/OptionCard'
import type { CardOptionFields } from '@/components/blocks/OptionCard/types'

import type { CardDesignProps } from '../types'

/**
 * The feature design: the Bento Grid and Card Grid card. The logo sits where
 * the icon tile goes (the icon is used when there is no logo), the badge is
 * the eyebrow, the tagline or text is the body, and chips become pills. A
 * card shows a link only when its item has its own page.
 *
 * `look` sets the colour, border and accent line for every card; white with
 * a shadow by default. Cards with gaps, so `lastRow` does not apply.
 */
export const CardFeatures: React.FC<CardDesignProps> = ({ items, columns = 3, look }) => {
  if (!items.length) return null
  return (
    <>
      <style>{`
        .ncx-cfeat{list-style:none;margin:0;padding:0;display:grid;gap:20px;
          grid-template-columns:repeat(var(--cfeat-cols),minmax(0,1fr))}
        .ncx-cfeat > li{display:flex}
        .ncx-cfeat > li > *{flex:1}
        @media(max-width:1023.98px){.ncx-cfeat{grid-template-columns:repeat(var(--cfeat-mid),minmax(0,1fr))}}
        @media(max-width:639.98px){.ncx-cfeat{grid-template-columns:minmax(0,1fr)}}
      `}</style>
      <ul
        className={`ncx-cfeat ${cardTokens}`}
        style={
          { '--cfeat-cols': columns, '--cfeat-mid': Math.min(columns, 2) } as React.CSSProperties
        }
      >
        {items.map((it) => {
          const options: CardOptionFields = {
            cardColor: look?.cardColor || 'white',
            border: look?.border || 'none',
            borderColor: look?.borderColor || null,
            accentLine: look?.accentLine || false,
            showEyebrow: Boolean(it.badge),
            tag: it.badge || null,
            showPoints: Boolean(it.chips?.length),
            points: (it.chips || []).map((text) => ({ text })),
            listStyle: 'pills',
          }
          return (
            <li key={it.id}>
              <OptionCard
                options={options}
                number={null}
                title={it.title}
                body={it.tagline || it.text || null}
                icon={it.logo ? null : it.icon || null}
                // Decorative: the title right below names the item.
                logo={it.logo ? { src: it.logo.src, alt: '' } : null}
                link={it.href ? { label: it.linkLabel || 'Learn more', url: it.href } : null}
                defaultColor="white"
              />
            </li>
          )
        })}
      </ul>
    </>
  )
}
