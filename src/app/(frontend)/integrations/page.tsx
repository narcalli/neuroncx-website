import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { IntegrationsLandingBlock, loadMaster } from '@/blocks/IntegrationsLanding/Component'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import type { Integration } from '@/payload-types'
import { CMS_TAG, getMany } from '@/utilities/cms'
import { generateMeta } from '@/utilities/generateMeta'
import { getServerSideURL } from '@/utilities/getURL'
import { integrationHref } from '@/utilities/integrations'
import { collectionPage, jsonLdHtml } from '@/utilities/jsonLd'

/**
 * /integrations, from the main Integrations master record (Is main on): its
 * Page layout, or the standard landing page while the layout is empty
 * (blocks/IntegrationsLanding). Answers before the CMS pages "integrations"
 * and "integration", which this replaced (MIGRATION_PLAN.md in the CMS,
 * Step 7); /integration redirects here (redirects.ts).
 */
export const dynamic = 'force-dynamic'

const crumbs = <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Integrations' }]} />

export default async function IntegrationsPage() {
  const m = await loadMaster()
  if (!m) notFound()
  // As on a CMS page (PageView): a full-bleed navy Expanding Card CTA as the last row shown meets the
  // navy footer with no page padding between them.
  const shown = (m.layout || []).filter((b) => b && !('hidden' in b && b.hidden))
  const endsFlush = shown.at(-1)?.blockType === 'expandingCardCta'
  // For search engines: this page as a CollectionPage listing every integration with a page of its own
  // (the integrations the content sitemap lists), each of which describes itself as software.
  const integrations = await getMany<Integration>(
    'integrations',
    {
      'where[status][equals]': 'live',
      'where[_status][equals]': 'published',
      'where[hasOwnPage][equals]': true,
      sort: 'name',
      limit: 1000,
      depth: 0,
    },
    { tags: [CMS_TAG, 'integrations'] },
  )
  const listing = collectionPage({
    siteUrl: getServerSideURL(),
    path: '/integrations',
    name: m.meta?.title || m.h1,
    description: m.meta?.description,
    items: integrations.map((d) => ({ name: d.name, href: integrationHref(d) })),
  })
  return (
    <article className={endsFlush ? undefined : 'pb-24'}>
      {listing ? <script type="application/ld+json" dangerouslySetInnerHTML={jsonLdHtml(listing)} /> : null}
      <IntegrationsLandingBlock record={m} leading={crumbs} />
    </article>
  )
}

export async function generateMetadata(): Promise<Metadata> {
  const m = await loadMaster()
  return generateMeta({
    doc: m ? { title: m.h1, slug: 'integrations', meta: m.meta } : null,
    path: '/integrations',
  })
}
