'use client'

import React, { useState } from 'react'
import Link from 'next/link'

export type DirectoryRow = {
  id: string
  slug: string
  clientName: string
  summary: string
  sectors: { id: string; name: string }[]
}

type Props = {
  rows: DirectoryRow[]
  showFilters: boolean
  layout: 'list' | 'grid'
  emptyStateText: string
}

/**
 * Filter pills and the list or grid of customers. Filtering happens here, on
 * the rows already fetched, so clicking a pill never reloads the page.
 */
export const DirectoryList: React.FC<Props> = ({ rows, showFilters, layout, emptyStateText }) => {
  const [active, setActive] = useState<string>('all')

  // Distinct sectors across the rows, in the order they first appear.
  const sectorMap = new Map<string, string>()
  rows.forEach((r) => r.sectors.forEach((s) => sectorMap.set(s.id, s.name)))
  const sectors = Array.from(sectorMap, ([id, name]) => ({ id, name }))

  const visible = active === 'all' ? rows : rows.filter((r) => r.sectors.some((s) => s.id === active))

  return (
    <>
      {showFilters && sectors.length > 0 ? (
        <div className="ncx-dir__pills" role="group" aria-label="Filter by sector">
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
        <ul className="ncx-dir__cards">
          {visible.map((r) => (
            <li key={r.id} className="ncx-dir__card">
              <Link href={`/customers/${r.slug}`} className="ncx-dir__name">
                {r.clientName}
              </Link>
              <p className="ncx-dir__summary">{r.summary}</p>
              <Tags sectors={r.sectors} />
            </li>
          ))}
        </ul>
      ) : (
        <ul className="ncx-dir__list">
          {visible.map((r) => (
            <li key={r.id} className="ncx-dir__row">
              <div className="ncx-dir__text">
                <Link href={`/customers/${r.slug}`} className="ncx-dir__name">
                  {r.clientName}
                </Link>
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
