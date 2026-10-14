import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { IntegrationsLandingBlock, loadMaster } from '@/blocks/IntegrationsLanding/Component'

/**
 * Preview of the integrations landing page from the main Integrations master
 * record, using the same block a CMS page can add. Kept off the menu and out
 * of search until it replaces /integrations (MIGRATION_PLAN.md in the CMS,
 * Step 7).
 */

export async function generateMetadata(): Promise<Metadata> {
  const m = await loadMaster()
  return {
    title: m?.meta?.title || m?.h1 || 'Integrations',
    description: m?.meta?.description || undefined,
    robots: { index: false, follow: false },
  }
}

export default async function IntegrationsPreviewPage() {
  const m = await loadMaster()
  if (!m) notFound()
  return <IntegrationsLandingBlock record={m} />
}
