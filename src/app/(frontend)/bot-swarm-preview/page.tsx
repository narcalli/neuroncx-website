import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { ClosingCtaBlock } from '@/blocks/ClosingCTA/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { HubGroupings } from '@/components/sections/HubGroupings'
import { HubHero } from '@/components/sections/HubHero'
import { RenderSections, type SectionContext } from '@/components/sections/RenderSections'
import { fillHeading, SECTION_HEADINGS } from '@/content/registry'
import { hrefOf, paragraph, type LinkValue } from '@/utilities/cmsValues'
import { getHub, isDraft } from '@/utilities/content'

const COLLECTION = 'microApps' as const

/**
 * Preview of the bot swarm hub, from its published hub record: hero, one
 * section per family, the hub layout, FAQ and the closing panel. Kept out of
 * search until the hub replaces the CMS page at /bot-swarm, which stays as it
 * is.
 *
 * In draft mode the latest drafts are shown: the hub, its families and every
 * agent, Planned ones with a Planned tag.
 */

export async function generateMetadata(): Promise<Metadata> {
  const hub = await getHub(COLLECTION, await isDraft())
  return {
    title: hub?.meta?.title || hub?.h1 || 'Bot swarm',
    description: hub?.meta?.description || undefined,
    robots: { index: false, follow: false },
  }
}

export default async function BotSwarmPreviewPage() {
  const draft = await isDraft()
  const hub = await getHub(COLLECTION, draft)
  if (!hub) notFound()

  const tokens = { name: hub.name }
  const close = hub.closing
  const closing = (
    <ClosingCtaBlock
      heading={fillHeading(close?.heading || SECTION_HEADINGS.closing, tokens)}
      subhead={close?.subheading || null}
      primaryLabel={close?.cta?.label || 'Talk to our team'}
      primaryLink={(close?.cta?.label && hrefOf(close.cta as LinkValue)) || '/contact'}
      secondaryLabel={close?.secondaryCta?.label || null}
      secondaryLink={close?.secondaryCta?.label ? hrefOf(close.secondaryCta as LinkValue) : null}
    />
  )
  const ctx: SectionContext = { collection: COLLECTION, hub, tokens, closing, draft }
  const faqs = (hub.faqs ?? []).filter((f) => f?.question && f.answer)

  return (
    <article>
      {draft ? <LivePreviewListener /> : null}
      <HubHero hub={hub} draft={draft} />
      <HubGroupings hub={hub} collection={COLLECTION} draft={draft} />
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
  )
}
