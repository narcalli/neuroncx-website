import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import React from 'react'

import { PageView } from '@/components/PageView'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { generateMeta } from '@/utilities/generateMeta'
import { queryPageByPath } from '@/utilities/pages'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    /** The pillar page's slug. */
    slug: string
    /** The cluster page's own slug. */
    cluster: string
  }>
}

const pathOf = async (paramsPromise: Args['params']) => {
  const { slug, cluster } = await paramsPromise
  return `/${decodeURIComponent(slug)}/${decodeURIComponent(cluster)}`
}

/**
 * A cluster page at /{pillar}/{slug}: the published page (or, in draft mode,
 * the latest draft) whose stored path is this address. Otherwise a redirect
 * from this address, otherwise not found.
 */
export default async function ClusterPage({ params }: Args) {
  const { isEnabled: draft } = await draftMode()
  const url = await pathOf(params)
  const page = await queryPageByPath(url)

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  return <PageView page={page} url={url} draft={draft} />
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const url = await pathOf(params)
  return generateMeta({ doc: await queryPageByPath(url), path: url })
}
