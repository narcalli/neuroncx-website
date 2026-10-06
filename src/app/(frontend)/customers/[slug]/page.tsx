import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import RichText from '@/components/RichText'
import { getMany, CMS_TAG } from '@/utilities/cms'
import { publicCaseStudyQuery, publicCases } from '@/utilities/caseStudies'
import type { CaseStudy, Sector } from '@/payload-types'

type Args = { params: Promise<{ slug: string }> }

const loadCase = async (slug: string): Promise<CaseStudy | null> => {
  const docs = await getMany<CaseStudy>(
    'caseStudies',
    {
      ...publicCaseStudyQuery,
      'where[slug][equals]': slug,
      limit: 1,
      depth: 1,
    },
    { tags: [CMS_TAG, 'case-studies', `case-study-${slug}`] },
  )
  return publicCases(docs)[0] || null
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { slug } = await params
  const c = await loadCase(slug)
  if (!c) return {}
  return {
    title: c.outcomeHeadline || c.title,
    description: c.summary,
  }
}

export default async function CustomerPage({ params }: Args) {
  const { slug } = await params
  const c = await loadCase(slug)
  if (!c) notFound()

  const sectorNames = ((c.sectors || []) as (string | Sector)[])
    .filter((s): s is Sector => typeof s === 'object' && s !== null)
    .map((s) => s.name)
  const metrics = (c.metrics || []).filter((m) => m && m.value && m.label)

  return (
    <article className="ncx-case">
      <style>{`
        .ncx-case{font-family:Inter,Arial,sans-serif;color:#1A1A2E}
        .ncx-case__hero{background:var(--ncx-navy);color:#fff;padding:96px 24px 80px}
        .ncx-case__wrap{max-width:900px;margin:0 auto;display:flex;flex-direction:column;gap:24px}
        .ncx-case__crumb{font-size:13px;color:rgba(255,255,255,.7);text-decoration:none}
        .ncx-case__crumb:hover{color:#fff}
        .ncx-case__sectors{display:flex;flex-wrap:wrap;gap:8px}
        .ncx-case__sector{padding:4px 12px;border-radius:999px;background:var(--ncx-navy-tint);font-size:12px;font-weight:500}
        .ncx-case__client{font-weight:600;font-size:14px;letter-spacing:.04em;text-transform:uppercase;color:#FF8F8F;margin:0}
        .ncx-case__title{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:clamp(2rem,4.5vw,3rem);line-height:1.15;margin:0}
        .ncx-case__summary{font-size:18px;line-height:1.6;color:rgba(255,255,255,.85);margin:0;max-width:60ch}
        .ncx-case__metrics{background:var(--ncx-cloud);padding:48px 24px}
        .ncx-case__metric-row{max-width:900px;margin:0 auto;display:grid;grid-template-columns:repeat(auto-fit,minmax(180px,1fr));gap:32px}
        .ncx-case__metric-value{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:36px;color:var(--ncx-crimson)}
        .ncx-case__metric-label{font-size:14px;color:var(--ncx-muted);margin-top:4px}
        .ncx-case__body{max-width:760px;margin:0 auto;padding:72px 24px}
        .ncx-case__close{background:var(--ncx-cloud);padding:72px 24px;text-align:center}
        .ncx-case__close h2{font-family:Poppins,Arial,sans-serif;font-weight:700;font-size:28px;color:var(--ncx-navy);margin:0 0 24px}
        .ncx-case__cta{display:inline-block;background:var(--ncx-crimson);color:#fff;font-family:Poppins,Arial,sans-serif;font-weight:600;padding:15px 30px;border-radius:8px;text-decoration:none}
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
          <p className="ncx-case__client">{c.clientName}</p>
          <h1 className="ncx-case__title">{c.outcomeHeadline || c.title}</h1>
          <p className="ncx-case__summary">{c.summary}</p>
        </div>
      </header>

      {metrics.length ? (
        <section className="ncx-case__metrics" aria-label="Results">
          <div className="ncx-case__metric-row">
            {metrics.map((m, i) => (
              <div key={m.id || i}>
                <div className="ncx-case__metric-value">{m.value}</div>
                <div className="ncx-case__metric-label">{m.label}</div>
              </div>
            ))}
          </div>
        </section>
      ) : null}

      {c.body ? (
        <div className="ncx-case__body">
          <RichText data={c.body as any} enableGutter={false} />
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
