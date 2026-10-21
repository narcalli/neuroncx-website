import React from 'react'

import { CardGrid } from '@/components/cards/designs/Grid'
import type { Integration, IntegrationsBlock as IntegrationsBlockProps } from '@/payload-types'
import { integrationHref, loadIntegrations, usesCollection } from '@/utilities/integrations'
import { absoluteMediaUrl } from '@/utilities/media'

// What one cell needs, whether it comes from the old typed list or the collection.
type Card = {
  id: string
  name: string
  summary?: string | null
  logoUrl: string | null
  href?: string | null
}

const MAX = 24

const logoUrlOf = (logo: unknown): string | null =>
  logo && typeof logo === 'object' && 'url' in logo
    ? absoluteMediaUrl((logo as { url?: string | null }).url)
    : null

const toCard = (d: Integration): Card => ({
  id: d.id,
  name: d.name,
  summary: d.summary,
  logoUrl: logoUrlOf(d.logo),
  href: integrationHref(d),
})

export const IntegrationsBlock = async (props: IntegrationsBlockProps) => {
  const { label, heading, intro, items, footnote, populateBy } = props

  // Blocks saved before populateBy existed have no value: they are the old
  // typed list, rendered exactly as before.
  const list: Card[] = usesCollection(populateBy)
    ? (await loadIntegrations(props, MAX)).map(toCard)
    : (items || []).map((it, i) => ({
        id: it.id || String(i),
        name: it.name,
        summary: it.summary,
        logoUrl: logoUrlOf(it.logo),
      }))
  if (!list.length) return null

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
        /* The cells themselves are the grid card design (components/cards). */
        .ncx-integrations .ncx-cgrid{margin-top:44px}
        .ncx-integrations .footnote{margin:24px 0 0;color:var(--ncx-muted);font-size:16px}
        @media(max-width:820px){.ncx-integrations{padding-block:36px}
          .ncx-integrations .ncx-cgrid{margin-top:32px}}
      `}</style>

      {label ? <p className="label">{label}</p> : null}
      {heading ? <h2>{heading}</h2> : null}
      {intro ? <p className="intro">{intro}</p> : null}

      <CardGrid
        items={list.map((it) => ({
          id: it.id,
          title: it.name,
          text: it.summary,
          logo: it.logoUrl ? { src: it.logoUrl, alt: '' } : null,
          initial: (it.name || '?').charAt(0),
          href: it.href,
        }))}
      />

      {footnote ? <p className="footnote">{footnote}</p> : null}
    </section>
  )
}
