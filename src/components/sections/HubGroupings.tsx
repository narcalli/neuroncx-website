import React from 'react'

import { fromMicroApp } from '@/components/cards/adapters/microApp'
import { CardSection } from '@/components/cards/CardSection'
import { mergeCardDesign } from '@/components/cards/defaults'
import { CONTENT_COLLECTIONS, type ContentCollectionSlug } from '@/content/registry'
import type { Hub, List } from '@/payload-types'
import { CMS_TAG, getMany } from '@/utilities/cms'
import { getEntries, publicEntries } from '@/utilities/content'


type Row = NonNullable<Hub['groupingSections']>[number]

const listOf = (v: unknown): List | null => (v && typeof v === 'object' ? (v as List) : null)

/**
 * One section per grouping on a hub page: the hub's Grouping sections in
 * their order, or, with none, every published grouping of the collection's
 * list type by its order. Eyebrow, heading and intro are the row's own, else
 * the grouping's name, pain line and summary.
 *
 * Cards: the row's hand-picked entries, else every public entry in the
 * grouping. Card design falls back from the entry, to its grouping, to the
 * row (the section), to grid. Hubs have no page-wide design yet.
 */
export const HubGroupings = async ({
  hub,
  collection,
  draft = false,
}: {
  hub: Hub
  collection: ContentCollectionSlug
  /** A draft preview: draft groupings and Planned entries are shown too. */
  draft?: boolean
}) => {
  const { groupField, listType } = CONTENT_COLLECTIONS[collection]
  let rows: { group: List; row: Partial<Row> }[] = (hub.groupingSections ?? [])
    .map((row) => ({ group: listOf(row.group), row }))
    .filter((r): r is { group: List; row: Row } => Boolean(r.group))
  if (!rows.length) {
    const groups = await getMany<List>(
      'lists',
      {
        'where[type][equals]': listType,
        ...(draft ? { draft: 'true' } : { 'where[_status][equals]': 'published' }),
        sort: 'order',
        depth: 0,
      },
      { tags: [CMS_TAG, 'content', `content-${collection}`], draft },
    )
    rows = groups.map((group) => ({ group, row: {} }))
  }

  const sections = await Promise.all(
    rows.map(async ({ group, row }) => {
      const picked = publicEntries(row.entries, draft)
      const entries = picked.length
        ? picked
        : await getEntries(collection, { [`where[${groupField}][equals]`]: group.id, depth: 1 }, draft)
      return { group, row, entries }
    }),
  )

  return (
    <>
      <style>{`.ncx-sec__eyebrow{font-family:var(--font-display),Arial,sans-serif;font-size:14px;
        color:var(--ncx-crimson-ink);margin:0 0 12px}`}</style>
      {sections
        .filter((s) => s.entries.length)
        .map(({ group, row, entries }) => {
          const settings = mergeCardDesign({ design: row.cardDesign || 'grid', allowItemDesigns: true })
          const id = `group-${group.slug || group.id}`
          return (
            <section className="ncx-sec" aria-labelledby={id} key={group.id}>
              <div className="ncx-container">
                <p className="ncx-sec__eyebrow">{row.eyebrow || group.name}</p>
                <h2 id={id}>{row.heading || group.painLine || group.name}</h2>
                {row.intro || group.summary ? (
                  <p className="ncx-sec__intro" style={{ marginTop: 0 }}>
                    {row.intro || group.summary}
                  </p>
                ) : null}
                <CardSection items={entries.map((e) => fromMicroApp(e, draft))} settings={settings} />
              </div>
            </section>
          )
        })}
    </>
  )
}
