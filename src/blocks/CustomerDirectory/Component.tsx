import React from 'react'

import { getMany, CMS_TAG } from '@/utilities/cms'
import { byOrderThenName, customerHref, publicCustomerQuery, publicCustomers, sectorIds } from '@/utilities/customers'
import type { Customer, CustomerDirectoryBlock as CustomerDirectoryProps, Sector } from '@/payload-types'

import { DirectoryList, type DirectoryRow } from './DirectoryList'
import { directoryListCss } from './styles'
import { SplitHeading } from '@/motion/SplitHeading'
import { Reveal } from '@/motion/Reveal'

const MAX_ROWS = 100

export const CustomerDirectoryBlock: React.FC<CustomerDirectoryProps> = async ({
  eyebrow,
  heading,
  intro,
  sectors,
  showFilters,
  layout,
  emptyStateText,
}) => {
  const ids = sectorIds(sectors)
  const query: Record<string, string | number | boolean | undefined> = {
    ...publicCustomerQuery,
    sort: 'order',
    limit: MAX_ROWS,
    depth: 1,
  }
  if (ids.length) query['where[sectors][in]'] = ids.join(',')

  const docs = await getMany<Customer>('customers', query, { tags: [CMS_TAG, 'customers'] })

  // name is already anonymised by the CMS for customers with Show real name off.
  const rows: DirectoryRow[] = publicCustomers(docs).sort(byOrderThenName).map((c) => ({
    id: c.id,
    href: customerHref(c),
    name: c.name,
    summary: c.summary,
    sectors: ((c.sectors || []) as (string | Sector)[])
      .filter((s): s is Sector => typeof s === 'object' && s !== null)
      .map((s) => ({ id: s.id, name: s.name })),
  }))

  return (
    <section className="ncx-dir">
      <style>{`
        .ncx-dir{padding:88px 0;background:var(--ncx-cloud);font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-dir__wrap{display:flex;flex-direction:column;gap:32px}
        .ncx-dir__eyebrow{font-weight:600;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ncx-crimson-ink);margin:0 0 10px}
        .ncx-dir__heading{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:clamp(1.5rem,3vw,2rem);color:var(--ncx-ink);margin:0}
        .ncx-dir__intro{font-size:15px;line-height:1.6;color:var(--ncx-muted);margin:10px 0 0}
${directoryListCss}`}</style>
      <div className="ncx-dir__wrap ncx-container">
        {eyebrow || heading || intro ? (
          <header>
            {eyebrow ? <Reveal as="p" from="left" className="ncx-dir__eyebrow">{eyebrow}</Reveal> : null}
            {heading ? <SplitHeading as="h2" className="ncx-dir__heading">{heading}</SplitHeading> : null}
            {intro ? <Reveal as="p" className="ncx-dir__intro">{intro}</Reveal> : null}
          </header>
        ) : null}
        <DirectoryList
          rows={rows}
          showFilters={showFilters !== false}
          layout={layout === 'grid' ? 'grid' : 'list'}
          emptyStateText={emptyStateText || 'More stories coming soon.'}
        />
      </div>
    </section>
  )
}
