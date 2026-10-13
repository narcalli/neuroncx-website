import type { Metadata } from 'next'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import RichText from '@/components/RichText'
import { getMany, CMS_TAG } from '@/utilities/cms'
import { hasPublicPage, publicCustomerQuery, publicCustomers } from '@/utilities/customers'
import { pickMedia, type MediaValue } from '@/utilities/media'
import type { Customer, Product, Sector } from '@/payload-types'

type Args = { params: Promise<{ slug: string }> }

/**
 * A customer's own page. Shown only for a published customer with its own
 * page switched on. The CMS sets that to false for any customer whose name is
 * not cleared, and only returns cleared quotes and verified results, so
 * everything rendered here has been cleared.
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

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const c = await loadCustomer(slug)
  if (!c) return {}
  return {
    title: c.heroHeading || c.name,
    description: c.summary,
  }
}

const hasText = (rich: unknown) => Boolean(rich && typeof rich === 'object' && (rich as any).root?.children?.length)

export default async function CustomerPage({ params }: Args) {
  const { slug } = await params
  const c = await loadCustomer(slug)
  if (!c) notFound()

  const sectorNames = ((c.sectors || []) as (string | Sector)[])
    .filter((s): s is Sector => typeof s === 'object' && s !== null)
    .map((s) => s.name)
  const logo = pickMedia(c.image as MediaValue)
  const logoHeight = Math.round(44 * ((c.logoScale ?? 100) / 100))
  const results = (c.results || []).filter((r) => r && r.value && r.metric)
  const sections = (c.storySections || []).filter((s) => s && (s.heading || hasText(s.body)))
  const quotes = (c.quotes || []).filter((q) => q && q.quote && q.person)

  return (
    <article className="ncx-case">
      <style>{`
        .ncx-case{font-family:var(--font-body),Arial,sans-serif;color:#1A1A2E}
        .ncx-case__hero{background:var(--ncx-navy);color:#fff;padding:96px 24px 80px}
        .ncx-case__wrap{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:24px}
        .ncx-case__crumb{font-size:13px;color:rgba(255,255,255,.7);text-decoration:none}
        .ncx-case__crumb:hover{color:#fff}
        .ncx-case__sectors{display:flex;flex-wrap:wrap;gap:8px}
        .ncx-case__sector{padding:4px 12px;border-radius:999px;background:var(--ncx-navy-tint);font-size:12px;font-weight:500}
        /* Logos are made for light grounds, so the logo sits on a white plate. */
        .ncx-case__logo{align-self:flex-start;background:var(--ncx-white);border-radius:10px;padding:12px 18px;display:flex;align-items:center}
        .ncx-case__logo img{width:auto;object-fit:contain}
        .ncx-case__client{font-weight:600;font-size:14px;letter-spacing:.04em;text-transform:uppercase;color:#FF8F8F;margin:0}
        .ncx-case__title{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:clamp(2rem,4.5vw,3rem);line-height:1.15;margin:0}
        .ncx-case__summary{font-size:18px;line-height:1.6;color:rgba(255,255,255,.85);margin:0;max-width:60ch}
        .ncx-case__metrics{background:var(--ncx-cloud);padding:48px 24px}
        .ncx-case__metric-row{max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:32px}
        .ncx-case__metric-value{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:36px;color:var(--ncx-crimson)}
        .ncx-case__metric-label{font-size:14px;color:var(--ncx-muted);margin-top:4px}
        .ncx-case__metric-note{font-size:12px;color:var(--ncx-faint);margin-top:6px;line-height:1.5}
        .ncx-case__body{max-width:760px;margin:0 auto;padding:72px 24px;display:flex;flex-direction:column;gap:48px}
        .ncx-case__part h2{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:24px;color:var(--ncx-ink);margin:0 0 16px}
        .ncx-case__eyebrow{font-weight:600;font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--ncx-crimson-ink);margin:0 0 8px}
        .ncx-case__quotes{display:flex;flex-direction:column;gap:24px}
        .ncx-case__quote{margin:0;padding:24px 28px;border-left:3px solid var(--ncx-crimson);background:var(--ncx-cloud);border-radius:0 12px 12px 0}
        .ncx-case__quote p{margin:0;font-size:18px;line-height:1.6;color:var(--ncx-ink)}
        .ncx-case__quote figcaption{margin-top:12px;font-size:14px;color:var(--ncx-muted)}
        .ncx-case__quote figcaption b{color:var(--ncx-ink);font-weight:600}
        .ncx-case__close{background:var(--ncx-cloud);padding:72px 24px;text-align:center}
        .ncx-case__close h2{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:28px;color:var(--ncx-navy);margin:0 0 24px}
        .ncx-case__cta{display:inline-block;background:var(--ncx-crimson);color:#fff;font-family:var(--font-display),Arial,sans-serif;font-weight:600;padding:15px 30px;border-radius:8px;text-decoration:none}
        .ncx-case__cta:hover{background:#A91F1F}
      `}</style>

      <header className="ncx-case__hero">
        <div className="ncx-case__wrap">
          <Link href="/customers" className="ncx-case__crumb">
            &larr; All customers
          </Link>
          {sectorNames.length ? (
            <div className="ncx-case__sectors">
              {sectorNames.map((n) => (
                <span key={n} className="ncx-case__sector">
                  {n}
                </span>
              ))}
            </div>
          ) : null}
          {logo ? (
            <span className="ncx-case__logo">
              <Image
                src={logo.src}
                alt={c.name}
                width={logo.width || 400}
                height={logo.height || 200}
                style={{ height: logoHeight }}
                sizes="240px"
                unoptimized={logo.unoptimized}
              />
            </span>
          ) : null}
          <p className="ncx-case__client">{c.name}</p>
          {c.heroHeading ? <h1 className="ncx-case__title">{c.heroHeading}</h1> : null}
          {c.heroSubheading ? <p className="ncx-case__summary">{c.heroSubheading}</p> : null}
        </div>
      </header>

      {results.length ? (
        <section className="ncx-case__metrics" aria-label="Results">
          <div className="ncx-case__metric-row">
            {results.map((r, i) => (
              <div key={r.id || i}>
                <div className="ncx-case__metric-value">{r.value}</div>
                <div className="ncx-case__metric-label">{r.metric}</div>
                {r.baseline || r.period || r.source ? (
                  <div className="ncx-case__metric-note">
                    {[r.baseline ? `Baseline ${r.baseline}` : null, r.period, r.source ? `Source: ${r.source}` : null]
                      .filter(Boolean)
                      .join(' · ')}
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {hasText(c.challenge) || hasText(c.approach) || sections.length || quotes.length ? (
        <div className="ncx-case__body">
          {hasText(c.challenge) ? (
            <section className="ncx-case__part">
              <h2>The challenge</h2>
              <RichText data={c.challenge as any} enableGutter={false} />
            </section>
          ) : null}
          {hasText(c.approach) ? (
            <section className="ncx-case__part">
              <h2>The approach</h2>
              <RichText data={c.approach as any} enableGutter={false} />
            </section>
          ) : null}
          {sections.map((s, i) => {
            const product = s.product && typeof s.product === 'object' ? (s.product as Product) : null
            return (
              <section className="ncx-case__part" key={s.id || i}>
                {product ? <p className="ncx-case__eyebrow">{product.name}</p> : null}
                {s.heading ? <h2>{s.heading}</h2> : null}
                {hasText(s.body) ? <RichText data={s.body as any} enableGutter={false} /> : null}
              </section>
            )
          })}
          {quotes.length ? (
            <section className="ncx-case__quotes" aria-label="In their words">
              {quotes.map((q, i) => (
                <figure className="ncx-case__quote" key={q.id || i}>
                  <blockquote>
                    <p>&ldquo;{q.quote}&rdquo;</p>
                  </blockquote>
                  <figcaption>
                    <b>{q.person}</b>
                    {q.role ? `, ${q.role}` : ''}
                  </figcaption>
                </figure>
              ))}
            </section>
          ) : null}
        </div>
      ) : null}

      <section className="ncx-case__close">
        <h2>See how this would work for your team</h2>
        <Link className="ncx-case__cta" href="/contact">
          Book a 20-minute demo
        </Link>
      </section>
    </article>
  )
}
