import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import { notFound } from 'next/navigation'
import React from 'react'

import { LivePreviewListener } from '@/components/LivePreviewListener'
import { IndustrySections } from '@/components/industry/IndustrySections'
import type { Sector } from '@/payload-types'
import { CMS_TAG, getBySlug } from '@/utilities/cms'

export const dynamic = 'force-dynamic'

type Args = { params: Promise<{ slug: string }> }

const load = async (slug: string): Promise<Sector | null> => {
  const { isEnabled: draft } = await draftMode()
  return getBySlug<Sector>('sectors', decodeURIComponent(slug), { draft, depth: 2, tags: [CMS_TAG, `sector-${slug}`] })
}

/**
 * A preview of an industry page (sectors): its heading and its sections
 * (components/industry/IndustrySections.tsx). Industries will live at
 * /{slug} once the Pages at those addresses move; until then this address
 * shows them, kept out of search and of every sitemap. Visitors see only
 * published industries that are Live or Pilot; a draft preview shows any.
 */
export default async function IndustryPreview({ params }: Args) {
  const { isEnabled: draft } = await draftMode()
  const entry = await load((await params).slug)
  if (!entry) notFound()
  return (
    <article className="pt-16 pb-24">
      {draft && <LivePreviewListener />}
      <section className="ncx-container ncx-ipv">
        <style>{`
          .ncx-ipv{padding-block:clamp(48px,6vw,80px) 24px}
          .ncx-ipv .tag{display:inline-block;margin:0 0 14px;padding:4px 10px;border:1px solid var(--ncx-rule);border-radius:999px;
            font-family:var(--font-label),monospace;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--ncx-muted);background:var(--ncx-white)}
          .ncx-ipv h1{font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:clamp(34px,4.6vw,56px);
            letter-spacing:-.03em;line-height:1.08;margin:0;color:var(--ncx-ink)}
          .ncx-ipv .sub{margin:16px 0 0;max-width:64ch;font-size:18px;line-height:1.6;color:var(--ncx-muted)}
        `}</style>
        <p className="tag">Industry preview</p>
        <h1>{entry.heroHeading || entry.name}</h1>
        {entry.heroSubheading || entry.summary ? <p className="sub">{entry.heroSubheading || entry.summary}</p> : null}
      </section>
      <IndustrySections blocks={entry.layout} entry={entry} />
    </article>
  )
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const entry = await load((await params).slug)
  return { title: entry ? `${entry.name} (preview)` : 'Industry preview', robots: { index: false, follow: false } }
}
