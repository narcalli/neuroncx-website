import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { ClosingCtaBlock } from '@/blocks/ClosingCTA/Component'
import { buildTrail } from '@/components/Breadcrumbs'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { EntryHero, EntryHeroBar } from '@/components/sections/EntryHero'
import { heroDesignOf } from '@/components/sections/entryHeroAdapters'
import { RenderSections, type SectionContext } from '@/components/sections/RenderSections'
import { CONTENT_COLLECTIONS, fillHeading, SECTION_HEADINGS, sectionKeyOf } from '@/content/registry'
import { hrefOf, type LinkValue } from '@/utilities/cmsValues'
import {
  effectiveLayout,
  getEntries,
  getEntryPage,
  getHub,
  groupOf,
  isDraft,
  isLocalHost,
  publicEntries,
  showsClosing,
  siteOrigin,
} from '@/utilities/content'
import { pickMedia, type MediaValue } from '@/utilities/media'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { defaultShareImage } from '@/utilities/siteDefaults'

type Args = { params: Promise<{ slug: string }> }

const COLLECTION = 'microApps' as const
const { route, hubLabel } = CONTENT_COLLECTIONS[COLLECTION]

/**
 * A bot swarm agent's own page, in the light theme of the integration pages
 * (micro_apps_swarm.md section 9, foundation.md section 7.1). Only a
 * published agent with status Live or Pilot and Own page on has one; every
 * other slug is a 404.
 *
 * In draft mode (the CMS Preview button or live preview) the latest draft is
 * shown instead, Planned agents included, with a Planned tag.
 *
 * Hero in the agent's hero design (components/sections/EntryHero.tsx), with
 * the breadcrumb and Pilot bar on top; then the sections of the effective
 * layout (the hub's default while the agent uses the page defaults, else its
 * own); then the hub's closing panel, the page's only navy section, unless
 * the layout places it or the agent's Show the closing panel is off.
 */

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const d = await getEntryPage(COLLECTION, slug, await isDraft())
  if (!d) return {}

  const title = d.meta?.title || d.heroHeading || d.name
  const description = d.meta?.description || d.summary || undefined
  const origin = siteOrigin()
  const canonical = origin ? `${origin}${route}/${slug}` : undefined
  const picked = pickMedia(d.meta?.image as MediaValue, 'og')
  const image =
    picked && !isLocalHost(new URL(picked.src).hostname)
      ? {
          url: picked.src,
          ...(picked.width ? { width: picked.width } : {}),
          ...(picked.height ? { height: picked.height } : {}),
          ...(picked.alt ? { alt: picked.alt } : {}),
        }
      : null
  const shareImage = image?.url || defaultShareImage()?.url

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
    twitter: {
      card: shareImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
  }
}

export default async function AgentPage({ params }: Args) {
  const { slug } = await params
  const draft = await isDraft()
  const [d, hub] = await Promise.all([getEntryPage(COLLECTION, slug, draft), getHub(COLLECTION, draft)])
  if (!d) notFound()

  const family = groupOf(d)
  const tokens = { name: d.name, family: family?.name }
  const layout = effectiveLayout(d, hub)

  // The page's button: the agent's own, else the hub's closing button, else contact.
  const ownHref = d.cta?.label ? hrefOf(d.cta.link as LinkValue) : null
  const hubHref = hub?.closing?.cta?.label ? hrefOf(hub.closing.cta as LinkValue) : null
  const ctaHref = ownHref || hubHref || '/contact'
  const ctaLabel = (ownHref && d.cta?.label) || (hubHref && hub?.closing?.cta?.label) || 'Talk to our team'

  // The workflow steps under a conversation hero: the agents that pass to
  // this one, this one, and the ones it passes to.
  const chain =
    heroDesignOf(d) === 'conversation' && d.heroWorkflowFromChain
      ? {
          before: (await getEntries(COLLECTION, { 'where[passesTo][in]': d.id, depth: 0 }, draft)).filter(
            (a) => a.id !== d.id,
          ),
          next: publicEntries(d.passesTo, draft),
        }
      : undefined

  const flag = d.status === 'pilot' ? 'Pilot' : d.status === 'planned' ? 'Planned' : null
  const bar = (
    <EntryHeroBar
      trail={buildTrail({ entry: { name: d.name, hub: { label: hubLabel, href: route }, group: family?.name } })}
      flag={flag}
    />
  )

  const secondary = hub?.closing?.secondaryCta
  const closingOn = showsClosing(d)
  const closing = closingOn ? (
    <ClosingCtaBlock
      heading={fillHeading(hub?.closing?.heading || SECTION_HEADINGS.closing, tokens)}
      subhead={hub?.closing?.subheading || null}
      primaryLabel={ctaLabel}
      primaryLink={ctaHref}
      secondaryLabel={secondary?.label || null}
      secondaryLink={secondary?.label ? hrefOf(secondary as LinkValue) : null}
    />
  ) : null
  // The hero no longer shows what the customer sees, so the panel always may.
  const ctx: SectionContext = { collection: COLLECTION, hub, entry: d, tokens, customerSeesInHero: false, closing, draft }
  const closingInLayout = layout.some((b) => sectionKeyOf(b.blockType) === 'closing')

  return (
    <article className="ncx-agent">
      {draft ? <LivePreviewListener /> : null}
      <style>{`
        /* Without the closing panel the footer follows the last section, which keeps its own bottom padding. */
        .ncx-agent{font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
      `}</style>

      <EntryHero
        bar={bar}
        entry={d}
        groupName={family?.name}
        primary={{ label: ctaLabel, href: ctaHref }}
        chain={chain}
        draft={draft}
      />

      <RenderSections blocks={layout} ctx={ctx} />

      {closingInLayout ? null : closing}
    </article>
  )
}
