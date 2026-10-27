import React from 'react'

import { BlockWrapper } from '@/blocks/BlockWrapper'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import {
  CONTENT_COLLECTIONS,
  fillHeading,
  SECTION_HEADINGS,
  sectionKeyOf,
  type ContentCollectionSlug,
} from '@/content/registry'
import { EntrySectionBand, ownSectionKey } from '@/components/industry/EntrySectionBand'
import type { Hub, IndustryTopic, Page, Sector } from '@/payload-types'
import { paragraph } from '@/utilities/cmsValues'
import type { ContentEntry } from '@/utilities/content'

import {
  AgentChain,
  AgentPanel,
  AgentResult,
  AgentTeamControls,
  EntryCustomers,
  EntryIntegrations,
  EntryRelated,
  TitleLineGrid,
} from './EntrySections'
import { HubArticles, HubIndustries, HubIntro, HubLayers, HubSteps, HubTrust, HubWorksWith } from './HubSections'
import { SectionStyles } from './SectionShell'

/** The collections whose pages RenderSections draws: the content collections, industries and industry topics. */
export type SectionCollection = ContentCollectionSlug | 'sectors' | 'industryTopics'

export type SectionContext = {
  collection: SectionCollection
  hub: Hub | null
  /** The entry the page is about. Absent on a hub page. */
  entry?: ContentEntry
  /** Heading tokens: {name}, {family}. */
  tokens: Record<string, string | null | undefined>
  /** The hero already shows what the customer sees, so the panel leaves it out. */
  customerSeesInHero?: boolean
  /** The closing panel, drawn where the layout puts a closing section. */
  closing: React.ReactNode
  /** A hub's grouping sections, drawn where its layout puts the Grouping sections block. */
  groupings?: React.ReactNode
  /** A draft preview: drafts and Planned entries are shown too. */
  draft?: boolean
}

type Block = { blockType?: string | null; heading?: string | null; id?: string | null } & Record<
  string,
  unknown
>

/**
 * A section's heading: the block's own, else (on an entry page) the hub's
 * Section headings, else the collection's default, else the section's own
 * default, with its tokens filled in.
 */
export const sectionHeading = (key: string, block: Block, ctx: SectionContext): string => {
  const hubLabel = ctx.entry
    ? ctx.hub?.labels?.find((l) => l?.section === key)?.heading
    : null
  const template =
    block.heading?.trim() ||
    hubLabel ||
    CONTENT_COLLECTIONS[ctx.collection as ContentCollectionSlug]?.headings[key] ||
    SECTION_HEADINGS[key] ||
    ''
  return fillHeading(template, ctx.tokens)
}

const renderSection = (key: string, block: Block, index: number, ctx: SectionContext): React.ReactNode => {
  const id = `${key}-${index + 1}`
  const heading = sectionHeading(key, block, ctx)
  const { entry } = ctx
  // Each case below narrows by key; the block is that section's own type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const b = block as any

  switch (key) {
    case 'closing':
      return ctx.closing
    case 'hubGroupings':
      return ctx.groupings ?? null
    case 'hubIntro':
      return <HubIntro id={id} heading={heading} block={b} />
    case 'hubSteps':
      return <HubSteps id={id} heading={heading} block={b} />
    case 'hubLayers':
      return <HubLayers id={id} heading={heading} block={b} draft={ctx.draft} />
    case 'hubWorksWith':
      return <HubWorksWith id={id} heading={heading} block={b} collection={ctx.collection as ContentCollectionSlug} draft={ctx.draft} />
    case 'hubIndustries':
      return <HubIndustries id={id} heading={heading} block={b} />
    case 'hubTrust':
      return <HubTrust id={id} heading={heading} block={b} />
    case 'hubArticles':
      return <HubArticles id={id} heading={heading} block={b} />
  }

  // Entry sections read the entry; on a hub page there is none.
  if (!entry) return null
  switch (key) {
    case 'agentPanel':
      return <AgentPanel id={id} heading={heading} entry={entry} showCustomerSees={!ctx.customerSeesInHero} />
    case 'agentChain':
      return <AgentChain id={id} heading={heading} entry={entry} draft={ctx.draft} />
    case 'agentTeamControls':
      return <AgentTeamControls id={id} heading={heading} entry={entry} />
    case 'agentResult':
      return <AgentResult id={id} heading={heading} entry={entry} />
    case 'benefits':
      return <TitleLineGrid id={id} heading={heading} rows={entry.benefits} />
    case 'useCases':
      return <TitleLineGrid id={id} heading={heading} rows={entry.useCases} />
    case 'integrations':
      return <EntryIntegrations id={id} heading={heading} entry={entry} />
    case 'customers':
      return <EntryCustomers id={id} heading={heading} entry={entry} />
    case 'related':
      return <EntryRelated id={id} heading={heading} entry={entry} draft={ctx.draft} />
    case 'faq': {
      const faqs = (entry.faqs ?? []).filter((f) => f?.question && f.answer)
      if (!faqs.length) return null
      // FAQPage structured data comes with it, once per page.
      return (
        <FAQBlock
          blockType="faq"
          heading={heading}
          items={faqs.map((f, i) => ({
            id: f.id || String(i),
            question: f.question,
            answer: paragraph(f.answer),
            defaultOpen: i === 0,
          }))}
          emitSchema
        />
      )
    }
    default:
      return null
  }
}

/**
 * One renderer for a content layout (foundation.md section 7.1): CMS section
 * blocks are drawn here, page blocks go to the site's own RenderBlocks, in
 * the order the editor set. A section with nothing to show draws nothing.
 * Each section keeps the Appearance options chosen in the admin.
 */
export const RenderSections: React.FC<{ blocks: readonly unknown[]; ctx: SectionContext }> = ({
  blocks,
  ctx,
}) => (
  <>
    <SectionStyles />
    {(blocks as Block[]).map((block, index) => {
      const key = sectionKeyOf(block.blockType)
      const reactKey = block.id || `${block.blockType}-${index}`
      if (!key) {
        return <RenderBlocks key={reactKey} blocks={[block as unknown as Page['layout'][0]]} />
      }
      // Industry and industry topic sections fetch what they show, and draw their own band.
      if (ownSectionKey(block.blockType) && ctx.entry) {
        return (
          <EntrySectionBand
            key={reactKey}
            block={block}
            entry={ctx.entry as unknown as Sector | IndustryTopic}
            index={index}
            draft={Boolean(ctx.draft)}
          />
        )
      }
      const content = renderSection(key, block, index, ctx)
      if (!content) return null
      // The closing panel draws its own navy card, and the grouping sections
      // their own sections; neither takes a band around it.
      if (key === 'closing' || key === 'hubGroupings') return <React.Fragment key={reactKey}>{content}</React.Fragment>
      return (
        <BlockWrapper
          key={reactKey}
          flush
          htmlId={block.htmlId as string | null}
          background={block.background as string | null}
          width={block.width as string | null}
          spacingTop={block.spacingTop as string | null}
          spacingBottom={block.spacingBottom as string | null}
          align={block.align as string | null}
          hidden={block.hidden as boolean | null}
        >
          {content}
        </BlockWrapper>
      )
    })}
  </>
)
