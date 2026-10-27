import type { Metadata } from 'next'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { draftMode } from 'next/headers'
import { permanentRedirect } from 'next/navigation'
import React from 'react'

import { buildTrail } from '@/components/Breadcrumbs'
import { entryMetadata, IndustryEntryPage, trailPageOf } from '@/components/industry/IndustryEntryPage'
import { PageView } from '@/components/PageView'
import { generateMeta } from '@/utilities/generateMeta'
import { getIndustryByPath } from '@/utilities/industries'
import { isCluster, pagePathOf, queryPageBySlug } from '@/utilities/pages'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

/**
 * /{slug}: a CMS page first, then an industry (CMS sectors) whose page is
 * here, then a redirect from this address, then not found. A cluster page
 * lives under its pillar, so asking for it by its bare slug moves
 * permanently to /{pillar}/{slug} (./[cluster]/page.tsx).
 */
export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/' + decodedSlug

  const page = await queryPageBySlug(decodedSlug)

  if (!page) {
    const industry = await getIndustryByPath(url, draft)
    if (industry) {
      return (
        <IndustryEntryPage
          collection="sectors"
          entry={industry}
          trail={buildTrail({ page: trailPageOf(industry, 'sectors', draft) })}
          draft={draft}
        />
      )
    }
    return <PayloadRedirects url={url} />
  }

  if (isCluster(page)) {
    const full = pagePathOf(page)
    if (full && full !== url) permanentRedirect(full)
  }

  return <PageView page={page} url={url} draft={draft} />
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const page = await queryPageBySlug(decodedSlug)
  if (!page) {
    const industry = await getIndustryByPath(`/${decodedSlug}`, (await draftMode()).isEnabled)
    if (industry) return entryMetadata(industry)
  }

  return generateMeta({ doc: page, path: pagePathOf(page) ?? (decodedSlug === 'home' ? '/' : `/${decodedSlug}`) })
}
