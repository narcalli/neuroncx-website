import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { IntegrationsLandingBlock, loadMaster } from '@/blocks/IntegrationsLanding/Component'
import { Breadcrumbs } from '@/components/Breadcrumbs'
import { generateMeta } from '@/utilities/generateMeta'

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
  return (
    <article className={endsFlush ? undefined : 'pb-24'}>
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
