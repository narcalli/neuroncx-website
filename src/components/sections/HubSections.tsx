import Link from 'next/link'
import React from 'react'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { HowItWorksBlock } from '@/blocks/HowItWorks/Component'
import { IntegrationsBlock } from '@/blocks/Integrations/Component'
import { UseCasesBlock } from '@/blocks/UseCases/Component'
import { BlockIcon } from '@/components/BlockIcon'
import type { ContentCollectionSlug } from '@/content/registry'
import type {
  HubArticlesSection,
  HubIntroSection,
  HubLayersSection,
  HubStepsSection,
  HubTrustSection,
  HubWorksWithSection,
  HubIndustriesSection,
} from '@/payload-types'
import { hrefOf, type LinkValue } from '@/utilities/cmsValues'
import { entryHref, getEntries, isPublicEntry } from '@/utilities/content'

import { SectionShell } from './SectionShell'

/**
 * Sections of a hub page's own layout (the CMS hub sections). They hold
 * their own copy. Light theme throughout: the closing panel is the page's
 * only navy section, so layers and trust are drawn here rather than with the
 * navy PlatformLayers and TrustPanel blocks.
 */

type Base = { id: string; heading: string }

export const HubIntro: React.FC<Base & { block: HubIntroSection }> = ({ id, heading, block }) =>
  block.line ? (
    <SectionShell id={id} heading={heading}>
      <p className="ncx-sec__lead" style={{ fontSize: 20, lineHeight: 1.6 }}>
        {block.line}
      </p>
    </SectionShell>
  ) : null

const STEP_KEYS = ['hears', 'checks', 'acts', 'handsOver', 'records'] as const

export const HubSteps: React.FC<Base & { block: HubStepsSection }> = ({ heading, block }) => {
  const steps = STEP_KEYS.map((k) => block[k])
    .filter((s): s is { title: string; line?: string | null } => Boolean(s?.title))
    .map((s) => ({ title: s.title, description: s.line || '' }))
  const cta = block.cta?.label ? { label: block.cta.label, href: hrefOf(block.cta as LinkValue) } : null
  return steps.length ? (
    <HowItWorksBlock
      label={block.eyebrow}
      heading={heading}
      intro={block.intro}
      steps={steps}
      ctaLabel={cta?.href ? cta.label : null}
      ctaLink={cta?.href ?? null}
    />
  ) : null
}

/** A link to an entry in any content collection, or to a page. */
const layerHref = (link: unknown, draft = false): string | null => {
  const { relationTo, value } = (link ?? {}) as { relationTo?: string; value?: unknown }
  if (!value || typeof value !== 'object') return null
  if (relationTo === 'pages') {
    const slug = (value as { slug?: string | null }).slug
    return slug ? `/${slug}` : null
  }
  return isPublicEntry(value, draft) ? entryHref(relationTo as ContentCollectionSlug, value, draft) : null
}

export const HubLayers: React.FC<Base & { block: HubLayersSection; draft?: boolean }> = ({
  id,
  heading,
  block,
  draft,
}) => {
  const layers = (block.layers ?? []).filter((l) => l?.title)
  if (!layers.length) return null
  return (
    <SectionShell id={id} heading={heading} eyebrow={block.eyebrow} intro={block.intro}>
      <ol className="ncx-sec__grid">
        {layers.map((l, i) => {
          const href = layerHref(l.link, draft)
          return (
            <li className="ncx-sec__card" key={l.id || i}>
              <h3>{l.title}</h3>
              {l.line ? <p>{l.line}</p> : null}
              {href ? (
                <Link className="more" href={href}>
                  Read more
                </Link>
              ) : null}
            </li>
          )
        })}
      </ol>
    </SectionShell>
  )
}

/**
 * Integrations as logo cards: hand-picked, or every Live integration linked
 * from the collection's public entries.
 */
export const HubWorksWith = async ({
  heading,
  block,
  collection,
  draft = false,
}: Base & { block: HubWorksWithSection; collection: ContentCollectionSlug; draft?: boolean }) => {
  const idOf = (v: unknown) => (v && typeof v === 'object' ? (v as { id: string }).id : (v as string))
  const ids =
    block.populateBy === 'selection'
      ? (block.selectedDocs ?? []).map(idOf)
      : [
          ...new Set(
            (await getEntries(collection, { depth: 0 }, draft)).flatMap((e) =>
              ((e.integrations ?? []) as unknown[]).map(idOf),
            ),
          ),
        ]
  if (!ids.filter(Boolean).length) return null
  return (
    <IntegrationsBlock
      blockType="integrations"
      label={block.eyebrow}
      heading={heading}
      intro={block.intro}
      populateBy="selection"
      selectedDocs={ids.filter(Boolean)}
      cardDesign={{ design: 'logoCard' }}
    />
  )
}

export const HubIndustries: React.FC<Base & { block: HubIndustriesSection }> = ({ heading, block }) => {
  const cases = (block.industries ?? [])
    .filter((r) => r?.vertical)
    .map((r) => ({
      id: r.id,
      sector: r.vertical,
      title: r.heading || r.vertical,
      description: r.problem,
      outcome: r.outcome,
    }))
  return cases.length ? (
    <UseCasesBlock label={block.eyebrow} heading={heading} intro={block.intro} cases={cases} />
  ) : null
}

export const HubTrust: React.FC<Base & { block: HubTrustSection }> = ({ id, heading, block }) => {
  const cards = (block.cards ?? []).filter((c) => c?.title)
  if (!cards.length) return null
  return (
    <SectionShell id={id} heading={heading} eyebrow={block.eyebrow} intro={block.intro}>
      <ul className="ncx-sec__grid">
        {cards.map((c, i) => (
          <li className="ncx-sec__card" key={c.id || i}>
            {c.icon ? (
              <span className="icon" aria-hidden="true">
                <BlockIcon name={c.icon} fallback="check" />
              </span>
            ) : null}
            <h3>{c.title}</h3>
            {c.line ? <p>{c.line}</p> : null}
          </li>
        ))}
      </ul>
    </SectionShell>
  )
}

export const HubArticles: React.FC<Base & { block: HubArticlesSection }> = ({ id, heading, block }) => (
  <section aria-labelledby={id} className="ncx-sec" style={{ paddingBottom: 0 }}>
    <div className="ncx-container">
      {block.eyebrow ? <p className="ncx-sec__eyebrow">{block.eyebrow}</p> : null}
      <h2 id={id} style={{ marginBottom: 0 }}>
        {heading}
      </h2>
      {block.intro ? (
        <p className="ncx-sec__intro" style={{ margin: '14px 0 0' }}>
          {block.intro}
        </p>
      ) : null}
    </div>
    <ArchiveBlock
      populateBy={block.populateBy === 'selection' ? 'selection' : 'collection'}
      categories={block.categories ?? []}
      limit={block.limit ?? 3}
      selectedDocs={(block.selectedDocs ?? []).map((value) => ({ value }))}
    />
  </section>
)
