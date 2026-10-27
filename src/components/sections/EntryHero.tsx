import React from 'react'

import { ConversationHeroBlock } from '@/blocks/ConversationHero/Component'
import { HeroCustomBlock } from '@/blocks/HeroCustom/Component'
import { HeroRightPlacementBlock } from '@/blocks/HeroRightPlacement/Component'
import { StatHeroBlock } from '@/blocks/StatHero/Component'
import { Breadcrumbs, type Crumb } from '@/components/Breadcrumbs'

import {
  heroDesignOf,
  toConversationHero,
  toRightPlacementHero,
  toCustomHero,
  toStatsHero,
  type HeroInput,
} from './entryHeroAdapters'

/**
 * The slim bar at the top of every entry hero: the breadcrumb trail, then
 * the entry's Pilot tag (or Planned, in a draft preview). The same in every
 * design; each hero places it under the fixed header.
 */
export const EntryHeroBar: React.FC<{ trail: Crumb[]; flag?: string | null }> = ({ trail, flag }) => (
  <div className="ncx-entrybar">
    <style>{`
      .ncx-entrybar{display:flex;align-items:center;flex-wrap:wrap;gap:8px 14px;
        margin:var(--crumb-top,0px) 0 44px;text-align:left}
      .ncx-entrybar .ncx-crumbs{margin:0}
      .ncx-entrybar__flag{font-family:var(--font-body),Arial,sans-serif;font-size:12px;font-weight:600;
        letter-spacing:.02em;line-height:16px;padding:3px 10px;border-radius:999px;
        color:var(--ncx-crimson-ink);background:var(--ncx-white);border:1px solid currentColor}
      .ncx-entrybar__flag.is-planned{border-style:dashed}
    `}</style>
    <Breadcrumbs items={trail} />
    {flag ? <span className={`ncx-entrybar__flag${flag === 'Planned' ? ' is-planned' : ''}`}>{flag}</span> : null}
  </div>
)

/** An entry's own page hero in its hero design, with the bar on top. The design holds the page's only H1. */
export const EntryHero: React.FC<HeroInput & { bar: React.ReactNode }> = ({ bar, ...input }) => {
  const design = heroDesignOf(input.entry)
  if (design === 'rightPlacement') return <HeroRightPlacementBlock {...toRightPlacementHero(input)} leading={bar} />
  if (design === 'stats') return <StatHeroBlock {...toStatsHero(input)} leading={bar} />
  if (design === 'customCss') return <HeroCustomBlock {...toCustomHero(input)} leading={bar} />
  return <ConversationHeroBlock {...toConversationHero(input)} crumbs={bar} />
}
