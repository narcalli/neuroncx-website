import React from 'react'

import { fromIntegration } from '@/components/cards/adapters/integration'
import { CardSection } from '@/components/cards/CardSection'
import { mergeCardDesign, type SavedCardDesign } from '@/components/cards/defaults'
import { initialOf, type CardItem } from '@/components/cards/types'
import type {
  Integration,
  IntegrationCategory,
  IntegrationsBlock as IntegrationsBlockProps,
} from '@/payload-types'
import { loadIntegrations, usesCollection } from '@/utilities/integrations'
import { pickMedia, type MediaValue } from '@/utilities/media'
import { SplitHeading } from '@/motion/SplitHeading'
import { Reveal } from '@/motion/Reveal'

// Blocks saved before the card design settings existed, and blocks the
// Integrations landing builds itself, have no settings, or only some: each
// missing one falls back to the CMS default, so they draw as before.
type Props = Omit<IntegrationsBlockProps, 'cardDesign'> & {
  cardDesign?: SavedCardDesign | null
}

type Group = { key: string; name: string | null; order: number; items: CardItem[] }

const MAX = 24

const categoryOf = (d: Integration): IntegrationCategory | null =>
  d.category && typeof d.category === 'object' ? (d.category as IntegrationCategory) : null

/**
 * The cards by category, in category order (the category's own order, then
 * its name). Cards keep their order inside a group. An integration whose
 * category did not arrive goes in a last group under "Other".
 */
const groupByCategory = (docs: Integration[], card: (d: Integration) => CardItem): Group[] => {
  const groups = new Map<string, Group>()
  for (const d of docs) {
    const cat = categoryOf(d)
    const key = cat?.id || ''
    let group = groups.get(key)
    if (!group) {
      group = cat
        ? { key, name: cat.name, order: cat.order ?? 100, items: [] }
        : { key, name: 'Other', order: Infinity, items: [] }
      groups.set(key, group)
    }
    group.items.push(card(d))
  }
  return [...groups.values()].sort(
    (a, b) => a.order - b.order || (a.name || '').localeCompare(b.name || ''),
  )
}

export const IntegrationsBlock = async (props: Props) => {
  const { label, heading, intro, items, footnote, populateBy, cardDesign } = props

  let settings = mergeCardDesign(cardDesign)
  const { linkLabel } = settings
  // Every design shows a link only on cards whose integration has its own page.
  const toCard = (d: Integration): CardItem => ({ ...fromIntegration(d), linkLabel })

  // Blocks saved before populateBy existed have no value: they are the old
  // typed list, rendered exactly as before. It has no categories, so it is
  // never grouped.
  let groups: Group[]
  if (usesCollection(populateBy)) {
    const docs = await loadIntegrations(props, MAX)
    groups = settings.groupByCategory
      ? groupByCategory(docs, toCard)
      : [{ key: 'all', name: null, order: 0, items: docs.map(toCard) }]
  } else {
    const list = (items || []).map(
      (it, i): CardItem => {
        const logo = pickMedia(it.logo as MediaValue)
        return {
          id: it.id || String(i),
          title: it.name,
          text: it.summary || null,
          logo: logo ? { src: logo.src, alt: logo.alt || it.name } : null,
          initial: initialOf(it.name),
          linkLabel,
        }
      },
    )
    groups = [{ key: 'all', name: null, order: 0, items: list }]
    // The typed list has no item designs.
    settings = { ...settings, allowItemDesigns: false }
  }
  groups = groups.filter((g) => g.items.length)
  if (!groups.length) return null

  return (
    <section className="ncx-integrations ncx-container">
      <style>{`
        .ncx-integrations{
          padding-block:48px;
          font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-integrations .label{font-family:var(--font-display),Arial,sans-serif;font-size:14px;
          color:var(--ncx-crimson-ink);margin:0 0 12px}
        /* The heading takes the full column, so it sits on one line wherever
           it fits; on narrow screens it wraps into balanced lines. */
        .ncx-integrations h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,38px);line-height:1.15;letter-spacing:-.03em;margin:0;text-wrap:balance}
        .ncx-integrations .intro{color:var(--ncx-muted);margin:14px 0 0;max-width:64ch;font-size:18px;line-height:1.6}
        /* The cards themselves are a card design (components/cards). */
        .ncx-integrations .cards{margin-top:44px}
        .ncx-integrations .group + .group{margin-top:40px}
        .ncx-integrations .group-name{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:18px;letter-spacing:-.01em;margin:0 0 16px;color:var(--ncx-ink)}
        .ncx-integrations .footnote{margin:24px 0 0;color:var(--ncx-muted);font-size:16px}
        @media(max-width:820px){.ncx-integrations{padding-block:36px}
          .ncx-integrations .cards{margin-top:32px}
          .ncx-integrations .group + .group{margin-top:32px}}
      `}</style>

      {label ? <Reveal as="p" from="left" className="label">{label}</Reveal> : null}
      {heading ? <SplitHeading as="h2">{heading}</SplitHeading> : null}
      {intro ? <Reveal as="p" className="intro">{intro}</Reveal> : null}

      <div className="cards">
        {groups.map((group) => (
          <div className="group" key={group.key}>
            {group.name ? <h3 className="group-name">{group.name}</h3> : null}
            <CardSection items={group.items} settings={settings} />
          </div>
        ))}
      </div>

      {footnote ? <p className="footnote">{footnote}</p> : null}
    </section>
  )
}
