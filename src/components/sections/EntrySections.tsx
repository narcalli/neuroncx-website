import Link from 'next/link'
import React from 'react'

import { fromIntegration } from '@/components/cards/adapters/integration'
import { fromMicroApp } from '@/components/cards/adapters/microApp'
import { CardSection } from '@/components/cards/CardSection'
import { mergeCardDesign } from '@/components/cards/defaults'
import type { Customer, Integration } from '@/payload-types'
import { customerHref, publicCustomers } from '@/utilities/customers'
import { entryHref, getEntries, groupOf, publicEntries, type ContentEntry } from '@/utilities/content'

import { SectionShell } from './SectionShell'

/**
 * Sections that draw from the entry's own fields (the CMS section registry,
 * src/content/sections/). Each returns null when it has nothing to show, even
 * while it is in the layout.
 */

type Props = { id: string; heading: string; entry: ContentEntry; draft?: boolean }

const STEPS = [
  ['hears', 'Hears'],
  ['checks', 'Checks'],
  ['acts', 'Acts'],
  ['handsOver', 'Hands over'],
  ['records', 'Records'],
] as const

/**
 * The five steps as a strip, numbered, with what starts the agent above it.
 * What the customer sees goes beside the strip when the hero shows a picture
 * instead of it.
 */
export const AgentPanel: React.FC<Props & { showCustomerSees: boolean }> = ({
  id,
  heading,
  entry,
  showCustomerSees,
}) => {
  const steps = STEPS.map(([key, label]) => ({ key, label, text: entry[key] })).filter((s) => s.text)
  if (!steps.length) return null
  const sees = showCustomerSees ? entry.customerSees : null
  return (
    <SectionShell id={id} heading={heading}>
      <style>{`
        .ncx-panel{display:grid;gap:20px}
        .ncx-panel.has-aside{grid-template-columns:minmax(0,1fr) minmax(240px,320px);align-items:start}
        .ncx-panel__steps{list-style:none;margin:0;padding:0;display:grid;gap:12px;
          grid-template-columns:repeat(var(--n),minmax(0,1fr));counter-reset:step}
        .ncx-panel__step{position:relative;background:var(--ncx-white);border:1px solid var(--ncx-rule);
          border-radius:var(--ncx-r-panel);padding:20px 18px;counter-increment:step}
        .ncx-panel__step::before{content:counter(step);display:inline-flex;width:28px;height:28px;
          align-items:center;justify-content:center;border-radius:999px;background:var(--ncx-cloud);
          font-family:var(--font-display),Arial,sans-serif;font-size:14px;font-weight:600;color:var(--ncx-ink);
          margin-bottom:12px}
        .ncx-panel__step h3{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:17px;
          margin:0 0 6px;color:var(--ncx-ink)}
        .ncx-panel__step p{margin:0;font-size:15px;line-height:1.55;color:var(--ncx-muted)}
        .ncx-panel__aside{background:var(--ncx-cloud);border:1px solid var(--ncx-rule);
          border-radius:var(--ncx-r-panel);padding:20px 18px}
        .ncx-panel__aside h3{font-family:var(--font-display),Arial,sans-serif;font-size:14px;font-weight:600;
          margin:0 0 8px;color:var(--ncx-ink)}
        .ncx-panel__aside p{margin:0;font-size:15px;line-height:1.55;color:var(--ncx-body)}
        @media(max-width:1100px){.ncx-panel__steps{grid-template-columns:repeat(3,minmax(0,1fr))}}
        @media(max-width:960px){.ncx-panel.has-aside{grid-template-columns:minmax(0,1fr)}}
        @media(max-width:640px){.ncx-panel__steps{grid-template-columns:minmax(0,1fr)}}
      `}</style>
      {entry.startsWhen ? (
        <p className="ncx-sec__lead">
          <b>Starts when:</b> {entry.startsWhen}
        </p>
      ) : null}
      <div className={`ncx-panel${sees ? ' has-aside' : ''}`}>
        <ol
          className="ncx-panel__steps"
          style={{ '--n': steps.length } as React.CSSProperties}
        >
          {steps.map((s) => (
            <li className="ncx-panel__step" key={s.key}>
              <h3>{s.label}</h3>
              <p>{s.text}</p>
            </li>
          ))}
        </ol>
        {sees ? (
          <aside className="ncx-panel__aside" aria-label="What the customer sees">
            <h3>What the customer sees</h3>
            <p>{sees}</p>
          </aside>
        ) : null}
      </div>
    </SectionShell>
  )
}

const Chip: React.FC<{ entry: ContentEntry; draft?: boolean }> = ({ entry, draft }) => {
  const href = entryHref('microApps', entry, draft)
  return <li>{href ? <Link href={href}>{entry.name}</Link> : <span>{entry.name}</span>}</li>
}

/** Where the agent sits: the agents that pass to it, this one, and the next. */
export const AgentChain = async ({ id, heading, entry, draft = false }: Props) => {
  const next = publicEntries(entry.passesTo, draft)
  const before = (await getEntries('microApps', { 'where[passesTo][in]': entry.id, depth: 0 }, draft)).filter(
    (d) => d.id !== entry.id,
  )
  if (!next.length && !before.length) return null
  return (
    <SectionShell id={id} heading={heading}>
      <style>{`
        .ncx-chain{display:flex;flex-wrap:wrap;align-items:center;gap:12px}
        .ncx-chain .arrow{color:var(--ncx-faint);font-size:20px}
      `}</style>
      <div className="ncx-chain">
        {before.length ? (
          <>
            <ul className="ncx-sec__chips" aria-label="Before this agent">
              {before.map((d) => (
                <Chip key={d.id} entry={d} draft={draft} />
              ))}
            </ul>
            <span className="arrow" aria-hidden="true">
              →
            </span>
          </>
        ) : null}
        <ul className="ncx-sec__chips" aria-label="This agent">
          <li>
            <span className="is-here" aria-current="page">
              {entry.name}
            </span>
          </li>
        </ul>
        {next.length ? (
          <>
            <span className="arrow" aria-hidden="true">
              →
            </span>
            <ul className="ncx-sec__chips" aria-label="After this agent">
              {next.map((d) => (
                <Chip key={d.id} entry={d} draft={draft} />
              ))}
            </ul>
          </>
        ) : null}
      </div>
    </SectionShell>
  )
}

/** What the organisation can change without code, as one panel. */
export const AgentTeamControls: React.FC<Props> = ({ id, heading, entry }) =>
  entry.teamControls ? (
    <SectionShell id={id} heading={heading}>
      <div className="ncx-sec__card" style={{ maxWidth: 760 }}>
        <p style={{ fontSize: 18, color: 'var(--ncx-body)' }}>{entry.teamControls}</p>
      </div>
    </SectionShell>
  ) : null

/** The result in one line, the proof under it, and where it is live. */
export const AgentResult: React.FC<Props> = ({ id, heading, entry }) => {
  const customers = publicCustomers((entry.customers ?? []) as (Customer | string)[])
  if (!entry.result && !entry.proof && !customers.length) return null
  return (
    <SectionShell id={id} heading={heading}>
      <style>{`
        .ncx-result{max-width:820px}
        .ncx-result .line{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(22px,2.6vw,28px);line-height:1.35;letter-spacing:-.02em;margin:0;color:var(--ncx-ink)}
        .ncx-result .proof{margin:16px 0 0;font-size:16px;color:var(--ncx-muted)}
        .ncx-result .ncx-sec__chips{margin-top:20px}
      `}</style>
      <div className="ncx-result">
        {entry.result ? <p className="line">{entry.result}</p> : null}
        {entry.proof ? <p className="proof">{entry.proof}</p> : null}
        {customers.length ? (
          <ul className="ncx-sec__chips" aria-label="Live at">
            {customers.map((c) => {
              const href = customerHref(c)
              return <li key={c.id}>{href ? <Link href={href}>{c.name}</Link> : <span>{c.name}</span>}</li>
            })}
          </ul>
        ) : null}
      </div>
    </SectionShell>
  )
}

/** Benefits or use cases: a title and one line each. */
export const TitleLineGrid: React.FC<{
  id: string
  heading: string
  rows?: { id?: string | null; title: string; line: string }[] | null
}> = ({ id, heading, rows }) => {
  const list = (rows ?? []).filter((r) => r && r.title)
  if (!list.length) return null
  return (
    <SectionShell id={id} heading={heading}>
      <ul className="ncx-sec__grid">
        {list.map((r, i) => (
          <li className="ncx-sec__card" key={r.id || i}>
            <h3>{r.title}</h3>
            <p>{r.line}</p>
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}

/** The entry's integrations as logo cards, Live and published only. */
export const EntryIntegrations: React.FC<Props> = ({ id, heading, entry }) => {
  const docs = ((entry.integrations ?? []) as (Integration | string)[]).filter(
    (d): d is Integration =>
      typeof d === 'object' && d?.status === 'live' && (d._status ?? 'published') === 'published',
  )
  if (!docs.length) return null
  return (
    <SectionShell id={id} heading={heading}>
      <CardSection items={docs.map(fromIntegration)} settings={mergeCardDesign({ design: 'logoCard' })} />
    </SectionShell>
  )
}

/** Customers the entry is live at, linked where they have a page. */
export const EntryCustomers: React.FC<Props> = ({ id, heading, entry }) => {
  const customers = publicCustomers((entry.customers ?? []) as (Customer | string)[])
  if (!customers.length) return null
  return (
    <SectionShell id={id} heading={heading}>
      <ul className="ncx-sec__chips">
        {customers.map((c) => {
          const href = customerHref(c)
          return <li key={c.id}>{href ? <Link href={href}>{c.name}</Link> : <span>{c.name}</span>}</li>
        })}
      </ul>
    </SectionShell>
  )
}

const RELATED_MAX = 3

/**
 * Up to three other agents: the hand-picked ones that are public, topped up
 * from the same family by order then name.
 */
export const EntryRelated = async ({ id, heading, entry, draft = false }: Props) => {
  const picked = publicEntries(entry.related, draft).filter((d) => d.id !== entry.id).slice(0, RELATED_MAX)
  const family = groupOf(entry)?.id ?? (typeof entry.family === 'string' ? entry.family : null)
  const more =
    picked.length < RELATED_MAX && family
      ? await getEntries(
          'microApps',
          {
            'where[family][equals]': family,
            'where[id][not_in]': [entry.id, ...picked.map((d) => d.id)].join(','),
            limit: RELATED_MAX - picked.length,
            depth: 1,
          },
          draft,
        )
      : []
  const list = [...picked, ...more].slice(0, RELATED_MAX)
  if (!list.length) return null
  return (
    <SectionShell id={id} heading={heading}>
      {/* Logo cards, as the integration pages show their related items. */}
      <CardSection
        items={list.map((d) => fromMicroApp(d, draft))}
        settings={mergeCardDesign({ design: 'logoCard' })}
      />
    </SectionShell>
  )
}
