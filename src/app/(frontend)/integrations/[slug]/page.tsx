import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { ClosingCtaBlock } from '@/blocks/ClosingCTA/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { loadMaster } from '@/blocks/IntegrationsLanding/Component'
import { Breadcrumbs, buildTrail } from '@/components/Breadcrumbs'
import { EdgeCases, type EdgeRow } from '@/components/integrations/EdgeCases'
import { RelatedCards, type RelatedCard } from '@/components/integrations/RelatedCards'
import { SetupLanes, type SetupRow } from '@/components/integrations/SetupLanes'
import { StatusFlow, type FlowRow } from '@/components/integrations/StatusFlow'
import { CMS_TAG, getGlobal, getMany } from '@/utilities/cms'
import { hrefOf, paragraph, type LinkValue } from '@/utilities/cmsValues'
import { integrationHref } from '@/utilities/integrations'
import { pickMedia, type MediaValue } from '@/utilities/media'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { defaultShareImage } from '@/utilities/siteDefaults'
import type {
  ConnectionType,
  Header,
  Integration,
  IntegrationCategory,
  IntegrationsMaster,
  Product,
} from '@/payload-types'

type Args = { params: Promise<{ slug: string }> }

/**
 * An integration's own page, in the site's light theme. Shown only for a
 * published, Live entry with Own page on (integrations.md in the CMS docs,
 * section 4); every other slug is a 404. Section headings come from the
 * entry's own Section headings, then the main Integrations master record's
 * Item page labels, with {name} replaced by the entry's name.
 */

const publicItem = {
  'where[status][equals]': 'live',
  'where[_status][equals]': 'published',
}

const loadItem = async (slug: string): Promise<Integration | null> => {
  const docs = await getMany<Integration>(
    'integrations',
    {
      ...publicItem,
      'where[slug][equals]': slug,
      'where[hasOwnPage][equals]': true,
      limit: 1,
      depth: 2,
    },
    { tags: [CMS_TAG, 'integrations', `integration-${slug}`] },
  )
  return docs[0] || null
}

const populated = <T extends { id: string }>(
  list?: (string | T | null | undefined)[] | null,
): T[] => (list || []).filter((x): x is T => Boolean(x && typeof x === 'object'))

const objectOf = <T,>(v: unknown): T | null => (v && typeof v === 'object' ? (v as T) : null)

const RELATED_MAX = 3

// The entry's hand-picked related integrations that are published and Live,
// in the editor's order, topped up to three with other published Live
// integrations in its category, by order then name.
const loadRelated = async (d: Integration): Promise<Integration[]> => {
  // Visitors can only read published, Live entries, so any other pick comes
  // back as a bare id and drops out here; the checks below make it explicit.
  const picked = populated<Integration>(d.related)
    .filter((r) => r.status === 'live' && (r._status ?? 'published') === 'published')
    .slice(0, RELATED_MAX)
  const category = objectOf<IntegrationCategory>(d.category)?.id ?? (d.category as string)
  if (picked.length >= RELATED_MAX || !category) return picked
  const skip = [d.id, ...picked.map((r) => r.id)]
  const more = await getMany<Integration>(
    'integrations',
    {
      ...publicItem,
      'where[category][equals]': category,
      'where[id][not_in]': skip.join(','),
      sort: 'order,name',
      limit: RELATED_MAX - picked.length,
      depth: 1,
    },
    { tags: [CMS_TAG, 'integrations'] },
  )
  return [...picked, ...more].slice(0, RELATED_MAX)
}

const DEFAULT_LABELS = {
  statusTable: 'What moves between {name} and NeuronCx',
  edgeCases: 'When things do not go to plan',
  setup: 'What it takes to connect {name}',
  related: 'Other systems like {name}',
} as const

const isLocalHost = (host: string) =>
  ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1'].includes(host.toLowerCase())

// The public site address, from the project's site URL setting
// (NEXT_PUBLIC_SERVER_URL). When it is unset, or points at this machine,
// there is no real address, so links that need one are left out rather than
// pointing at localhost.
const siteOrigin = (): string | null => {
  const raw = process.env.NEXT_PUBLIC_SERVER_URL
  if (!raw) return null
  try {
    const url = new URL(raw)
    return isLocalHost(url.hostname) ? null : url.origin
  } catch {
    return null
  }
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const d = await loadItem(slug)
  if (!d) return {}

  const title = d.meta?.title || d.heroHeading || d.name
  const description = d.meta?.description || d.summary || undefined
  const origin = siteOrigin()
  const canonical = origin ? `${origin}/integrations/${slug}` : undefined
  // The item's own share image (its "og" size when there is one), else the
  // site's default share image. A local address is never used.
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

  // The item's own values, over the site-wide defaults (siteDefaults.ts).
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

export default async function IntegrationPage({ params }: Args) {
  const { slug } = await params
  const d = await loadItem(slug)
  if (!d) notFound()
  const [master, related, header] = await Promise.all([
    loadMaster(),
    loadRelated(d),
    // The same request the site header makes, so it is served from the same
    // cache: the NeuronCx logo for the status flow panel.
    getGlobal<Header>('header', { depth: 2, tags: [CMS_TAG, 'header'] }),
  ])

  const heading = (key: keyof typeof DEFAULT_LABELS) =>
    (d.headingOverrides?.[key] || master?.labels?.[key] || DEFAULT_LABELS[key]).replaceAll(
      '{name}',
      d.name,
    )

  const category = objectOf<IntegrationCategory>(d.category)
  const connection = objectOf<ConnectionType>(d.connection)
  const products = populated<Product>(d.products)
  const worksWith = products
    .map((p) => p.name)
    .filter(Boolean)
    .join(', ')
  // The H1 split into words, so each can rise in on its own. The spaces stay
  // as text between them, so the heading still reads as one sentence.
  const words = (d.heroHeading || d.name).split(/\s+/).filter(Boolean)

  // The page's button: the entry's own, else the master record's, else contact.
  const ctaHref =
    (d.cta?.label && hrefOf(d.cta.link as LinkValue)) ||
    hrefOf((master as IntegrationsMaster | null)?.cta?.link as LinkValue) ||
    '/contact'
  const ctaLabel =
    (d.cta?.label && hrefOf(d.cta.link as LinkValue) ? d.cta.label : null) ||
    master?.cta?.label ||
    'Talk to our team'

  const flow: FlowRow[] = (d.statusFlow || [])
    .filter((r) => r && r.event)
    .map((r, i) => ({
      id: r.id || String(i),
      event: r.event,
      inPartner: r.inPartner || null,
      whatHappens: r.whatHappens,
    }))
  const edgeCases: EdgeRow[] = (d.edgeCases || [])
    .filter((r) => r && r.situation)
    .map((r, i) => ({ id: r.id || String(i), situation: r.situation, whatWeDo: r.whatWeDo }))
  const setup: SetupRow[] = (d.setupChecklist || [])
    .filter((r) => r && r.item)
    .map((r, i) => ({ id: r.id || String(i), item: r.item, providedBy: r.providedBy }))
  const chat = (d.chatExample || []).filter((m) => m && m.text)
  const faqs = (d.faqs || []).filter((f) => f && f.question && f.answer)
  const relatedCards: RelatedCard[] = related.map((r) => ({
    id: r.id,
    name: r.name,
    text: r.tagline || r.summary || null,
    href: integrationHref(r),
    logoSrc: pickMedia(r.logo as MediaValue)?.src || null,
  }))

  return (
    <article className="ncx-iitem">
      <style>{`
        .ncx-iitem{font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}

        /* Hero: text only, one column, on a flat light band. The top padding
           clears the fixed site header. */
        .ncx-iitem__hero{background:var(--ncx-cloud);padding:0 0 clamp(56px,7vw,88px)}
        .ncx-iitem__hero .inner{padding-block:calc(64px + clamp(44px,6vw,76px)) 0}
        .ncx-iitem__intro{max-width:820px}
        .ncx-iitem .tags{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px;padding:0;list-style:none}
        .ncx-iitem .tags li{font-size:12px;font-weight:500;color:var(--ncx-ink);background:var(--ncx-white);
          border:1px solid var(--ncx-rule);border-radius:999px;padding:5px 12px}
        .ncx-iitem h1{font-family:var(--font-display),Arial,sans-serif;font-weight:600;
          font-size:clamp(38px,5vw,64px);line-height:1.06;letter-spacing:-.035em;
          margin:0;text-wrap:balance;color:var(--ncx-ink)}
        .ncx-iitem .sub{margin:24px 0 0;max-width:60ch;font-size:19px;line-height:1.65;color:var(--ncx-muted)}
        .ncx-iitem .cta{margin-top:34px;display:flex;gap:12px;flex-wrap:wrap}
        .ncx-iitem .btn{font-family:var(--font-display),Arial,sans-serif;font-size:15px;font-weight:500;
          padding:13px 24px;border-radius:8px;text-decoration:none;display:inline-block;
          background:var(--ncx-crimson);color:var(--ncx-on-navy);transition:background .18s ease}
        .ncx-iitem .btn:hover{background:var(--ncx-crimson-hover)}
        .ncx-iitem .btn:focus-visible,.ncx-iitem a:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}
        .ncx-iitem__works{margin:20px 0 0;font-size:15px;line-height:1.5;color:var(--ncx-muted)}

        /* Hero motion, CSS only and only when the visitor has not asked for
           less: the H1 words rise in one after another (--i), then the
           subheading, button and Works with line fade up in turn (--step),
           starting once the last word is in (--words). Without motion, all of
           it is simply there. */
        .ncx-iitem__word{display:inline-block}
        @media(prefers-reduced-motion:no-preference){
          .ncx-iitem__word{animation:ncxWordRise .6s cubic-bezier(.2,.7,.2,1) both;
            animation-delay:calc(var(--i) * 70ms)}
          .ncx-iitem__fade{animation:ncxFadeUp .6s ease-out both;
            animation-delay:calc(var(--words) * 70ms + 150ms + var(--step) * 100ms)}
        }
        @keyframes ncxWordRise{from{opacity:0;transform:translateY(.45em)}to{opacity:1;transform:none}}
        @keyframes ncxFadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}

        /* Sections */
        .ncx-iitem__section{padding-block:72px}
        .ncx-iitem__section h2{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(28px,3.4vw,38px);line-height:1.15;letter-spacing:-.03em;margin:0 0 32px;color:var(--ncx-ink)}

        /* Chat example */
        .ncx-iitem__chat{max-width:560px;background:var(--ncx-cloud);border:1px solid var(--ncx-rule);
          border-radius:var(--ncx-r-panel);padding:22px;display:flex;flex-direction:column;gap:10px}
        .ncx-iitem__msg{max-width:82%;padding:10px 14px;border-radius:14px;font-size:15px;line-height:1.5;
          background:var(--ncx-white);border:1px solid var(--ncx-rule);color:var(--ncx-ink)}
        .ncx-iitem__msg.is-customer{align-self:flex-end;background:#e7f6e9;border-color:#cfe9d3}
        .ncx-iitem__msg .who{display:block;font-size:12px;color:var(--ncx-muted);margin-bottom:3px}
        .ncx-iitem__msg time{display:block;text-align:right;font-size:11px;color:var(--ncx-faint);margin-top:4px}

        /* FAQ: a smooth open and close, on this page only. Where the browser
           cannot animate to an auto height, answers open at once as before. */
        @supports (interpolate-size: allow-keywords){
          @media(prefers-reduced-motion:no-preference){
            .ncx-iitem__faq{interpolate-size:allow-keywords}
            .ncx-iitem__faq .faq-item::details-content{block-size:0;overflow:hidden;
              transition:block-size .3s ease,content-visibility .3s allow-discrete}
            .ncx-iitem__faq .faq-item[open]::details-content{block-size:auto}
          }
        }

        @media(max-width:960px){
          .ncx-iitem__section{padding-block:56px}
        }
      `}</style>

      <header className="ncx-iitem__hero">
        <div className="inner ncx-container">
          <Breadcrumbs items={buildTrail({ integration: d })} />

          <div
            className="ncx-iitem__intro"
            style={{ '--words': words.length } as React.CSSProperties}
          >
            {category || connection ? (
              <ul className="tags" aria-label="Integration type">
                {category ? <li>{category.name}</li> : null}
                {connection ? <li>{connection.badgeLabel || connection.name}</li> : null}
              </ul>
            ) : null}
            <h1>
              {words.map((w, i) => (
                <React.Fragment key={i}>
                  {i > 0 ? ' ' : null}
                  <span className="ncx-iitem__word" style={{ '--i': i } as React.CSSProperties}>
                    {w}
                  </span>
                </React.Fragment>
              ))}
            </h1>
            {d.heroSubheading || d.summary ? (
              <p className="sub ncx-iitem__fade" style={{ '--step': 0 } as React.CSSProperties}>
                {d.heroSubheading || d.summary}
              </p>
            ) : null}
            <div className="cta ncx-iitem__fade" style={{ '--step': 1 } as React.CSSProperties}>
              <Link className="btn" href={ctaHref}>
                {ctaLabel}
              </Link>
            </div>
            {worksWith ? (
              <p
                className="ncx-iitem__works ncx-iitem__fade"
                style={{ '--step': 2 } as React.CSSProperties}
              >
                Works with {worksWith}
              </p>
            ) : null}
          </div>
        </div>
      </header>

      {flow.length ? (
        <section className="ncx-iitem__section" aria-labelledby="what-moves">
          <div className="ncx-container">
            <h2 id="what-moves">{heading('statusTable')}</h2>
            <StatusFlow
              name={d.name}
              logoSrc={pickMedia(d.logo as MediaValue)?.src || null}
              brandSrc={pickMedia(header?.logo as MediaValue)?.src || '/ncx-logo.png'}
              rows={flow}
            />
          </div>
        </section>
      ) : null}

      {chat.length ? (
        <section className="ncx-iitem__section" aria-labelledby="example">
          <div className="ncx-container">
            <h2 id="example">An example conversation</h2>
            <div className="ncx-iitem__chat">
              {chat.map((m, i) => (
                <p className={`ncx-iitem__msg is-${m.sender}`} key={m.id || i}>
                  {m.label ? <span className="who">{m.label}</span> : null}
                  {m.text}
                  {m.time ? <time>{m.time}</time> : null}
                </p>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {edgeCases.length ? (
        <section className="ncx-iitem__section" aria-labelledby="edge-cases">
          <div className="ncx-container">
            <h2 id="edge-cases">{heading('edgeCases')}</h2>
            <EdgeCases rows={edgeCases} />
          </div>
        </section>
      ) : null}

      {setup.length ? (
        <section className="ncx-iitem__section" aria-labelledby="setup">
          <div className="ncx-container">
            <h2 id="setup">{heading('setup')}</h2>
            <SetupLanes name={d.name} rows={setup} />
          </div>
        </section>
      ) : null}

      {faqs.length ? (
        <div className="ncx-iitem__faq">
          <FAQBlock
            blockType="faq"
            heading={`Questions about ${d.name}`}
            items={faqs.map((f, i) => ({
              id: f.id || String(i),
              question: f.question,
              answer: paragraph(f.answer),
              defaultOpen: i === 0,
            }))}
            emitSchema
          />
        </div>
      ) : null}

      <section className="ncx-iitem__section" aria-labelledby="related">
        <div className="ncx-container">
          <h2 id="related">{heading('related')}</h2>
          <RelatedCards cards={relatedCards} />
        </div>
      </section>

      {/* Shown unless the item's "Show closing panel" is switched off. Items
          saved before the switch existed have no value, so they keep it. */}
      {d.showClosing !== false ? (
        <ClosingCtaBlock
          heading={master?.closing?.heading || 'Connect the systems you already use'}
          subhead={master?.closing?.subheading || null}
          primaryLabel={ctaLabel}
          primaryLink={ctaHref}
        />
      ) : null}
    </article>
  )
}
