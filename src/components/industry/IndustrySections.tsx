import { draftMode } from 'next/headers'
import React from 'react'

import { AgentFeatures } from '@/blocks/AgenticFlowDemo/AgentFeatures'
import { loadAgentFamilies } from '@/blocks/AgenticFlowDemo/Component'
import { resolveDesign } from '@/blocks/AgenticFlowDemo/design'
import { AgenticCartsDemoBlock } from '@/blocks/AgenticCartsDemo/Component'
import { AgenticEpisodeBlock } from '@/blocks/AgenticEpisode/Component'
import { AgenticOrbitBlock } from '@/blocks/AgenticOrbit/Component'
import { AgenticStatsBlock } from '@/blocks/AgenticStats/Component'
import { AudienceTabsBlock } from '@/blocks/AudienceTabs/Component'
import { BlockWrapper } from '@/blocks/BlockWrapper'
import { CaseStudyGridBlock } from '@/blocks/CaseStudyGrid/Component'
import { ClusterLinksBlock, extraEntries } from '@/blocks/ClusterLinks/Component'
import { ComparisonTableBlock } from '@/blocks/ComparisonTable/Component'
import { ContextEngineBlock } from '@/blocks/ContextEngine/Component'
import { LogoWallBlock } from '@/blocks/LogoWall/Component'
import { PlatformLayersTwoBlock } from '@/blocks/PlatformLayersTwo/Component'
import { ProblemStatementBlock } from '@/blocks/ProblemStatement/Component'
import { ProductSuite2Block } from '@/blocks/ProductSuite2/Component'
import { RecordAnatomyBlock } from '@/blocks/RecordAnatomy/Component'
import { RenderBlocks } from '@/blocks/RenderBlocks'
import { BentoGrid } from '@/components/blocks/BentoGrid/BentoGrid'
import type { Customer, IndustryTopic, Integration, Sector } from '@/payload-types'
import { CMS_TAG, getMany } from '@/utilities/cms'
import { clusterGroups, type ClusterEntry, type ClusterPage } from '@/utilities/clusters'
import { publicCustomerQuery, publicCustomers } from '@/utilities/customers'
import { integrationHref } from '@/utilities/integrations'

/**
 * The industry page sections (neuroncx-cms src/collections/Sectors/sections.ts):
 * each draws the industry entry's own fields with the existing component of
 * one page block. Rows marked Pending are never drawn, and a section with
 * nothing to show draws nothing. Each section offers only a background and
 * an anchor ID; its heading, eyebrow and intro come from the layout row,
 * else the entry, else the section's default heading.
 *
 * The agents, integrations, customers and topics sections read those
 * collections, matched to the industry; the shared section draws one shared
 * content record's block. A draft preview reads the latest drafts, except
 * customers, which are always read as a visitor reads them (their Show real
 * name rule).
 */

// The block types' props are generated with blockType required; these are
// built from the entry, so the component props are loosely typed here.
type AnyBlock = React.ComponentType<any>
type Row = Record<string, any>
type SectionBlock = Row & { blockType?: string | null; heading?: string | null; eyebrow?: string | null; intro?: string | null }

const Problems = ProblemStatementBlock as AnyBlock
const Audiences = AudienceTabsBlock as AnyBlock
const Episode = AgenticEpisodeBlock as AnyBlock
const Stats = AgenticStatsBlock as AnyBlock
const Orbit = AgenticOrbitBlock as AnyBlock
const RecordTable = RecordAnatomyBlock as AnyBlock
const Comparison = ComparisonTableBlock as AnyBlock
const CaseStudies = CaseStudyGridBlock as AnyBlock
const ClusterLinks = ClusterLinksBlock as AnyBlock
const Blocks = RenderBlocks as AnyBlock

/** Each section's default heading, as in the CMS. {name} is the industry's name. */
export const INDUSTRY_HEADINGS: Record<string, string> = {
  industryProblems: 'What gets in the way',
  industryAudiences: 'What each team gets',
  industryEpisode: 'One episode, start to finish',
  industryRoles: 'Who takes part',
  industryRecord: 'What the record holds',
  industryComparison: 'How it compares',
  industryCarts: 'Every course in one cart',
  industryEnquiry: 'Every enquiry captured',
  industryAnswers: 'Answers from your own content',
  industryCampaigns: 'Campaigns',
  industryReporting: 'Reporting',
  industryCallQuality: 'Call quality',
  industryCampusSystems: 'Works with your campus systems',
  industryAgents: 'The agents that work here',
  industryIntegrations: 'Works with the systems you run',
  industryCustomers: 'Who uses it',
  industryTopics: 'Every stage, page by page',
  // No default: a shared block keeps its own heading unless the row sets one.
  shared: '',
}

/**
 * The interim platform sections: the entry group each reads, the block that
 * draws it, and the list in the group that must have rows for it to show.
 */
const INTERIM: Record<string, { group: keyof Sector; component: AnyBlock; blockType: string; list: string; titleKey?: string; introKey?: string }> = {
  industryCarts: { group: 'carts', component: AgenticCartsDemoBlock, blockType: 'agenticCartsDemo', list: 'carts' },
  industryEnquiry: { group: 'enquiryCapture', component: ContextEngineBlock, blockType: 'contextEngine', list: 'points' },
  industryAnswers: { group: 'answersFromContent', component: ProductSuite2Block, blockType: 'productSuite2', list: 'cards' },
  industryCampaigns: { group: 'campaigns', component: BentoGrid, blockType: 'bentoGrid', list: 'cards', titleKey: 'title', introKey: 'description' },
  industryReporting: { group: 'reporting', component: ProductSuite2Block, blockType: 'productSuite2', list: 'cards' },
  industryCallQuality: { group: 'callQuality', component: PlatformLayersTwoBlock, blockType: 'platformLayersTwo', list: 'layers' },
  industryCampusSystems: { group: 'campusSystems', component: ProductSuite2Block, blockType: 'productSuite2', list: 'cards' },
}

/**
 * The fields of a shared block that take the row's heading, eyebrow and
 * intro. The stat band has none of them.
 */
/**
 * Whether a shared block has anything to draw, as its own component decides:
 * the list it shows (the trust panel draws with its heading alone). A block
 * with nothing renders nothing, so it must not leave a wrapper or spacing.
 */
const SHARED_LIST: Record<string, string> = {
  trustPanel: 'cards',
  howItWorks2: 'steps',
  productSuite2: 'cards',
  bentoGrid: 'cards',
  statBand: 'stats',
}

export const sharedBlockHasContent = (block: Row): boolean => {
  const list = SHARED_LIST[String(block.blockType)]
  if (!list) return true
  const rows = rowsOf(block[list])
  return rows.length > 0 || (block.blockType === 'trustPanel' && Boolean(text(block.heading)))
}

const SHARED_TEXT: Record<string, { heading?: string; eyebrow?: string; intro?: string }> = {
  trustPanel: { heading: 'heading', eyebrow: 'eyebrow', intro: 'intro' },
  howItWorks2: { heading: 'heading', eyebrow: 'eyebrow', intro: 'intro' },
  productSuite2: { heading: 'heading', eyebrow: 'eyebrow', intro: 'intro' },
  bentoGrid: { heading: 'title', eyebrow: 'eyebrow', intro: 'description' },
  statBand: {},
}

/** Entries a visitor sees: published, Live or Pilot. A draft preview reads the latest draft of each. */
const shownEntries = (draft: boolean): Record<string, string> =>
  draft ? { draft: 'true' } : { 'where[_status][equals]': 'published', 'where[status][in]': 'live,pilot' }

const isDraft = async (): Promise<boolean> => (await draftMode()).isEnabled

const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)
const rowsOf = (v: unknown): Row[] => (Array.isArray(v) ? v.filter((r) => r && typeof r === 'object' && r.pending !== true) : [])

/** The section key of a layout block: industryEpisodeSection becomes industryEpisode. */
export const industrySectionKey = (blockType: unknown): string | null =>
  typeof blockType === 'string' && blockType.endsWith('Section') && blockType.slice(0, -'Section'.length) in INDUSTRY_HEADINGS
    ? blockType.slice(0, -'Section'.length)
    : null

/**
 * A stat's text value, such as "40%", "2x" or "1,300+", as the stats block
 * reads it: the number, and the rest after it. A value that does not start
 * with a number cannot count up, so it is left out.
 */
export const statValue = (value: unknown): { value: number; suffix: string | null } | null => {
  const m = typeof value === 'string' ? value.trim().match(/^(\d[\d,]*(?:\.\d+)?)(.*)$/) : null
  if (!m) return null
  return { value: Number(m[1].replace(/,/g, '')), suffix: m[2] || null }
}

/** One section's content, or null when it has nothing to show. */
export const industrySectionContent = async (key: string, block: SectionBlock, entry: Sector): Promise<React.ReactNode> => {
  const fill = (t: string) => t.replace(/\{name\}/g, entry.name)
  const heading = text(block.heading) ? fill(block.heading!) : fill(INDUSTRY_HEADINGS[key] ?? '')
  const eyebrow = text(block.eyebrow)
  const intro = text(block.intro)
  const e = entry as Sector & Row

  switch (key) {
    case 'industryProblems': {
      const problems = rowsOf(e.problems).filter((p) => text(p.title)).map((p) => ({ id: p.id, title: p.title, description: p.description ?? '' }))
      if (!problems.length) return null
      return <Problems blockType="problemStatement" eyebrow={eyebrow} heading={heading} intro={intro} problems={problems} />
    }
    case 'industryAudiences': {
      const tabs = rowsOf(e.audiences).filter((t) => text(t.label))
      if (!tabs.length) return null
      return <Audiences blockType="audienceTabs" eyebrow={eyebrow} heading={heading} intro={intro} tabs={tabs} />
    }
    case 'industryEpisode': {
      const points = rowsOf(e.episodePoints).filter((p) => text(p.title)).map((p) => ({ id: p.id, label: p.title, caption: p.caption ?? '' }))
      const stats = rowsOf(e.stats).flatMap((s) => {
        const v = statValue(s.value)
        return v && text(s.label) ? [{ id: s.id, ...v, label: s.label }] : []
      })
      const dates = rowsOf(e.keyDates).map((d) => text(d.label)).filter(Boolean)
      const episodeName = text(e.episodeName)
      if (!points.length && !stats.length) return null
      return (
        <>
          {points.length ? (
            <Episode
              blockType="agenticEpisode"
              heading={heading}
              intro={intro ? [{ text: intro }] : []}
              {...(episodeName ? { startLabel: `${episodeName} opens`, endLabel: `${episodeName} closes` } : {})}
              points={points}
              closing={dates.length ? `Key dates: ${dates.join(', ')}` : null}
            />
          ) : null}
          {stats.length ? (
            <Stats blockType="agenticStats" eyebrow={points.length ? null : eyebrow} heading={points.length ? null : heading} stats={stats} />
          ) : null}
        </>
      )
    }
    case 'industryRoles': {
      const roles = rowsOf(e.roles).filter((r) => text(r.name)).map((r) => ({ id: r.id, label: r.name, caption: r.caption ?? '' }))
      if (!roles.length) return null
      return <Orbit blockType="agenticOrbit" heading={heading} intro={intro} centreLabel={text(e.episodeName) ?? undefined} roles={roles} />
    }
    case 'industryRecord': {
      const entities = rowsOf(e.entities).filter((x) => text(x.label))
      if (!entities.length) return null
      return (
        <RecordTable
          blockType="recordAnatomy"
          eyebrow={eyebrow}
          heading={heading}
          intro={intro}
          recordLabel={e.recordLabel}
          fieldColumnLabel={e.fieldColumnLabel}
          sourceColumnLabel={e.sourceColumnLabel}
          entities={entities}
        />
      )
    }
    case 'industryComparison': {
      const columns = rowsOf(e.columns)
      const rows = rowsOf(e.rows)
      if (!columns.length || !rows.length) return null
      return <Comparison blockType="comparisonTable" eyebrow={eyebrow} heading={heading} intro={intro} columns={columns} rows={rows} footnote={e.footnote} />
    }
    case 'industryAgents': {
      // Live and Pilot agents used in one of the industry's verticals, by family.
      const verticals = (e.verticals ?? []).filter(Boolean)
      if (!verticals.length) return null
      const families = await loadAgentFamilies({ agentsFor: 'industries', industries: verticals }, await isDraft())
      if (!families.length) return null
      return (
        <AgentFeatures
          eyebrow={eyebrow}
          heading={heading}
          intro={intro}
          families={families}
          pickFamilyLabel="Pick a family"
          pickAgentLabel="Agents"
          design={resolveDesign({ mode: 'agentFeatures' })}
        />
      )
    }
    case 'industryIntegrations': {
      // Live and Pilot integrations used in one of the industry's verticals.
      const verticals = (e.verticals ?? []).filter(Boolean)
      if (!verticals.length) return null
      const draft = await isDraft()
      const docs = await getMany<Integration>(
        'integrations',
        { ...shownEntries(draft), 'where[verticals][in]': verticals.join(','), sort: 'order,name', limit: 100, depth: 1 },
        { draft, tags: [CMS_TAG, 'integrations'] },
      )
      const shown = docs.filter((d) => (d.status === 'live' || d.status === 'pilot') && text(d.name))
      if (!shown.length) return null
      const logos = shown.map((d) => ({ id: d.id, name: d.name, logo: d.logo, href: integrationHref(d) }))
      // Logos when every one has a file, else names, so none is left out.
      const display = logos.every((l) => l.logo && typeof l.logo === 'object' && l.logo.url) ? 'logos' : 'wordmarks'
      return <LogoWallBlock label={eyebrow} heading={heading} intro={intro} display={display} logos={logos} align="left" />
    }
    case 'industryCustomers': {
      // Read as a visitor reads them, so a name not cleared for showing stays hidden.
      if (!e.id) return null
      const docs = await getMany<Customer>(
        'customers',
        { ...publicCustomerQuery, 'where[sectors][in]': e.id, sort: '-updatedAt', limit: 6, depth: 1 },
        { tags: [CMS_TAG, 'customers'] },
      )
      const customers = publicCustomers(docs)
      if (!customers.length) return null
      return <CaseStudies blockType="caseStudyGrid" populateBy="selection" selectedDocs={customers} eyebrow={eyebrow} heading={heading} intro={intro} />
    }
    case 'industryTopics': {
      // The industry's topics with their own page, and the row's extra pages, by stage.
      if (!e.id) return null
      const draft = await isDraft()
      const topics = await getMany<IndustryTopic>(
        'industryTopics',
        { ...shownEntries(draft), 'where[industry][equals]': e.id, sort: 'stageOrder', limit: 100, depth: 0 },
        { draft, tags: [CMS_TAG, 'content', 'content-industryTopics'] },
      )
      const items: ClusterEntry[] = topics
        .filter((t) => t.hasOwnPage && text(t.path) && text(t.name))
        .map((t) => ({
          page: {
            id: t.id,
            title: t.name,
            slug: t.slug ?? null,
            parent: null,
            href: t.path,
            meta: { description: text(t.summary) ?? text(t.meta?.description) },
          } as ClusterPage,
          stage: t.stage ?? null,
          stageOrder: t.stageOrder ?? null,
        }))
      if (!clusterGroups([...items, ...extraEntries(block.extraPages, draft)]).length) return null
      return <ClusterLinks blockType="clusterLinks" eyebrow={eyebrow} heading={heading} intro={intro} items={items} extraPages={block.extraPages} />
    }
    case 'shared': {
      // The record's block, drawn as it is anywhere else, with the row's overrides.
      const item = block.item
      if (!item || typeof item !== 'object') return null
      if (!(await isDraft()) && item._status && item._status !== 'published') return null
      const inner = Array.isArray(item.block) ? (item.block[0] as Row | undefined) : undefined
      if (!inner?.blockType) return null
      const names = SHARED_TEXT[inner.blockType] ?? {}
      // An empty record draws nothing, with no wrapper or spacing (the row's heading cannot fill it).
      if (!sharedBlockHasContent(inner)) return null
      const overrides: Row = {
        ...(names.heading && text(block.heading) ? { [names.heading]: fill(block.heading!) } : {}),
        ...(names.eyebrow && eyebrow ? { [names.eyebrow]: eyebrow } : {}),
        ...(names.intro && intro ? { [names.intro]: intro } : {}),
        // The row's background and anchor ID, when set, replace the block's own.
        ...(text(block.background) ? { background: block.background } : {}),
        ...(text(block.htmlId) ? { htmlId: block.htmlId } : {}),
      }
      return <Blocks blocks={[{ ...inner, ...overrides }]} />
    }
  }

  const interim = INTERIM[key]
  if (!interim) return null
  const group = (e[interim.group] ?? {}) as Row
  if (!rowsOf(group[interim.list]).length) return null
  const titleKey = interim.titleKey ?? 'heading'
  const introKey = interim.introKey ?? 'intro'
  // The layout row's heading, eyebrow and intro, else the group's own, else the default heading.
  const props: Row = {
    ...group,
    blockType: interim.blockType,
    [titleKey]: text(block.heading) ? heading : (text(group[titleKey]) ?? heading),
    ...(eyebrow ? { eyebrow } : {}),
    ...(intro ? { [introKey]: intro } : {}),
  }
  const Component = interim.component
  return <Component {...props} />
}

/**
 * The industry page's sections, in the order of its layout. The shared
 * section's block brings its own appearance (RenderBlocks), so it is not
 * wrapped again.
 */
export const IndustrySections = async ({ blocks, entry }: { blocks: readonly unknown[] | null | undefined; entry: Sector }) => {
  const sections = await Promise.all(
    ((blocks ?? []) as SectionBlock[]).map(async (block, index) => {
      const key = industrySectionKey(block?.blockType)
      if (!key) return null
      const content = await industrySectionContent(key, block, entry)
      if (!content) return null
      const id = (block.id as string) || `${key}-${index}`
      if (key === 'shared') return <React.Fragment key={id}>{content}</React.Fragment>
      return (
        <BlockWrapper key={id} flush htmlId={block.htmlId as string | null} background={block.background as string | null}>
          {content}
        </BlockWrapper>
      )
    }),
  )
  return <>{sections}</>
}
