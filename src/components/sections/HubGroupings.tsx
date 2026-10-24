import React from 'react'

import { DetailedProductSuiteBlock } from '@/blocks/DetailedProductSuite/Component'
import { ProductSuiteBlock } from '@/blocks/ProductSuite/Component'
import { ProductSuite2Block } from '@/blocks/ProductSuite2/Component'
import { BentoGrid } from '@/components/blocks/BentoGrid/BentoGrid'
import { fromMicroApp, toBentoCard, toDetailedCard, toSuite2Card, toSuiteProduct } from '@/components/cards/adapters/microApp'
import { bentoSizes } from '@/components/cards/bentoPattern'
import { sectionDesignOf, showKeyPointsOf } from '@/components/cards/sectionDesign'
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
 *
 * Section designs draw the whole section with one of the site's blocks, with
 * the same eyebrow, heading and intro and one card per entry: Product suite
 * (pills or steps), Product suite 2, Detailed product suite and Bento grid.
 * The row's own design wins; with none, the grouping's section design does.
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
      {sections
        .filter((s) => s.entries.length)
        .map(({ group, row, entries }) => {
          const id = `group-${group.slug || group.id}`
          const eyebrow = row.eyebrow || group.name
          const heading = row.heading || group.painLine || group.name
          const intro = row.intro || group.summary
          const design = sectionDesignOf(row, group)
          if (design === 'suite' || design === 'suiteSteps') {
            const style = design === 'suiteSteps' ? 'steps' : 'pills'
            return (
              <ProductSuiteBlock
                key={group.id}
                headingId={id}
                label={eyebrow}
                heading={heading}
                intro={intro}
                products={entries.map((e) => toSuiteProduct(e, draft, style))}
              />
            )
          }
          if (design === 'suite2') {
            return (
              <ProductSuite2Block
                key={group.id}
                headingId={id}
                eyebrow={eyebrow}
                heading={heading}
                intro={intro}
                cards={entries.map((e) => toSuite2Card(e, draft))}
              />
            )
          }
          if (design === 'detailedSuite') {
            return (
              <DetailedProductSuiteBlock
                key={group.id}
                headingId={id}
                eyebrow={eyebrow}
                title={heading}
                description={intro}
                columns="2"
                cards={entries.map((e) => toDetailedCard(e, draft))}
              />
            )
          }
          if (design === 'bento') {
            const sizes = bentoSizes(entries.length, row.bentoPattern)
            return (
              <section key={group.id} style={{ paddingBlock: 56 }}>
                <BentoGrid
                  blockType="bentoGrid"
                  headingId={id}
                  gap="medium"
                  rowHeight={260}
                  dense
                  framed={false}
                  eyebrow={eyebrow}
                  title={heading}
                  description={intro}
                  cards={entries.map((e, i) => toBentoCard(e, sizes[i], draft))}
                />
              </section>
            )
          }
          const settings = mergeCardDesign({
            design: row.cardDesign || 'grid',
            allowItemDesigns: true,
            showKeyPoints: showKeyPointsOf(row, group),
          })
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
