import type { Metadata } from 'next'
import React from 'react'

import { ClosingCtaBlock } from '@/blocks/ClosingCTA/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { Breadcrumbs, buildTrail } from '@/components/Breadcrumbs'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { CONTENT_COLLECTIONS, fillHeading, SECTION_HEADINGS, type ContentCollectionSlug } from '@/content/registry'
import type { Hub } from '@/payload-types'
import { hrefOf, paragraph, type LinkValue } from '@/utilities/cmsValues'
import { isLocalHost, showsClosing, siteOrigin } from '@/utilities/content'
import { pickMedia, type MediaValue } from '@/utilities/media'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'

import { HubGroupings } from './HubGroupings'
import { groupingsPlaced } from './hubGroupingsPlacement'
import { HubConversationHero, HubHero } from './HubHero'
import { RenderSections, type SectionContext } from './RenderSections'
import { MotionPage } from '@/motion/MotionProvider'

/**
 * A content collection's hub page from its hub record (foundation.md section
 * 7.1): hero with breadcrumbs (standard or conversation design), one section per grouping, the hub layout, FAQ
 * with FAQPage data, and the closing panel, the page's only navy section,
 * only when the hub's Show the closing panel is on (off by default).
 */
export const HubPage: React.FC<{ hub: Hub; collection: ContentCollectionSlug; draft: boolean }> = ({
  hub,
  collection,
  draft,
}) => {
  const tokens = { name: hub.name }
  const close = hub.closing
  const closing = showsClosing(hub) ? (
    <ClosingCtaBlock
      heading={fillHeading(close?.heading || SECTION_HEADINGS.closing, tokens)}
      subhead={close?.subheading || null}
      primaryLabel={close?.cta?.label || 'Talk to our team'}
      primaryLink={(close?.cta?.label && hrefOf(close.cta as LinkValue)) || '/contact'}
      secondaryLabel={close?.secondaryCta?.label || null}
      secondaryLink={close?.secondaryCta?.label ? hrefOf(close.secondaryCta as LinkValue) : null}
    />
  ) : null
  // The grouping sections go where the layout's Grouping sections block is,
  // else right after the hero (hubGroupingsPlacement). Drawn once either way.
  const groupings = <HubGroupings hub={hub} collection={collection} draft={draft} />
  const placed = groupingsPlaced(hub.layout)
  const ctx: SectionContext = { collection, hub, tokens, closing, draft, groupings: placed ? groupings : null }
  const faqs = (hub.faqs ?? []).filter((f) => f?.question && f.answer)
  const label = CONTENT_COLLECTIONS[collection].hubLabel
  const crumbs = (
    <Breadcrumbs items={buildTrail({ page: { title: label, slug: CONTENT_COLLECTIONS[collection].route.slice(1) } })} />
  )

  const heroMotion = hub.heroAnimation?.motion
  const heroStill = heroMotion === 'off' || heroMotion === 'reduced' ? heroMotion : undefined

  return (
    <MotionPage page={hub.pageMotion}>
      <article>
        {draft ? <LivePreviewListener /> : null}
        {/* The hero's own animation setting (Hero tab, Hero animation). */}
        <div data-motion={heroStill} style={{ display: 'contents' }}>
          {hub.heroDesign === 'conversation' ? (
            <HubConversationHero hub={hub} draft={draft} crumbs={crumbs} />
          ) : (
            <HubHero hub={hub} draft={draft} crumbs={crumbs} />
          )}
        </div>
        {placed ? null : groupings}
        <RenderSections blocks={hub.layout ?? []} ctx={ctx} />
        {faqs.length ? (
          <FAQBlock
            blockType="faq"
            heading={fillHeading(hub.faqHeading || SECTION_HEADINGS.faq, tokens)}
            items={faqs.map((f, i) => ({
              id: f.id || String(i),
              question: f.question,
              answer: paragraph(f.answer),
              defaultOpen: i === 0,
            }))}
            emitSchema
          />
        ) : null}
        {closing}
      </article>
    </MotionPage>
  )
}

/** The hub page's metadata, from its SEO tab. */
export const hubMetadata = (hub: Hub, collection: ContentCollectionSlug): Metadata => {
  const title = hub.meta?.title || hub.h1 || hub.name
  const description = hub.meta?.description || hub.subheading || undefined
  const origin = siteOrigin()
  const canonical = origin ? `${origin}${CONTENT_COLLECTIONS[collection].route}` : undefined
  const picked = pickMedia(hub.meta?.image as MediaValue, 'og')
  const image =
    picked && !isLocalHost(new URL(picked.src).hostname)
      ? { url: picked.src, ...(picked.width ? { width: picked.width } : {}), ...(picked.height ? { height: picked.height } : {}) }
      : null
  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: mergeOpenGraph({
      title,
      description,
      ...(canonical ? { url: canonical } : {}),
      ...(image ? { images: [image] } : {}),
    }),
  }
}
