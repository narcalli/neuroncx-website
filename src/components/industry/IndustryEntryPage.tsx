import type { Metadata } from 'next'
import React from 'react'

import { ClosingCtaBlock } from '@/blocks/ClosingCTA/Component'
import { ClusterFooter } from '@/components/ClusterFooter'
import type { Crumb } from '@/components/Breadcrumbs'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { EntryHero, EntryHeroBar } from '@/components/sections/EntryHero'
import { RenderSections, type SectionContext } from '@/components/sections/RenderSections'
import { fillHeading, SECTION_HEADINGS, sectionKeyOf } from '@/content/registry'
import type { IndustryTopic, MicroApp, Sector } from '@/payload-types'
import { hrefOf, type LinkValue } from '@/utilities/cmsValues'
import type { ClusterPage } from '@/utilities/clusters'
import { isLocalHost, showsClosing, siteOrigin } from '@/utilities/content'
import { getIndustryTopicPages, industryHref, type IndustryCollection } from '@/utilities/industries'
import { pickMedia, type MediaValue } from '@/utilities/media'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { defaultShareImage } from '@/utilities/siteDefaults'

/**
 * The page of an industry, at /{industry}, or of an industry topic, at
 * /{industry}/{topic}: the hero in the entry's hero design with the
 * breadcrumb bar, the sections of its layout (RenderSections), then, when
 * Show the closing panel is on, the closing panel, unless the layout places
 * it. A topic page also ends with its cluster footer, just before the
 * closing panel, unless Hide cluster footer is on.
 */

type Entry = Sector | IndustryTopic

const SUFFIX = ' | NeuronCx'

/** Cut to `max` characters on a whole word, as the CMS does (neuroncx-cms src/collections/integrations/hooks.ts). */
export const cutOnWord = (text: string, max: number): string => {
  const t = text.trim().replace(/\s+/g, ' ')
  if (t.length <= max) return t
  const cut = t.slice(0, max + 1)
  const space = cut.lastIndexOf(' ')
  return (space > 0 ? cut.slice(0, space) : t.slice(0, max)).replace(/[\s,;:.]+$/, '')
}

/** The CMS's fallback title (neuroncx-cms src/content/fallbacks.ts): "<name> | NeuronCx", 60 characters at most. */
export const fallbackTitle = (name: string): string => `${cutOnWord(name, 60 - SUFFIX.length)}${SUFFIX}`

/**
 * Metadata from the SEO tab, with the CMS's fallbacks where a field is empty
 * (the title from the name, the description from the summary), and the
 * canonical address from the stored path.
 */
export const entryMetadata = (doc: Entry): Metadata => {
  const title = doc.meta?.title || fallbackTitle(doc.name)
  const description = doc.meta?.description || (doc.summary ? cutOnWord(doc.summary, 155) : undefined)
  const origin = siteOrigin()
  const canonical = origin && doc.path ? `${origin}${doc.path}` : undefined
  const picked = pickMedia(doc.meta?.image as MediaValue, 'og')
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

/** A topic's industry, when it arrived as a whole record. */
export const industryOf = (topic: IndustryTopic): Sector | null =>
  topic.industry && typeof topic.industry === 'object' ? topic.industry : null

/**
 * The breadcrumb trail's input: an industry is a page of its own; a topic is
 * a cluster page under its industry, from crumbs stored as the pillar-cluster
 * pages store theirs (Breadcrumbs/buildTrail.ts). The industry step links
 * only when its page can be reached.
 */
export const trailPageOf = (entry: Entry, collection: IndustryCollection, draft = false) => {
  if (collection === 'sectors') return { title: entry.name }
  const industry = industryOf(entry as IndustryTopic)
  const href = industryHref(industry, draft)
  return {
    title: entry.name,
    parent: industry?.id ?? 'industry',
    breadcrumbs: [
      { label: industry?.name ?? null, url: href },
      { label: entry.name, url: entry.path ?? null },
    ],
  }
}

/**
 * The topic page's cluster footer: back to its industry, named by the
 * industry's primary keyword, else its name; on to the topic with the next
 * stage order in the same industry. None when Hide cluster footer is on.
 */
export const TopicFooter = async ({ topic, draft }: { topic: IndustryTopic; draft: boolean }) => {
  const industry = industryOf(topic)
  if (topic.hideClusterFooter || !industry) return null
  const asCluster = (t: Pick<IndustryTopic, 'id' | 'name' | 'path' | 'stage' | 'stageOrder'>): ClusterPage =>
    ({ id: t.id, title: t.name, slug: null, parent: null, href: t.path ?? null, stage: t.stage ?? null, stageOrder: t.stageOrder ?? null }) as unknown as ClusterPage
  const pillar = {
    id: industry.id,
    title: industry.name,
    slug: null,
    parent: null,
    href: industryHref(industry, draft),
    meta: { primaryKeyword: industry.meta?.primaryKeyword ?? null },
  }
  const page = { ...asCluster(topic), parent: pillar } as unknown as ClusterPage
  const siblings = (await getIndustryTopicPages(industry.id, draft)).map(asCluster)
  return <ClusterFooter page={page} siblings={siblings} />
}

export const IndustryEntryPage = ({
  collection,
  entry,
  trail,
  draft,
  footer,
}: {
  collection: IndustryCollection
  entry: Entry
  trail: Crumb[]
  draft: boolean
  /** Drawn just before the closing panel: a topic's cluster footer. */
  footer?: React.ReactNode
}) => {
  const tokens = { name: entry.name }
  const layout = ((entry as Sector).layout ?? []).filter((b) => b && !(b as { hidden?: boolean | null }).hidden)

  // The page's button: the entry's own, else contact.
  const ownHref = entry.cta?.label ? hrefOf(entry.cta.link as LinkValue) : null
  const ctaHref = ownHref || '/contact'
  const ctaLabel = (ownHref && entry.cta?.label) || 'Talk to our team'

  const flag = entry.status === 'pilot' ? 'Pilot' : entry.status === 'planned' ? 'Planned' : null
  const bar = <EntryHeroBar trail={trail} flag={flag} />
  const groupName = collection === 'industryTopics' ? (industryOf(entry as IndustryTopic)?.name ?? null) : null

  const closing = showsClosing(entry) ? (
    <ClosingCtaBlock
      heading={fillHeading(SECTION_HEADINGS.closing, tokens)}
      subhead={null}
      primaryLabel={ctaLabel}
      primaryLink={ctaHref}
      secondaryLabel={null}
      secondaryLink={null}
    />
  ) : null
  const tail = footer || closing ? (
    <>
      {footer}
      {closing}
    </>
  ) : null
  const closingInLayout = layout.some((b) => sectionKeyOf(b.blockType) === 'closing')
  const ctx: SectionContext = {
    collection,
    hub: null,
    entry: entry as unknown as SectionContext['entry'],
    tokens,
    customerSeesInHero: false,
    closing: closingInLayout ? tail : null,
    draft,
  }

  return (
    <article className="ncx-industry">
      {draft ? <LivePreviewListener /> : null}
      <style>{`.ncx-industry{font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}`}</style>
      <EntryHero bar={bar} entry={entry as unknown as MicroApp} groupName={groupName} primary={{ label: ctaLabel, href: ctaHref }} draft={draft} />
      <RenderSections blocks={layout} ctx={ctx} />
      {closingInLayout ? null : tail}
    </article>
  )
}
