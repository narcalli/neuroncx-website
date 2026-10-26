import type { Metadata } from 'next'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { draftMode } from 'next/headers'
import { permanentRedirect } from 'next/navigation'
import React from 'react'

import { PageView } from '@/components/PageView'
import { generateMeta } from '@/utilities/generateMeta'
import { isCluster, pagePathOf, queryPageBySlug } from '@/utilities/pages'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    slug?: string
  }>
}

/**
 * A CMS page at /{slug}. A cluster page lives under its pillar, so asking for
 * it by its bare slug moves permanently to /{pillar}/{slug}
 * (./[cluster]/page.tsx).
 */
export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/' + decodedSlug

  const page = await queryPageBySlug(decodedSlug)

  if (!page) {
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

  return generateMeta({ doc: page, path: pagePathOf(page) ?? (decodedSlug === 'home' ? '/' : `/${decodedSlug}`) })
}
