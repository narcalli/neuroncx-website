import Link from 'next/link'
import React from 'react'

import { Pill } from '../Pill'
import type { CardDesignProps } from '../types'

/**
 * The pill design: the marquee's logo pills as a still, wrapping list. A pill
 * links when its item has its own page. Pills size to their names, so
 * `columns` and `lastRow` do not apply; a short last line sits at the start.
 */
export const CardPills: React.FC<CardDesignProps> = ({ items }) => {
  if (!items.length) return null
  return (
    <>
      <style>{`
        .ncx-cpills{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:12px}
        .ncx-cpills a{display:block;border-radius:12px;text-decoration:none;transition:box-shadow .18s ease}
        .ncx-cpills a:hover{box-shadow:var(--ncx-shadow)}
        .ncx-cpills a:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
        @media(prefers-reduced-motion:reduce){.ncx-cpills a{transition:none}}
      `}</style>
      <ul className="ncx-cpills">
        {items.map((it) => {
          // Logos are small; skip resizing so any logo format shows as it is.
          const pill = (
            <Pill
              name={it.title}
              initial={it.initial}
              logo={it.logo ? { src: it.logo.src, unoptimized: true } : null}
            />
          )
          return <li key={it.id}>{it.href ? <Link href={it.href}>{pill}</Link> : pill}</li>
        })}
      </ul>
    </>
  )
}
