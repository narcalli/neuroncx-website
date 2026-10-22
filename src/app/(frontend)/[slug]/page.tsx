import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { Breadcrumbs, buildTrail } from '@/components/Breadcrumbs'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import { getBySlug, CMS_TAG } from '@/utilities/cms'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export const dynamic = 'force-dynamic'

// Blocks that own their top spacing and should sit flush under the header.
// Keep in sync with noMargin in src/blocks/RenderBlocks.tsx.
const flushFirstBlocks = [
  'conversationHero',
  'heroFullBackground',
  'heroRightPlacement',
  'heroWorkforceGrid',
  'statHero',
  'closingCta',
  'agenticHero',
  'integrationsLanding',
]

type Args = {
  params: Promise<{
    slug?: string
  }>
}

export default async function Page({ params: paramsPromise }: Args) {
  const { isEnabled: draft } = await draftMode()
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const url = '/' + decodedSlug

  const page = await queryPageBySlug({ slug: decodedSlug })

  if (!page) {
    return <PayloadRedirects url={url} />
  }

  const { hero, layout } = page as any

  // A page whose hero is disabled and whose first block is flush gets no top padding.
  // A hidden block never renders, so the first block is the first one shown.
  const heroDisabled = !hero || hero.type === 'none'
  const firstBlock = Array.isArray(layout) ? layout.find((b: any) => b && !b.hidden) : undefined
  const firstBlockType = firstBlock ? String(firstBlock.blockType) : ''
  const startsFlush = heroDisabled && flushFirstBlocks.includes(firstBlockType)

  // The breadcrumbs go inside whatever renders first: the configured hero,
  // else a flush first block, else a container above the blocks (on the
  // page's light background, so never on dark there).
  const onDark = heroDisabled
    ? startsFlush && (firstBlockType === 'heroFullBackground' || firstBlock?.background === 'navy')
    : hero.type === 'highImpact'
  const crumbs =
    decodedSlug === 'home' ? null : <Breadcrumbs items={buildTrail({ page })} onDark={onDark} />

  return (
    <article className={startsFlush ? 'pb-24' : 'pt-16 pb-24'}>
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <RenderHero {...hero} leading={crumbs} />
      {heroDisabled && !startsFlush && crumbs ? (
        <div className="ncx-container pt-8">{crumbs}</div>
      ) : null}
      <RenderBlocks blocks={layout} leading={startsFlush ? crumbs : undefined} />
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const page = await queryPageBySlug({ slug: decodedSlug })

  return generateMeta({ doc: page as any, path: decodedSlug === 'home' ? '/' : `/${decodedSlug}` })
}

/**
 * Fetched from the CMS over HTTP. `cache` keeps one request per render, so the
 * page body and generateMetadata share a single call rather than making two.
 */
const queryPageBySlug = cache(async ({ slug }: { slug: string }) => {
  const { isEnabled: draft } = await draftMode()

  return getBySlug<any>('pages', slug, {
    draft,
    depth: 2,
    tags: [CMS_TAG, `page-${slug}`],
  })
})
