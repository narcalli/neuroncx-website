import Link from 'next/link'
import React from 'react'

import { CardMotion } from '../CardMotion'
import { Pill } from '../Pill'
import type { CardDesignProps } from '../types'

/**
 * The pill design: the marquee's logo pills as a still, wrapping list. A pill
 * links when its item has its own page. Pills size to their names, so
 * `columns` and `lastRow` do not apply; a short last line sits at the start.
 * A pill is small, so its entrance and hover are the lighter touch CardMotion
 * gives a pill-shaped card: no navy ring, just the rise and the tilt.
 */
export const CardPills: React.FC<CardDesignProps> = ({ items, motion }) => {
  if (!items.length) return null
  return (
    <>
      <style>{`
        .ncx-cpills{list-style:none;margin:0;padding:0;display:flex;flex-wrap:wrap;gap:12px}
        .ncx-cpills > li{max-width:100%}
        .ncx-cpills .ncx-card-motion{box-shadow:none;border-radius:999px}
        .ncx-cpills .ncx-card-motion:hover{box-shadow:none}
        .ncx-cpills a{display:block;border-radius:999px;text-decoration:none;transition:box-shadow .18s ease}
        .ncx-cpills a:hover{box-shadow:var(--ncx-shadow)}
        .ncx-cpills a:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
        @media(prefers-reduced-motion:reduce){.ncx-cpills a{transition:none}}
      `}</style>
      <ul className="ncx-cpills">
        {items.map((it, i) => {
          // Logos are small; skip resizing so any logo format shows as it is.
          const pill = (
            <Pill
              name={it.title}
              initial={it.initial}
              logo={it.logo ? { src: it.logo.src, unoptimized: true } : null}
              wrap
            />
          )
          return (
            <li key={it.id}>
              <CardMotion index={i} motion={motion}>
                {it.href ? <Link href={it.href}>{pill}</Link> : pill}
              </CardMotion>
            </li>
          )
        })}
      </ul>
    </>
  )
}
