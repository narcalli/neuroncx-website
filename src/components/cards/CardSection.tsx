import React from 'react'

import type { CardDesignSettings } from './defaults'
import { CardDesign, type CardDesignName } from './registry'
import type { CardColumns, CardItem } from './types'

type Group = { design: CardDesignName; items: CardItem[] }

/**
 * One section's cards, in the section's design, or grouped by design when
 * items bring their own.
 *
 * With allowItemDesigns off, or a whole-list design (directory, pill), the
 * section draws one design as before. Otherwise each item uses its
 * preferredDesign, else the section's design, and the items are grouped by
 * design: groups in the order each design first appears, items in their
 * order inside a group. Every group uses the section's settings, only the
 * design changes. A section that ends up with one group draws exactly as
 * before; with more, an empty "cards per row" becomes 3 for every group, so
 * the groups line up. The "All integrations" card closes the last logo card
 * group only.
 */
export const CardSection: React.FC<{ items: CardItem[]; settings: CardDesignSettings }> = ({
  items,
  settings,
}) => {
  const { design, columns, lastRow, look, showAllLink, allowItemDesigns } = settings
  // The look only means something to the feature card, as before.
  const layoutFor = (d: CardDesignName, cols: CardColumns | undefined, allLink: boolean) => ({
    columns: cols,
    lastRow,
    look: d === 'feature' ? look : undefined,
    showAllLink: allLink,
  })

  const groups: Group[] = []
  if (allowItemDesigns && design !== 'directory' && design !== 'pill') {
    for (const item of items) {
      const own = item.preferredDesign || design
      let group = groups.find((g) => g.design === own)
      if (!group) {
        group = { design: own, items: [] }
        groups.push(group)
      }
      group.items.push(item)
    }
  }

  if (groups.length < 2) {
    const only = groups[0]?.design ?? design
    return <CardDesign design={only} items={items} {...layoutFor(only, columns ?? undefined, showAllLink)} />
  }

  const cols = columns ?? 3
  const lastLogoGroup = groups.map((g) => g.design).lastIndexOf('logoCard')
  return (
    <div className="ncx-csection">
      <style>{`.ncx-csection{display:grid;grid-template-columns:minmax(0,1fr);row-gap:18px}`}</style>
      {groups.map((g, i) => (
        <CardDesign
          key={g.design}
          design={g.design}
          items={g.items}
          {...layoutFor(g.design, cols, showAllLink && i === lastLogoGroup)}
        />
      ))}
    </div>
  )
}
