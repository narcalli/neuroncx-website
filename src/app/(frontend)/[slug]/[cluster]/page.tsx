import type { Metadata } from 'next'
import { draftMode } from 'next/headers'
import React from 'react'

import { buildTrail } from '@/components/Breadcrumbs'
import { entryMetadata, IndustryEntryPage, industryOf, TopicFooter, trailPageOf } from '@/components/industry/IndustryEntryPage'
import { PageView } from '@/components/PageView'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import type { IndustryTopic } from '@/payload-types'
import { generateMeta } from '@/utilities/generateMeta'
import { getTopicByPath } from '@/utilities/industries'
import { queryPageByPath } from '@/utilities/pages'

export const dynamic = 'force-dynamic'

type Args = {
  params: Promise<{
    /** The pillar page's slug, or the industry's. */
    slug: string
    /** The cluster page's own slug, or the topic's. */
    cluster: string
  }>
}

const partsOf = async (paramsPromise: Args['params']) => {
  const { slug, cluster } = await paramsPromise
  const parent = decodeURIComponent(slug)
  return { parent, url: `/${parent}/${decodeURIComponent(cluster)}` }
}

/** The industry topic whose page is at this address, under the industry with this slug. */
const topicAt = async (url: string, parent: string, draft: boolean): Promise<IndustryTopic | null> => {
  const topic = await getTopicByPath(url, draft)
  return topic && industryOf(topic)?.slug === parent ? topic : null
}

/**
 * /{pillar}/{slug}: the cluster page (published, or in draft mode the latest
 * draft) whose stored path is this address; else the industry topic whose
 * page is here, under the industry with this slug; else a redirect from
 * this address; else not found.
 */
export default async function ClusterPage({ params }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { parent, url } = await partsOf(params)
  const page = await queryPageByPath(url)
  if (page) return <PageView page={page} url={url} draft={draft} />

  const topic = await topicAt(url, parent, draft)
  if (topic) {
    return (
      <IndustryEntryPage
        collection="industryTopics"
        entry={topic}
        trail={buildTrail({ page: trailPageOf(topic, 'industryTopics', draft) })}
        draft={draft}
        footer={<TopicFooter topic={topic} draft={draft} />}
      />
    )
  }

  return <PayloadRedirects url={url} />
}

export async function generateMetadata({ params }: Args): Promise<Metadata> {
  const { parent, url } = await partsOf(params)
  const page = await queryPageByPath(url)
  if (!page) {
    const topic = await topicAt(url, parent, (await draftMode()).isEnabled)
    if (topic) return entryMetadata(topic)
  }
  return generateMeta({ doc: page, path: url })
}
