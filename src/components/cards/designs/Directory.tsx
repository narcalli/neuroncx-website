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
        .ncx-cdir{display:flex;flex-direction:column;gap:32px;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}`}</style>
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
