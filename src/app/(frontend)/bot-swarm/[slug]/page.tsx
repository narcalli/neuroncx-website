import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { ClosingCtaBlock } from '@/blocks/ClosingCTA/Component'
import { Breadcrumbs, buildTrail } from '@/components/Breadcrumbs'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { RenderSections, type SectionContext } from '@/components/sections/RenderSections'
import { CONTENT_COLLECTIONS, fillHeading, SECTION_HEADINGS, sectionKeyOf } from '@/content/registry'
import { hrefOf, type LinkValue } from '@/utilities/cmsValues'
import {
  effectiveLayout,
  getEntryPage,
  getHub,
  groupOf,
  isDraft,
  isLocalHost,
  siteOrigin,
} from '@/utilities/content'
import { pickMedia, type MediaValue } from '@/utilities/media'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { defaultShareImage } from '@/utilities/siteDefaults'

type Args = { params: Promise<{ slug: string }> }

const COLLECTION = 'microApps' as const
const { route, hubLabel } = CONTENT_COLLECTIONS[COLLECTION]

const CHANNELS: Record<string, string> = { whatsapp: 'WhatsApp', calls: 'Calls', web: 'Web' }

/**
 * A bot swarm agent's own page, in the light theme of the integration pages
 * (micro_apps_swarm.md section 9, foundation.md section 7.1). Only a
 * published agent with status Live or Pilot and Own page on has one; every
 * other slug is a 404.
 *
 * In draft mode (the CMS Preview button or live preview) the latest draft is
 * shown instead, Planned agents included, with a Planned tag.
 *
 * Hero, then the sections of the effective layout (the hub's default while
 * the agent uses the page defaults, else its own), then the hub's closing
 * panel, the page's only navy section, unless the layout places it.
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

  const media = pickMedia(d.media as MediaValue)
  const customerSeesInHero = !media && Boolean(d.customerSees)
  const channels = (d.channel ?? []).map((c) => CHANNELS[c]).filter(Boolean)

  const secondary = hub?.closing?.secondaryCta
  const closing = (
    <ClosingCtaBlock
      heading={fillHeading(hub?.closing?.heading || SECTION_HEADINGS.closing, tokens)}
      subhead={hub?.closing?.subheading || null}
      primaryLabel={ctaLabel}
      primaryLink={ctaHref}
      secondaryLabel={secondary?.label || null}
      secondaryLink={secondary?.label ? hrefOf(secondary as LinkValue) : null}
    />
  )
  const ctx: SectionContext = { collection: COLLECTION, hub, entry: d, tokens, customerSeesInHero, closing, draft }
  const closingInLayout = layout.some((b) => sectionKeyOf(b.blockType) === 'closing')

  return (
    <article className="ncx-agent">
      {draft ? <LivePreviewListener /> : null}
      <style>{`
        .ncx-agent{font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-agent__hero{background:var(--ncx-cloud);padding:0 0 clamp(56px,7vw,88px)}
        .ncx-agent__hero .inner{padding-block:calc(64px + clamp(44px,6vw,76px)) 0;
          --crumb-top:calc(28px - clamp(44px,6vw,76px))}
        .ncx-agent__cols{display:grid;gap:48px;align-items:center}
        .ncx-agent__cols.has-side{grid-template-columns:minmax(0,1.25fr) minmax(0,1fr)}
        .ncx-agent__intro{max-width:760px}
        .ncx-agent .tags{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px;padding:0;list-style:none}
        .ncx-agent .tags li{font-size:12px;font-weight:500;color:var(--ncx-ink);background:var(--ncx-white);
          border:1px solid var(--ncx-rule);border-radius:999px;padding:5px 12px}
        .ncx-agent .tags .family{background:var(--ncx-navy);color:var(--ncx-on-navy);border-color:var(--ncx-navy)}
        .ncx-agent .tags .pilot{color:var(--ncx-crimson-ink);border-color:currentColor}
        .ncx-agent .tags .planned{border-style:dashed}
        .ncx-agent h1{font-family:var(--font-display),Arial,sans-serif;font-weight:600;
          font-size:clamp(36px,4.6vw,60px);line-height:1.06;letter-spacing:-.035em;
          margin:0;text-wrap:balance;color:var(--ncx-ink)}
        .ncx-agent .sub{margin:24px 0 0;max-width:60ch;font-size:19px;line-height:1.65;color:var(--ncx-muted)}
        .ncx-agent .cta{margin-top:34px;display:flex;gap:12px;flex-wrap:wrap}
        .ncx-agent .btn{font-family:var(--font-display),Arial,sans-serif;font-size:15px;font-weight:500;
          padding:13px 24px;border-radius:8px;text-decoration:none;display:inline-block;
          background:var(--ncx-crimson);color:var(--ncx-on-navy);transition:background .18s ease}
        .ncx-agent .btn:hover{background:var(--ncx-crimson-hover)}
        .ncx-agent .btn:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}

        /* The right column: a picture, or what the customer sees as a chat. */
        .ncx-agent__media{margin:0}
        .ncx-agent__media img{display:block;width:100%;height:auto;border-radius:var(--ncx-r-panel);
          border:1px solid var(--ncx-rule);background:var(--ncx-white)}
        .ncx-agent__sees{background:var(--ncx-white);border:1px solid var(--ncx-rule);
          border-radius:var(--ncx-r-panel);padding:22px;box-shadow:0 24px 48px -32px rgba(15,18,32,.35)}
        .ncx-agent__sees h2{font-family:var(--font-display),Arial,sans-serif;font-size:14px;font-weight:600;
          margin:0 0 14px;color:var(--ncx-muted);letter-spacing:0}
        .ncx-agent__bubble{margin:0;max-width:92%;padding:12px 15px;border-radius:14px 14px 14px 4px;
          background:var(--ncx-cloud);border:1px solid var(--ncx-rule);font-size:16px;line-height:1.55;
          color:var(--ncx-ink)}
        .ncx-agent__bubble .who{display:block;font-size:12px;color:var(--ncx-muted);margin-bottom:4px}

        @media(max-width:960px){.ncx-agent__cols.has-side{grid-template-columns:minmax(0,1fr)}}
      `}</style>

      <header className="ncx-agent__hero">
        <div className="inner ncx-container">
          <Breadcrumbs
            items={buildTrail({
              entry: { name: d.name, hub: { label: hubLabel, href: route }, group: family?.name },
            })}
          />
          <div className={`ncx-agent__cols${media || customerSeesInHero ? ' has-side' : ''}`}>
            <div className="ncx-agent__intro">
              <ul className="tags" aria-label="About this agent">
                {family ? <li className="family">{family.name}</li> : null}
                {channels.map((c) => (
                  <li key={c}>{c}</li>
                ))}
                {d.status === 'pilot' ? <li className="pilot">Pilot</li> : null}
                {d.status === 'planned' ? <li className="pilot planned">Planned</li> : null}
              </ul>
              <h1>{d.heroHeading || d.name}</h1>
              {d.heroSubheading || d.summary ? <p className="sub">{d.heroSubheading || d.summary}</p> : null}
              <div className="cta">
                <Link className="btn" href={ctaHref}>
                  {ctaLabel}
                </Link>
              </div>
            </div>
            {media ? (
              <figure className="ncx-agent__media">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={media.src} alt={media.alt || ''} width={media.width ?? undefined} height={media.height ?? undefined} />
              </figure>
            ) : customerSeesInHero ? (
              <div className="ncx-agent__sees">
                <h2>What the customer sees</h2>
                <p className="ncx-agent__bubble">
                  <span className="who">{d.name}</span>
                  {d.customerSees}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      </header>

      <RenderSections blocks={layout} ctx={ctx} />

      {closingInLayout ? null : closing}
    </article>
  )
}
