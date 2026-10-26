import { draftMode } from 'next/headers'
import React from 'react'

import { CardSection } from '@/components/cards/CardSection'
import { mergeCardDesign, type SavedCardDesign } from '@/components/cards/defaults'
import { initialOf, type CardItem } from '@/components/cards/types'
import type { ClusterLinksBlock as ClusterLinksProps } from '@/payload-types'
import { clusterGroups, loadClusterPages, type ClusterEntry, type ClusterPage } from '@/utilities/clusters'
import { pagePathOf } from '@/utilities/pages'

type Props = Omit<ClusterLinksProps, 'cardDesign'> & {
  cardDesign?: SavedCardDesign | null
  /** The page the block sits on (RenderBlocks): its cluster pages are listed. */
  pageId?: string | null
}

/**
 * Cluster links: a card for every page under the page this block sits on,
 * plus the extra pages chosen in the block, grouped by stage. Published pages
 * only; in draft mode the latest drafts. Not drawn when there is nothing to list.
 */
export const ClusterLinksBlock = async (props: Props) => {
  const { eyebrow, heading, intro, extraPages, cardDesign, pageId } = props
  const { isEnabled: draft } = await draftMode()

  const children = pageId ? await loadClusterPages(pageId, draft) : []
  const extras: ClusterEntry[] = (extraPages || []).flatMap((row) => {
    const page = row?.page
    if (!page || typeof page !== 'object') return []
    // Outside draft mode only published pages are listed.
    if (!draft && page._status && page._status !== 'published') return []
    return [{ page: page as ClusterPage, stage: row.stage ?? null, stageOrder: row.stageOrder ?? null }]
  })
  const groups = clusterGroups([
    ...children.map((page) => ({ page, stage: page.stage ?? null, stageOrder: page.stageOrder ?? null })),
    ...extras,
  ])
  if (!groups.length) return null

  // Feature cards unless another design is saved, as in the CMS block.
  const settings = mergeCardDesign({ ...cardDesign, design: cardDesign?.design || 'feature' })
  const toCard = ({ page }: ClusterEntry): CardItem => ({
    id: String(page.id),
    title: page.title,
    text: page.meta?.description || null,
    initial: initialOf(page.title),
    href: pagePathOf(page),
    linkLabel: settings.linkLabel,
  })

  return (
    <section className="ncx-cluster ncx-container">
      <style>{`
        .ncx-cluster{padding-block:48px;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-cluster .eyebrow{font-family:var(--font-display),Arial,sans-serif;font-size:14px;
          color:var(--ncx-crimson-ink);margin:0 0 12px}
        .ncx-cluster h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,38px);line-height:1.15;letter-spacing:-.03em;margin:0;text-wrap:balance;
          color:var(--ncx-ink)}
        .ncx-cluster .intro{color:var(--ncx-muted);margin:14px 0 0;max-width:64ch;font-size:18px;line-height:1.6}
        .ncx-cluster .cards{margin-top:44px}
        .ncx-cluster .cards:first-child{margin-top:0}
        .ncx-cluster .group + .group{margin-top:40px}
        .ncx-cluster .stage{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:18px;letter-spacing:-.01em;margin:0 0 16px;color:var(--ncx-ink)}
        @media(max-width:820px){.ncx-cluster{padding-block:36px}
          .ncx-cluster .cards{margin-top:32px}
          .ncx-cluster .group + .group{margin-top:32px}}
      `}</style>

      {eyebrow ? <p className="eyebrow">{eyebrow}</p> : null}
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className="intro">{intro}</p> : null}

      <div className="cards">
        {groups.map((group) => (
          <div className="group" key={group.stage ?? '-'}>
            {group.stage ? <h3 className="stage">{group.stage}</h3> : null}
            <CardSection items={group.entries.map(toCard)} settings={settings} />
          </div>
        ))}
      </div>
    </section>
  )
}
