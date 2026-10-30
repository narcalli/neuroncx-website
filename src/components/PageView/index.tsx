import React from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { Breadcrumbs, buildTrail } from '@/components/Breadcrumbs'
import { ClusterFooter } from '@/components/ClusterFooter'
import { LivePreviewListener } from '@/components/LivePreviewListener'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { RenderHero } from '@/heros/RenderHero'
import type { Page } from '@/payload-types'
import { loadClusterPages } from '@/utilities/clusters'
import { isCluster } from '@/utilities/pages'
import { MotionPage } from '@/motion/MotionProvider'

// Blocks that own their top spacing and should sit flush under the header.
// Keep in sync with noMargin in src/blocks/RenderBlocks.tsx.
const flushFirstBlocks = [
  'conversationHero',
  'heroFullBackground',
  'heroRightPlacement',
  'heroCustom',
  'heroHarness',
  'heroWorkforceGrid',
  'statHero',
  'closingCta',
  'agenticHero',
  'integrationsLanding',
]

const pillarIdOf = (page: Page): string | null =>
  page.parent && typeof page.parent === 'object' ? page.parent.id : (page.parent ?? null)

/**
 * A CMS page: breadcrumbs, hero and blocks. Used at /{slug} and, for cluster
 * pages, at /{pillar}/{slug}; `url` is the address it was requested at. A
 * cluster page also gets its cluster footer just before the closing call to
 * action, unless the page turns it off.
 */
export const PageView = async ({ page, url, draft }: { page: Page; url: string; draft: boolean }) => {
  const { hero, layout } = page as any

  const pillarId = isCluster(page) && !page.hideClusterFooter ? pillarIdOf(page) : null
  const footer = pillarId ? <ClusterFooter page={page} siblings={await loadClusterPages(pillarId, draft)} /> : null

  // A page whose hero is disabled and whose first block is flush gets no top padding.
  // A hidden block never renders, so the first block is the first one shown.
  const heroDisabled = !hero || hero.type === 'none'
  const firstBlock = Array.isArray(layout) ? layout.find((b: any) => b && !b.hidden) : undefined
  const firstBlockType = firstBlock ? String(firstBlock.blockType) : ''
  const startsFlush = heroDisabled && flushFirstBlocks.includes(firstBlockType)

  // With no hero, a contact form that opens the page carries its one H1.
  const headedLayout =
    heroDisabled && firstBlockType === 'contactForm' && Array.isArray(layout)
      ? layout.map((b: any) => (b === firstBlock ? { ...b, headingLevel: 'h1' } : b))
      : layout

  // The breadcrumbs go inside whatever renders first: the configured hero,
  // else a flush first block, else a container above the blocks (on the
  // page's light background, so never on dark there).
  const onDark = heroDisabled
    ? startsFlush && (firstBlockType === 'heroFullBackground' || firstBlock?.background === 'navy')
    : hero.type === 'highImpact'
  const crumbs = page.slug === 'home' ? null : <Breadcrumbs items={buildTrail({ page })} onDark={onDark} />

  return (
    <MotionPage page={page.pageMotion}>
      <article className={startsFlush ? 'pb-24' : 'pt-16 pb-24'}>
        {/* Allows redirects for valid pages too */}
        <PayloadRedirects disableNotFound url={url} />

        {draft && <LivePreviewListener />}

        <RenderHero {...hero} leading={crumbs} />
        {heroDisabled && !startsFlush && crumbs ? <div className="ncx-container pt-7">{crumbs}</div> : null}
        <RenderBlocks
          blocks={headedLayout}
          leading={startsFlush ? crumbs : undefined}
          pageId={String(page.id)}
          beforeClosing={footer}
        />
      </article>
    </MotionPage>
  )
}
