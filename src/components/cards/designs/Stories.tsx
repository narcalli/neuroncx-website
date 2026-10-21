import React from 'react'

import { CaseCard, caseArtVars, caseCardCss } from '@/blocks/CaseStudyGrid/CaseCard'

import type { CardDesignProps } from '../types'

/**
 * The story design: the case study card. A logo on a white frame (or, without
 * a logo, one of the placeholder gradients with the title on it), then the
 * title as a small label, the tagline or text as the headline, and a link
 * line when the item has its own page. With `tilt` (on by default) a linked
 * card tilts towards the pointer. Cards with gaps, so `lastRow` does not
 * apply.
 */
export const CardStories: React.FC<CardDesignProps & { tilt?: boolean }> = ({
  items,
  columns = 3,
  tilt = true,
}) => {
  if (!items.length) return null
  return (
    <div className="ncx-cstory" style={{ '--cstory-cols': columns } as React.CSSProperties}>
      <style>{`
        .ncx-cstory{${caseArtVars}font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-cstory__grid{list-style:none;margin:0;padding:0;display:grid;gap:32px;grid-template-columns:1fr}
        @media(min-width:860px){.ncx-cstory__grid{grid-template-columns:repeat(var(--cstory-cols),minmax(0,1fr))}}
        ${caseCardCss}
      `}</style>
      <ol className="ncx-cstory__grid">
        {items.map((it, i) => (
          <li key={it.id}>
            <CaseCard
              item={{
                id: it.id,
                label: it.title,
                title: it.tagline || it.text || it.title,
                // Logos are small; skip resizing so any logo format shows as it is.
                logo: it.logo ? { src: it.logo.src, unoptimized: true } : null,
                href: it.href || null,
              }}
              index={i}
              tilt={tilt}
              linkLabel={it.linkLabel || undefined}
            />
          </li>
        ))}
      </ol>
    </div>
  )
}
