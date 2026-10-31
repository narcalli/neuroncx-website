'use client'

import React, { useState } from 'react'
import Link from 'next/link'

import { CardMotion } from '@/components/cards/CardMotion'
import type { MotionSetting } from '@/motion/levels'

export type DirectoryRow = {
  id: string
  /** Set only for a customer with its own page. */
  href: string | null
  name: string
  summary: string
  sectors: { id: string; name: string }[]
}

type Props = {
  rows: DirectoryRow[]
  showFilters: boolean
  layout: 'list' | 'grid'
  emptyStateText: string
  /** Cards per row on wide screens in the grid layout; 3 when not set. */
  columns?: 2 | 3 | 4
  /** The accessible name of the filter pills. */
  filterLabel?: string
  /** The block's own Motion panel, where it has one. The grid layout's cards respect it (CardMotion.tsx). */
  motion?: MotionSetting | null
}

/**
 * Filter pills and the list or grid of customers. Filtering happens here, on
 * the rows already fetched, so clicking a pill never reloads the page. Its
 * styles are directoryListCss (styles.ts). Also the directory card design
 * (components/cards), where the filters are categories.
 */
export const DirectoryList: React.FC<Props> = ({
  rows,
  showFilters,
  layout,
  emptyStateText,
  columns,
  filterLabel = 'Filter by sector',
  motion,
}) => {
  const [active, setActive] = useState<string>('all')

  // Distinct sectors across the rows, in the order they first appear.
  const sectorMap = new Map<string, string>()
  rows.forEach((r) => r.sectors.forEach((s) => sectorMap.set(s.id, s.name)))
  const sectors = Array.from(sectorMap, ([id, name]) => ({ id, name }))

  const visible = active === 'all' ? rows : rows.filter((r) => r.sectors.some((s) => s.id === active))

  return (
    <>
      {showFilters && sectors.length > 0 ? (
        <div className="ncx-dir__pills" role="group" aria-label={filterLabel}>
          <button
            type="button"
            className={active === 'all' ? 'is-active' : undefined}
            aria-pressed={active === 'all'}
            onClick={() => setActive('all')}
          >
            All
          </button>
          {sectors.map((s) => (
            <button
              key={s.id}
              type="button"
              className={active === s.id ? 'is-active' : undefined}
              aria-pressed={active === s.id}
              onClick={() => setActive(s.id)}
            >
              {s.name}
            </button>
          ))}
        </div>
      ) : null}

      {visible.length === 0 ? (
        <p className="ncx-dir__empty">{emptyStateText}</p>
      ) : layout === 'grid' ? (
        <ul
          className="ncx-dir__cards"
          style={columns ? ({ '--dir-cols': columns } as React.CSSProperties) : undefined}
        >
          {visible.map((r, i) => (
            <li key={r.id}>
              <CardMotion index={i} motion={motion} tilt={Boolean(r.href)}>
                <div className="ncx-dir__card">
                  <Name row={r} />
                  <p className="ncx-dir__summary">{r.summary}</p>
                  <Tags sectors={r.sectors} />
                </div>
              </CardMotion>
            </li>
          ))}
        </ul>
      ) : (
        <ul className="ncx-dir__list">
          {visible.map((r) => (
            <li key={r.id} className="ncx-dir__row">
              <div className="ncx-dir__text">
                <Name row={r} />
                <p className="ncx-dir__summary">{r.summary}</p>
              </div>
              <Tags sectors={r.sectors} />
            </li>
          ))}
        </ul>
      )}
    </>
  )
}

// A link only for a customer with its own page; otherwise plain text.
const Name = ({ row }: { row: DirectoryRow }) =>
  row.href ? (
    <Link href={row.href} className="ncx-dir__name">
      {row.name}
    </Link>
  ) : (
    <span className="ncx-dir__name">{row.name}</span>
  )

const Tags = ({ sectors }: { sectors: { id: string; name: string }[] }) =>
  sectors.length ? (
    <span className="ncx-dir__tags">
      {sectors.map((s) => (
        <span key={s.id} className="ncx-dir__tag">
          {s.name}
        </span>
      ))}
    </span>
  ) : null
