import type { Metadata } from 'next'

import { PayloadRedirects } from '@/components/PayloadRedirects'
import { draftMode } from 'next/headers'
import React, { cache } from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { RenderHero } from '@/heros/RenderHero'
import { generateMeta } from '@/utilities/generateMeta'
import { getBySlug, CMS_TAG } from '@/utilities/cms'
import PageClient from './page.client'
import { LivePreviewListener } from '@/components/LivePreviewListener'

export const dynamic = 'force-dynamic'

// Blocks that own their top spacing and should sit flush under the header.
// Keep in sync with noMargin in src/blocks/RenderBlocks.tsx.
const flushFirstBlocks = ['conversationHero', 'statHero', 'closingCta']

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
  const heroDisabled = !hero || hero.type === 'none'
  const firstBlockType = Array.isArray(layout) && layout.length ? String(layout[0]?.blockType) : ''
  const startsFlush = heroDisabled && flushFirstBlocks.includes(firstBlockType)

  return (
    <article className={startsFlush ? 'pb-24' : 'pt-16 pb-24'}>
      <PageClient />
      {/* Allows redirects for valid pages too */}
      <PayloadRedirects disableNotFound url={url} />

      {draft && <LivePreviewListener />}

      <RenderHero {...hero} />
      <RenderBlocks blocks={layout} />
    </article>
  )
}

export async function generateMetadata({ params: paramsPromise }: Args): Promise<Metadata> {
  const { slug = 'home' } = await paramsPromise
  // Decode to support slugs with special characters
  const decodedSlug = decodeURIComponent(slug)
  const page = await queryPageBySlug({ slug: decodedSlug })

  return generateMeta({ doc: page as any })
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
