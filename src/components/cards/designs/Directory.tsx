import React from 'react'

import { DirectoryList } from '@/blocks/CustomerDirectory/DirectoryList'
import { directoryListCss } from '@/blocks/CustomerDirectory/styles'

import type { CardDesignProps } from '../types'

/**
 * The directory design: the customer directory's cards, with filter pills
 * above them. Each item's badge is its tag and becomes a filter, so items
 * filter by, for example, category. The filters show only when there are at
 * least two tags to choose between (a block grouped by category has one per
 * group, under its heading). A title links when its item has its own page.
 * Cards with gaps, so `lastRow` does not apply.
 */
export const CardDirectory: React.FC<
  CardDesignProps & { layout?: 'grid' | 'list'; filterLabel?: string }
> = ({ items, columns, layout = 'grid', filterLabel = 'Filter by category', motion }) => {
  if (!items.length) return null
  const tags = new Set(items.map((it) => it.badge).filter(Boolean))
  return (
    <div className="ncx-cdir">
      <style>{`${directoryListCss}
        .ncx-cdir{display:flex;flex-direction:column;gap:32px;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        /* The pills are buttons: a crimson ring for the keyboard, and a slightly darker border on hover (resting
           pills only; the fill never changes). */
        .ncx-cdir .ncx-dir__pills button{transition:border-color .15s ease}
        .ncx-cdir .ncx-dir__pills button:focus-visible{outline:2px solid var(--ncx-crimson);outline-offset:2px}
        @media(hover:hover){.ncx-cdir .ncx-dir__pills button:not(.is-active):hover{border-color:var(--ncx-rule-strong)}}
        @media(prefers-reduced-motion:reduce){.ncx-cdir .ncx-dir__pills button{transition:none}}
        /* 900px and below: one row that scrolls sideways instead of wrapping, out to the screen edge past the
           container's 20px, with the first pill still on the heading's edge. The 4px above and below keep the
           focus ring from being clipped; the negative margins give that space back, so nothing moves. */
        @media(max-width:900px){
          .ncx-cdir .ncx-dir__pills{flex-wrap:nowrap;overflow-x:auto;margin:-4px -20px;padding:4px 20px;
            scroll-padding-inline:20px;scrollbar-width:none}
          .ncx-cdir .ncx-dir__pills::-webkit-scrollbar{display:none}
          .ncx-cdir .ncx-dir__pills button{flex:none;white-space:nowrap}
        }`}</style>
      <DirectoryList
        rows={items.map((it) => ({
          id: it.id,
          href: it.href || null,
          name: it.title,
          summary: it.text || it.tagline || '',
          sectors: it.badge ? [{ id: it.badge, name: it.badge }] : [],
        }))}
        showFilters={tags.size > 1}
        layout={layout}
        emptyStateText="Nothing to show yet."
        columns={columns}
        filterLabel={filterLabel}
        motion={motion}
      />
    </div>
  )
}
