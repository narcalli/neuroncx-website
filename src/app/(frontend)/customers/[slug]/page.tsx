import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { CaseStudyGridBlock } from '@/blocks/CaseStudyGrid/Component'
import { ClosingCtaBlock } from '@/blocks/ClosingCTA/Component'
import { BlockIcon } from '@/components/BlockIcon'
import RichText from '@/components/RichText'
import { getMany, CMS_TAG } from '@/utilities/cms'
import {
  byOrderThenName,
  hasPublicPage,
  publicCustomerQuery,
  publicCustomers,
  sectorIds,
} from '@/utilities/customers'
import { pickMedia, type MediaValue } from '@/utilities/media'
import type { Customer, Integration, Product, Sector } from '@/payload-types'

type Args = { params: Promise<{ slug: string }> }

/**
 * A customer's own page, in the site's light theme. Shown only for a
 * published customer with its own page switched on. The CMS sets that to
 * false for any customer with Show real name off and strips their details,
 * so every result and quote that arrives here may be shown.
 */
const loadCustomer = async (slug: string): Promise<(Customer & { slug: string }) | null> => {
  const docs = await getMany<Customer>(
    'customers',
    {
      ...publicCustomerQuery,
      'where[slug][equals]': slug,
      limit: 1,
      depth: 2,
    },
    { tags: [CMS_TAG, 'customers', `customer-${slug}`] },
  )
  const c = publicCustomers(docs)[0]
  return hasPublicPage(c) ? c : null
}

// Up to three other customers in the same sector that have their own page.
const loadOthers = async (c: Customer): Promise<Customer[]> => {
  const ids = sectorIds(c.sectors)
  if (!ids.length) return []
  const docs = await getMany<Customer>(
    'customers',
    {
      ...publicCustomerQuery,
      'where[sectors][in]': ids.join(','),
      'where[hasOwnPage][equals]': true,
      'where[id][not_equals]': c.id,
      sort: 'order',
      limit: 12,
      depth: 1,
    },
    { tags: [CMS_TAG, 'customers'] },
  )
  return publicCustomers(docs).filter(hasPublicPage).sort(byOrderThenName).slice(0, 3)
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const c = await loadCustomer(slug)
  if (!c) return {}
  return {
    title: c.heroHeading || c.name,
    description: c.summary,
  }
}

const populated = <T extends { id: string }>(
  list?: (string | T | null | undefined)[] | null,
): T[] => (list || []).filter((x): x is T => Boolean(x && typeof x === 'object'))

const hasText = (rich: unknown) =>
  Boolean(rich && typeof rich === 'object' && (rich as any).root?.children?.length)

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '') || 'section'

// "since" is a full date; the page shows month and year. Read in India time,
// so a date picked as midnight IST does not slip into the previous month.
const monthYear = (iso?: string | null) => {
  if (!iso) return null
  const d = new Date(iso)
  return Number.isNaN(d.getTime())
    ? null
    : d.toLocaleDateString('en-GB', { month: 'long', year: 'numeric', timeZone: 'Asia/Kolkata' })
}

type Part = { id: string; title: string; eyebrow?: string; body: unknown }
type Quote = NonNullable<Customer['quotes']>[number]

export default async function CustomerPage({ params }: Args) {
  const { slug } = await params
  const c = await loadCustomer(slug)
  if (!c) notFound()
  const others = await loadOthers(c)

  const sectors = populated<Sector>(c.sectors)
  const products = populated<Product>(c.products)
  const integrations = populated<Integration>(c.integrations)
  const logo = pickMedia(c.image as MediaValue)
  const logoHeight = Math.round(40 * ((c.logoScale ?? 100) / 100))
  const since = monthYear(c.since)

  // Details card rows; a row with no value is left out.
  const rows: { label: string; value: React.ReactNode }[] = []
  if (sectors.length) rows.push({ label: 'Sector', value: sectors.map((s) => s.name).join(', ') })
  if (c.city) rows.push({ label: 'City', value: c.city })
  if (typeof c.locations === 'number')
    rows.push({ label: 'Sites', value: new Intl.NumberFormat('en-IN').format(c.locations) })
  if (since) rows.push({ label: 'Customer since', value: since })
  if (products.length) {
    rows.push({
      label: 'Products',
      value: (
        <span className="pills">
          {products.map((p) => (
            <span key={p.id} className="tag">
              {p.name}
            </span>
          ))}
        </span>
      ),
    })
  }
  const hasCard = Boolean(logo || rows.length)

  // Results, with each source numbered once and listed under the band. When
  // every result shares one source, the line just names it.
  const results = (c.results || []).filter((r) => r && r.value && r.metric)
  const sources = Array.from(
    new Set(results.map((r) => r.source?.trim()).filter((s): s is string => Boolean(s))),
  )
  const oneSource = sources.length === 1 && results.every((r) => r.source?.trim() === sources[0])
  const sourceNumber = (r: (typeof results)[number]) =>
    !oneSource && r.source?.trim() ? sources.indexOf(r.source.trim()) + 1 : null

  // Story sections, in order, with unique anchors for "On this page". The
  // "What they use" heading further down already has its own id.
  const parts: Part[] = []
  const used = new Set<string>(['what-they-use'])
  const addPart = (title: string, body: unknown, eyebrow?: string) => {
    let id = slugify(title)
    for (let n = 2; used.has(id); n++) id = `${slugify(title)}-${n}`
    used.add(id)
    parts.push({ id, title, body, eyebrow })
  }
  if (hasText(c.challenge)) addPart('The challenge', c.challenge)
  if (hasText(c.approach)) addPart('What we set up', c.approach)
  for (const s of c.storySections || []) {
    if (!s || (!s.heading && !hasText(s.body))) continue
    const product = s.product && typeof s.product === 'object' ? (s.product as Product) : null
    addPart(s.heading || product?.name || 'More detail', s.body, product?.name)
  }
  // Quotes sit between sections; any left over follow the last one.
  const quotes = (c.quotes || []).filter((q): q is Quote => Boolean(q && q.quote && q.person))
  const between = Math.max(0, parts.length - 1)
  const flow: ({ kind: 'part'; part: Part } | { kind: 'quote'; quote: Quote })[] = []
  parts.forEach((part, i) => {
    flow.push({ kind: 'part', part })
    if (i < between && quotes[i]) flow.push({ kind: 'quote', quote: quotes[i] })
  })
  quotes
    .slice(Math.min(between, quotes.length))
    .forEach((quote) => flow.push({ kind: 'quote', quote }))

  return (
    <article className="ncx-cust">
      <style>{`
        .ncx-cust{font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}

        /* Hero: the same stage, breadcrumb pill and spacing as the Stat Hero
           on /integrations. */
        .ncx-cust__hero{position:relative;overflow:hidden;isolation:isolate;
          background:var(--wash);padding:0 0 clamp(48px,6vw,72px)}
        .ncx-cust__hero::before{content:"";position:absolute;inset:-35%;z-index:0;
          background:
            radial-gradient(38% 46% at 18% 28%, var(--g1), transparent 66%),
            radial-gradient(44% 52% at 78% 16%, var(--g2), transparent 66%),
            radial-gradient(46% 54% at 62% 88%, var(--g3), transparent 66%),
            radial-gradient(42% 50% at 8% 86%, var(--g4), transparent 66%);
          animation:ncxDrift 26s ease-in-out infinite alternate;will-change:transform}
        @keyframes ncxDrift{
          0%{transform:translate3d(0,0,0) scale(1) rotate(0deg)}
          50%{transform:translate3d(5%,-4%,0) scale(1.16) rotate(4deg)}
          100%{transform:translate3d(-4%,5%,0) scale(1.06) rotate(-3deg)}
        }
        @media(prefers-reduced-motion:reduce){.ncx-cust__hero::before{animation:none}}
        .ncx-cust__hero .inner{position:relative;z-index:1;padding-block:calc(64px + clamp(44px,6vw,76px)) 0}
        .ncx-cust .crumb{display:inline-flex;align-items:center;gap:9px;flex-wrap:wrap;
          font-family:var(--font-display),Arial,sans-serif;font-size:13px;color:var(--ncx-muted);
          border:1px solid var(--ncx-rule);background:var(--ncx-white);
          padding:7px 15px;border-radius:999px;margin:0 0 24px}
        .ncx-cust .crumb a{color:var(--ncx-muted);text-decoration:none}
        .ncx-cust .crumb a:hover{color:var(--ncx-ink)}
        .ncx-cust .crumb [aria-current]{color:var(--ncx-ink)}
        .ncx-cust .crumb .sep{color:var(--ncx-faint)}
        .ncx-cust .spark{width:7px;height:7px;border-radius:50%;background:var(--ncx-crimson)}
        .ncx-cust__grid{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,.9fr);gap:56px;align-items:start}
        .ncx-cust__grid.is-single{grid-template-columns:minmax(0,1fr)}
        .ncx-cust .sectors{display:flex;flex-wrap:wrap;gap:8px;margin:0 0 18px;padding:0;list-style:none}
        .ncx-cust .sector{font-size:12px;font-weight:500;color:var(--ncx-ink);background:var(--ncx-white);
          border:1px solid var(--ncx-rule);border-radius:999px;padding:5px 12px}
        .ncx-cust h1{font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(36px,4.6vw,56px);line-height:1.06;letter-spacing:-.035em;
          margin:0;max-width:18ch;text-wrap:balance;color:var(--ncx-ink)}
        .ncx-cust .sub{margin:24px 0 0;max-width:52ch;font-size:19px;line-height:1.65;color:var(--ncx-muted)}
        .ncx-cust .cta{margin-top:34px;display:flex;gap:12px;flex-wrap:wrap}
        .ncx-cust .btn{font-family:var(--font-display),Arial,sans-serif;font-size:15px;font-weight:500;
          padding:13px 24px;border-radius:8px;text-decoration:none;display:inline-block;
          background:var(--ncx-crimson);color:var(--ncx-on-navy);transition:background .18s ease}
        .ncx-cust .btn:hover{background:var(--ncx-crimson-hover)}
        .ncx-cust .btn:focus-visible,.ncx-cust a:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}

        /* Details card */
        .ncx-cust__card{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);
          box-shadow:var(--ncx-shadow);padding:24px 26px}
        .ncx-cust__logo{display:flex;align-items:center;min-height:40px;padding-bottom:20px;margin-bottom:4px;
          border-bottom:1px solid var(--ncx-rule-soft)}
        .ncx-cust__logo img{width:auto;max-width:100%;object-fit:contain}
        .ncx-cust__rows{margin:0}
        .ncx-cust__row{display:grid;grid-template-columns:minmax(0,9rem) minmax(0,1fr);gap:16px;
          padding:13px 0;border-bottom:1px solid var(--ncx-rule-soft)}
        .ncx-cust__row:last-child{border-bottom:0;padding-bottom:0}
        .ncx-cust__row dt{font-size:13px;color:var(--ncx-muted)}
        .ncx-cust__row dd{margin:0;font-size:15px;color:var(--ncx-ink);font-weight:500}
        .ncx-cust .pills{display:flex;flex-wrap:wrap;gap:6px}
        .ncx-cust .tag{padding:3px 10px;border-radius:999px;background:var(--ncx-cloud);
          border:1px solid var(--ncx-rule-soft);font-size:12px;font-weight:500;color:var(--ncx-ink)}

        /* Results */
        .ncx-cust__results{background:var(--ncx-white);border-block:1px solid var(--ncx-rule);padding:44px 0}
        .ncx-cust__metrics{list-style:none;margin:0;padding:0;display:grid;
          grid-template-columns:repeat(var(--cols),minmax(0,1fr));gap:32px}
        .ncx-cust__value{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
          font-size:clamp(34px,3.6vw,46px);line-height:1;letter-spacing:-.03em;color:var(--ncx-ink)}
        .ncx-cust__metric{margin:12px 0 0;font-size:15px;color:var(--ncx-ink)}
        .ncx-cust__metric sup,.ncx-cust__sources sup{font-size:11px;color:var(--ncx-muted);margin-left:2px}
        .ncx-cust__meta{margin:6px 0 0;font-size:13px;color:var(--ncx-muted)}
        .ncx-cust__sources{margin:0;padding-top:14px;font-size:12px;color:var(--ncx-faint);
          display:flex;flex-wrap:wrap;gap:4px 18px}

        /* Story */
        .ncx-cust__story{padding:72px 0 80px}
        .ncx-cust__storygrid{display:grid;grid-template-columns:200px minmax(0,52ch);gap:64px;align-items:start}
        .ncx-cust__storygrid.is-single{grid-template-columns:minmax(0,52ch)}
        .ncx-cust__toc{position:sticky;top:104px}
        .ncx-cust__toc p{margin:0 0 12px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ncx-muted)}
        .ncx-cust__toc ol{list-style:none;margin:0;padding:0;border-left:1px solid var(--ncx-rule)}
        .ncx-cust__toc a{display:block;padding:6px 0 6px 14px;margin-left:-1px;border-left:1px solid transparent;
          font-size:14px;line-height:1.4;color:var(--ncx-muted);text-decoration:none}
        .ncx-cust__toc a:hover{color:var(--ncx-ink);border-left-color:var(--ncx-hover-line)}
        .ncx-cust__part{scroll-margin-top:104px}
        .ncx-cust__part + .ncx-cust__part{margin-top:56px}
        .ncx-cust__part h2{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:26px;
          letter-spacing:-.01em;color:var(--ncx-ink);margin:0 0 16px}
        .ncx-cust__eyebrow{margin:0 0 8px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ncx-crimson-ink)}
        .ncx-cust__part .payload-richtext h3{font-family:var(--font-display),Arial,sans-serif}
        .ncx-cust__pull{margin:48px 0;padding:2px 0 2px 24px;border-left:2px solid var(--ncx-crimson)}
        .ncx-cust__pull blockquote{margin:0}
        .ncx-cust__pull p{margin:0;font-family:var(--font-display),Arial,sans-serif;font-weight:500;
          font-size:clamp(20px,2.1vw,24px);line-height:1.45;letter-spacing:-.01em;color:var(--ncx-ink)}
        .ncx-cust__pull figcaption{margin-top:14px;font-size:14px;color:var(--ncx-muted)}
        .ncx-cust__pull figcaption b{color:var(--ncx-ink);font-weight:600}

        /* What they use */
        .ncx-cust__uses{padding:0 0 24px}
        .ncx-cust__uses h2{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
          font-size:clamp(1.6rem,3vw,2rem);color:var(--ncx-ink);margin:0 0 28px}
        .ncx-cust__uses h3{margin:0 0 14px;font-size:12px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;color:var(--ncx-muted)}
        .ncx-cust__uses section + section{margin-top:32px}
        .ncx-cust__cards{list-style:none;margin:0;padding:0;display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:14px}
        .ncx-cust__small{display:flex;gap:12px;align-items:flex-start;background:var(--ncx-white);
          border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-card);padding:16px 18px;height:100%}
        .ncx-cust__mark{flex:0 0 34px;width:34px;height:34px;border-radius:8px;background:var(--ncx-cloud);
          display:flex;align-items:center;justify-content:center;overflow:hidden;color:var(--ncx-ink)}
        .ncx-cust__mark svg{width:18px;height:18px}
        .ncx-cust__mark img{max-width:26px;max-height:26px;width:auto;height:auto;object-fit:contain}
        .ncx-cust__initial{font-family:var(--font-display),Arial,sans-serif;font-size:15px;font-weight:500;color:var(--ncx-muted)}
        .ncx-cust__small b{display:block;font-family:var(--font-display),Arial,sans-serif;font-size:15px;font-weight:600;color:var(--ncx-ink)}
        .ncx-cust__small span.note{display:block;margin-top:4px;font-size:13px;line-height:1.5;color:var(--ncx-muted)}

        @media(max-width:960px){
          .ncx-cust__grid{grid-template-columns:minmax(0,1fr);gap:36px}
          .ncx-cust__metrics{grid-template-columns:repeat(var(--cols-tablet),minmax(0,1fr))}
          .ncx-cust__storygrid{grid-template-columns:minmax(0,52ch);gap:28px}
          .ncx-cust__toc{position:static;background:var(--ncx-white);border:1px solid var(--ncx-rule);
            border-radius:var(--ncx-r-card);padding:18px 20px}
          .ncx-cust__story{padding:56px 0}
        }
        @media(max-width:600px){
          .ncx-cust__metrics{grid-template-columns:minmax(0,1fr);gap:24px}
          .ncx-cust__row{grid-template-columns:minmax(0,1fr);gap:4px}
          .ncx-cust__card{padding:20px}
        }
      `}</style>

      <header className="ncx-cust__hero">
        <div className="inner ncx-container">
          <nav className="crumb" aria-label="Breadcrumb">
            <span className="spark" aria-hidden="true" />
            <Link href="/customers">Customers</Link>
            <span className="sep" aria-hidden="true">
              /
            </span>
            <span aria-current="page">{c.name}</span>
          </nav>

          <div className={`ncx-cust__grid${hasCard ? '' : ' is-single'}`}>
            <div>
              {sectors.length ? (
                <ul className="sectors" aria-label="Sector">
                  {sectors.map((s) => (
                    <li key={s.id} className="sector">
                      {s.name}
                    </li>
                  ))}
                </ul>
              ) : null}
              <h1>{c.heroHeading}</h1>
              {c.heroSubheading ? <p className="sub">{c.heroSubheading}</p> : null}
              <div className="cta">
                <Link className="btn" href="/contact">
                  Book a demo
                </Link>
              </div>
            </div>

            {hasCard ? (
              <aside className="ncx-cust__card" aria-label={`About ${c.name}`}>
                {logo ? (
                  <div className="ncx-cust__logo">
                    <Image
                      src={logo.src}
                      alt={c.name}
                      width={logo.width || 400}
                      height={logo.height || 200}
                      style={{ height: logoHeight }}
                      sizes="320px"
                      unoptimized={logo.unoptimized}
                    />
                  </div>
                ) : null}
                {rows.length ? (
                  <dl className="ncx-cust__rows">
                    {rows.map((r) => (
                      <div className="ncx-cust__row" key={r.label}>
                        <dt>{r.label}</dt>
                        <dd>{r.value}</dd>
                      </div>
                    ))}
                  </dl>
                ) : null}
              </aside>
            ) : null}
          </div>
        </div>
      </header>

      {results.length ? (
        <>
          <section
            className="ncx-cust__results"
            aria-label="Results"
            style={
              {
                '--cols': Math.min(results.length, 4),
                '--cols-tablet': Math.min(results.length, 2),
              } as React.CSSProperties
            }
          >
            <div className="ncx-container">
              <ul className="ncx-cust__metrics">
                {results.slice(0, 4).map((r, i) => {
                  const n = sourceNumber(r)
                  return (
                    <li key={r.id || i}>
                      <div className="ncx-cust__value">{r.value}</div>
                      <p className="ncx-cust__metric">
                        {r.metric}
                        {n ? <sup>{n}</sup> : null}
                      </p>
                      {r.baseline || r.period ? (
                        <p className="ncx-cust__meta">
                          {[r.baseline ? `Baseline ${r.baseline}` : null, r.period]
                            .filter(Boolean)
                            .join(' · ')}
                        </p>
                      ) : null}
                    </li>
                  )
                })}
              </ul>
            </div>
          </section>
          {sources.length ? (
            <div className="ncx-container">
              <p className="ncx-cust__sources">
                {oneSource ? (
                  <span>Source: {sources[0]}</span>
                ) : (
                  sources.map((s, i) => (
                    <span key={s}>
                      <sup>{i + 1}</sup> {s}
                    </span>
                  ))
                )}
              </p>
            </div>
          ) : null}
        </>
      ) : null}

      {flow.length ? (
        <section className="ncx-cust__story">
          <div
            className={`ncx-cust__storygrid ncx-container${parts.length > 1 ? '' : ' is-single'}`}
          >
            {parts.length > 1 ? (
              <nav className="ncx-cust__toc" aria-label="On this page">
                <p>On this page</p>
                <ol>
                  {parts.map((p) => (
                    <li key={p.id}>
                      <a href={`#${p.id}`}>{p.title}</a>
                    </li>
                  ))}
                </ol>
              </nav>
            ) : null}
            <div>
              {flow.map((item, i) =>
                item.kind === 'part' ? (
                  <section className="ncx-cust__part" id={item.part.id} key={item.part.id}>
                    {item.part.eyebrow && item.part.eyebrow !== item.part.title ? (
                      <p className="ncx-cust__eyebrow">{item.part.eyebrow}</p>
                    ) : null}
                    <h2>{item.part.title}</h2>
                    {hasText(item.part.body) ? (
                      <RichText data={item.part.body as any} enableGutter={false} />
                    ) : null}
                  </section>
                ) : (
                  <figure className="ncx-cust__pull" key={item.quote.id || `q${i}`}>
                    <blockquote>
                      <p>&ldquo;{item.quote.quote}&rdquo;</p>
                    </blockquote>
                    <figcaption>
                      <b>{item.quote.person}</b>
                      {item.quote.role ? `, ${item.quote.role}` : ''}
                    </figcaption>
                  </figure>
                ),
              )}
            </div>
          </div>
        </section>
      ) : null}

      {products.length || integrations.length ? (
        <section className="ncx-cust__uses" aria-labelledby="what-they-use">
          <div className="ncx-container">
            <h2 id="what-they-use">What they use</h2>
            {products.length ? (
              <section aria-label="Products">
                <h3>Products</h3>
                <ul className="ncx-cust__cards">
                  {products.map((p) => (
                    <li key={p.id}>
                      <div className="ncx-cust__small">
                        <span className="ncx-cust__mark" aria-hidden="true">
                          <BlockIcon name={p.icon} fallback="layers" />
                        </span>
                        <span>
                          <b>{p.name}</b>
                          {p.shortDescription ? (
                            <span className="note">{p.shortDescription}</span>
                          ) : null}
                        </span>
                      </div>
                    </li>
                  ))}
                </ul>
              </section>
            ) : null}
            {integrations.length ? (
              <section aria-label="Integrations">
                <h3>Integrations</h3>
                <ul className="ncx-cust__cards">
                  {/* Not linked: there is no /integrations/[slug] route, and
                      integrations have no own page yet. */}
                  {integrations.map((it) => {
                    const mark = pickMedia(it.logo as MediaValue)
                    return (
                      <li key={it.id}>
                        <div className="ncx-cust__small">
                          <span className="ncx-cust__mark" aria-hidden="true">
                            {mark ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={mark.src} alt="" loading="lazy" />
                            ) : (
                              <span className="ncx-cust__initial">{it.name.charAt(0)}</span>
                            )}
                          </span>
                          <span>
                            <b>{it.name}</b>
                            {it.summary ? <span className="note">{it.summary}</span> : null}
                          </span>
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </section>
            ) : null}
          </div>
        </section>
      ) : null}

      {others.length ? (
        <CaseStudyGridBlock
          blockType="caseStudyGrid"
          heading="More customers"
          populateBy="selection"
          selectedDocs={others}
          cardStyle="tilt"
        />
      ) : null}

      <ClosingCtaBlock
        heading="See how this would work for your team"
        primaryLabel="Book a 20-minute demo"
        primaryLink="/contact"
      />
    </article>
  )
}
