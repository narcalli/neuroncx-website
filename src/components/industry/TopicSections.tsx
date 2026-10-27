import React from 'react'

import { resolveDesign } from '@/blocks/AgenticFlowDemo/design'
import { FlowDemo } from '@/blocks/AgenticFlowDemo/FlowDemo'
import { ComparisonTableBlock } from '@/blocks/ComparisonTable/Component'
import { HowItWorks2Block } from '@/blocks/HowItWorks2/Component'
import { LogoWallBlock } from '@/blocks/LogoWall/Component'
import { SectionShell } from '@/components/sections/SectionShell'
import type { Integration, IndustryTopic, MicroApp } from '@/payload-types'
import { entryHref } from '@/utilities/content'
import { integrationHref } from '@/utilities/integrations'

/**
 * The industry topic page sections (neuroncx-cms
 * src/collections/IndustryTopics/sections.ts): each draws the topic's own
 * fields with the existing component of one page block, or as a plain
 * content section. A section with nothing to show draws nothing. Each
 * offers only a background and an anchor ID; its heading, eyebrow and intro
 * come from the layout row, else the section's default heading.
 *
 * Shared content is the industry pages' section (IndustrySections.tsx); the
 * FAQ and the closing panel are drawn by RenderSections.
 */

type AnyBlock = React.ComponentType<any>
type Row = Record<string, any>
type SectionBlock = Row & { blockType?: string | null; heading?: string | null; eyebrow?: string | null; intro?: string | null }

const Comparison = ComparisonTableBlock as AnyBlock

/** Each section's default heading, as in the CMS. {name} is the topic's name. */
export const TOPIC_HEADINGS: Record<string, string> = {
  topicOverview: 'What it covers',
  topicSteps: 'Step by step',
  topicRecorded: 'What gets recorded',
  topicComparison: 'How it compares',
  topicAgents: 'The agents that do it',
  topicIntegrations: 'Works with',
}

const text = (v: unknown): string | null => (typeof v === 'string' && v.trim() ? v.trim() : null)
const rowsOf = (v: unknown): Row[] => (Array.isArray(v) ? v.filter((r) => r && typeof r === 'object') : [])

/** The section key of a layout block: topicStepsSection becomes topicSteps. */
export const topicSectionKey = (blockType: unknown): string | null =>
  typeof blockType === 'string' && blockType.endsWith('Section') && blockType.slice(0, -'Section'.length) in TOPIC_HEADINGS
    ? blockType.slice(0, -'Section'.length)
    : null

/** Live or Pilot, and, outside a draft preview, published: what a visitor may see of a linked entry. */
const shown = <T extends { status?: string | null; _status?: string | null }>(list: unknown, draft: boolean): T[] =>
  rowsOf(list).filter(
    (d) => (d.status === 'live' || d.status === 'pilot') && (draft || (d._status ?? 'published') === 'published'),
  ) as T[]

/**
 * An agent as one flow demo event: it starts when its Starts when says, is
 * handled by the agent, by name, and ends with what it records. An agent
 * without both is left out, so no card stands empty.
 */
export const agentEvent = (agent: MicroApp) =>
  text(agent.startsWhen) && text(agent.records)
    ? {
        id: agent.id,
        label: agent.name,
        triggerTitle: 'Starts when',
        triggerText: text(agent.startsWhen)!,
        handlers: ['agent' as const],
        routeText: `Handled by ${agent.name}`,
        resolveTitle: 'Recorded',
        resolveText: text(agent.records)!,
      }
    : null

/** One section's content, or null when it has nothing to show. `index` names the section's heading. */
export const topicSectionContent = (key: string, block: SectionBlock, topic: IndustryTopic, draft = false, index = 0): React.ReactNode => {
  const fill = (t: string) => t.replace(/\{name\}/g, topic.name)
  const heading = text(block.heading) ? fill(block.heading!) : fill(TOPIC_HEADINGS[key] ?? '')
  const eyebrow = text(block.eyebrow)
  const intro = text(block.intro)
  const id = `${key}-${index + 1}`

  switch (key) {
    case 'topicOverview': {
      const paragraphs = (topic.overview ?? '').split(/\n\s*\n/).map(text).filter(Boolean)
      if (!paragraphs.length) return null
      return (
        <SectionShell id={id} heading={heading} eyebrow={eyebrow} intro={intro}>
          {paragraphs.map((p, i) => (
            <p className="ncx-sec__lead" key={i}>
              {p}
            </p>
          ))}
        </SectionShell>
      )
    }
    case 'topicSteps': {
      const steps = rowsOf(topic.steps)
        .filter((s) => text(s.title))
        .map((s) => ({ id: s.id, title: s.title, description: s.description ?? '' }))
      if (!steps.length) return null
      return <HowItWorks2Block eyebrow={eyebrow} heading={heading} intro={intro} steps={steps} background={block.background ?? null} />
    }
    case 'topicRecorded': {
      const rows = rowsOf(topic.recorded).filter((r) => text(r.field) && text(r.source))
      if (!rows.length) return null
      return (
        <SectionShell id={id} heading={heading} eyebrow={eyebrow} intro={intro}>
          <style>{`
            .ncx-rec{width:100%;max-width:880px;border-collapse:collapse;background:var(--ncx-white);
              border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-panel);overflow:hidden;font-size:16px;line-height:1.5}
            .ncx-rec th,.ncx-rec td{text-align:left;padding:14px 20px;border-bottom:1px solid var(--ncx-rule);vertical-align:top}
            .ncx-rec thead th{font-family:var(--font-label),monospace;font-size:11.5px;font-weight:500;letter-spacing:.06em;
              text-transform:uppercase;color:var(--ncx-muted);background:var(--ncx-cloud)}
            .ncx-rec tbody tr:last-child td{border-bottom:0}
            .ncx-rec td:first-child{font-weight:600;color:var(--ncx-ink);width:42%}
            .ncx-rec td{color:var(--ncx-body)}
            @media(max-width:560px){.ncx-rec th,.ncx-rec td{padding:12px 14px}}
          `}</style>
          <table className="ncx-rec">
            <thead>
              <tr>
                <th scope="col">Field</th>
                <th scope="col">Filled by</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={r.id || i}>
                  <td>{r.field}</td>
                  <td>{r.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </SectionShell>
      )
    }
    case 'topicComparison': {
      const group = (topic.comparison ?? {}) as Row
      const columns = rowsOf(group.columns)
      const rows = rowsOf(group.rows)
      if (!columns.length || !rows.length) return null
      // The layout row's heading, eyebrow and intro, else the group's own, else the default heading.
      return (
        <Comparison
          blockType="comparisonTable"
          eyebrow={eyebrow ?? text(group.eyebrow)}
          heading={text(block.heading) ? heading : (text(group.heading) ?? heading)}
          intro={intro ?? text(group.intro)}
          columns={columns}
          rows={rows}
          footnote={group.footnote}
        />
      )
    }
    case 'topicAgents': {
      const agents = shown<MicroApp>(topic.agents, draft)
      const events = agents.map(agentEvent).filter((e): e is NonNullable<ReturnType<typeof agentEvent>> => Boolean(e))
      if (!events.length) return null
      // Each event links to its agent's own page, once it has one.
      const links = Object.fromEntries(
        agents.flatMap((a) => {
          const href = entryHref('microApps', a, draft)
          return href ? [[a.id, { label: `More on ${a.name}`, href, newTab: false }]] : []
        }),
      )
      return (
        <FlowDemo
          eyebrow={eyebrow}
          heading={heading}
          intro={intro}
          events={events}
          footnote={null}
          design={resolveDesign({ mode: 'flow' }, events.length)}
          links={links}
        />
      )
    }
    case 'topicIntegrations': {
      const integrations = shown<Integration>(topic.integrations, draft).filter((d) => text(d.name))
      if (!integrations.length) return null
      const logos = integrations.map((d) => ({ id: d.id, name: d.name, logo: d.logo, href: integrationHref(d) }))
      // Logos when every one has a file, else names, so none is left out.
      const display = logos.every((l) => l.logo && typeof l.logo === 'object' && l.logo.url) ? 'logos' : 'wordmarks'
      return <LogoWallBlock label={eyebrow} heading={heading} intro={intro} display={display} logos={logos} align="left" />
    }
  }
  return null
}
