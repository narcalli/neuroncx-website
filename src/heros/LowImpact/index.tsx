import React from 'react'

import type { Page } from '@/payload-types'

import RichText from '@/components/RichText'

type LowImpactHeroType = (
  | {
      children?: React.ReactNode
      richText?: never
    }
  | (Omit<Page['hero'], 'richText'> & {
      children?: never
      richText?: Page['hero']['richText']
    })
) & {
  /** Shown first, at the top of the hero (the page's breadcrumbs). */
  leading?: React.ReactNode
}

// The page's 64px top padding clears the header, and mt-16 adds 64px more.
// Breadcrumbs sit 28px under the header, so they pull up the difference.
const LEADING_PULL = { '--crumb-top': 'calc(28px - 4rem)' } as React.CSSProperties

export const LowImpactHero: React.FC<LowImpactHeroType> = ({ children, richText, leading }) => {
  return (
    <div className="ncx-container mt-16" style={leading ? LEADING_PULL : undefined}>
      {leading}
      <div className="max-w-[48rem]">
        {children || (richText && <RichText data={richText} enableGutter={false} />)}
      </div>
    </div>
  )
}
