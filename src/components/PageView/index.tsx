import React from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import { Breadcrumbs, buildTrail } from '@/components/Breadcrumbs'
import { ClusterFooter } from '@/components/ClusterFooter'
import { LivePreviewListener } from '@/components/lazyClient'
import { PayloadRedirects } from '@/components/PayloadRedirects'
import { RenderHero } from '@/heros/RenderHero'
import type { Page } from '@/payload-types'
import { loadClusterPages } from '@/utilities/clusters'
import { isCluster } from '@/utilities/pages'
import { MotionPage } from '@/motion/MotionProvider'

// Hero blocks that render an H1 when first on a page with no page hero, and an H2 otherwise.
const heroBlocks = [
  'agenticHero',
  'conversationHero',
  'heroCustom',
  'heroFullBackground',
  'heroHarness',
  'heroRightPlacement',
  'heroStack',
  'heroWorkforceGrid',
  'statHero',
  'integrationsLanding',
]

// Blocks that own their top spacing and should sit flush under the header.
// Keep in sync with noMargin in src/blocks/RenderBlocks.tsx.
const flushFirstBlocks = [...heroBlocks, 'closingCta', 'expandingCardCta']

const pillarIdOf = (page: Page): string | null =>
  page.parent && typeof page.parent === 'object' ? page.parent.id : (page.parent ?? null)

type RichTextNode = { text?: unknown; children?: RichTextNode[] }
type LayoutBlock = Page['layout'][number] & {
  hidden?: boolean | null
  background?: string | null
  documentStyle?: string | null
  headingLevel?: 'h1' | 'h2'
  pageTitle?: string | null
}

const hasHeroText = (rt: Page['hero']['richText']): boolean => {
  const children = rt?.root?.children
  if (!Array.isArray(children)) return false
  const walk = (nodes: RichTextNode[]): boolean =>
    nodes.some(
      (n) =>
        (typeof n?.text === 'string' && n.text.trim() !== '') ||
        (Array.isArray(n?.children) && walk(n.children)),
    )
  return walk(children as RichTextNode[])
}

/**
 * A CMS page: breadcrumbs, hero and blocks. Used at /{slug} and, for cluster
 * pages, at /{pillar}/{slug}; `url` is the address it was requested at. A
 * cluster page also gets its cluster footer just before the closing call to
 * action, unless the page turns it off.
 */
export const PageView = async ({ page, url, draft }: { page: Page; url: string; draft: boolean }) => {
  const { hero } = page
  const layout = (page.layout ?? []) as LayoutBlock[]

  const pillarId = isCluster(page) && !page.hideClusterFooter ? pillarIdOf(page) : null
  const footer = pillarId ? <ClusterFooter page={page} siblings={await loadClusterPages(pillarId, draft)} /> : null

  // Two separate questions, which used to be answered by one flag.
  //
  // Does the hero draw anything? No hero, None, or Low Impact left empty:
  // that last one renders a container, a pull for the breadcrumbs and an
  // empty box, which is nothing to look at. This decides who carries the
  // page's H1 and whether the hero renders at all.
  //
  // Should the first block sit flush under the header? Only if the hero
  // draws nothing AND that block owns its top spacing.
  //
  // Tying the first to the second is what left pages opening on a block
  // that is not flush, such as a comparison table, believing they still
  // had a hero: nothing was drawn, no H1 was handed out, and the page went
  // out without one.
  //
  // A hidden block never renders, so the first block is the first one shown.
  const firstBlock = Array.isArray(layout) ? layout.find((b) => b && !b.hidden) : undefined
  const firstBlockType = firstBlock ? String(firstBlock.blockType) : ''
  const heroDisabled = !hero || hero.type === 'none' || (hero.type === 'lowImpact' && !hasHeroText(hero.richText))
  const startsFlush = heroDisabled && flushFirstBlocks.includes(firstBlockType)
  // A full-bleed navy closing panel meets the navy footer with no page padding between them.
  // A hidden block never renders, so the last block is the last one shown.
  const lastBlock = Array.isArray(layout) ? [...layout].reverse().find((b) => b && !b.hidden) : undefined
  const endsFlush = String(lastBlock?.blockType ?? '') === 'expandingCardCta'

  // With no hero, a hero block, a contact form or a comparison table that
  // opens the page carries its one H1, and so does a legal document, as the
  // page title. Any other hero block renders an H2.
  const headedLayout: Page['layout'] = Array.isArray(layout)
    ? layout.map((b): LayoutBlock => {
        if (!b) return b
        const type = String(b.blockType)
        if (heroBlocks.includes(type)) {
          return { ...b, headingLevel: heroDisabled && b === firstBlock ? 'h1' : 'h2' }
        }
        if (!heroDisabled || b !== firstBlock) return b
        if (type === 'contactForm' || type === 'comparisonTable') return { ...b, headingLevel: 'h1' }
        if (type === 'content' && b.documentStyle === 'legal') return { ...b, pageTitle: page.title }
        return b
      })
    : []

  // The breadcrumbs go inside whatever renders first: the configured hero,
  // else a flush first block, else a container above the blocks (on the
  // page's light background, so never on dark there).
  const onDark = heroDisabled
    ? startsFlush && (firstBlockType === 'heroFullBackground' || firstBlock?.background === 'navy')
    : hero.type === 'highImpact'
  const crumbs = page.slug === 'home' ? null : <Breadcrumbs items={buildTrail({ page })} onDark={onDark} />

  return (
    <MotionPage page={page.pageMotion}>
      <article className={[startsFlush ? '' : 'pt-16', endsFlush ? '' : 'pb-24'].filter(Boolean).join(' ') || undefined}>
        {/* Allows redirects for valid pages too */}
        <PayloadRedirects disableNotFound url={url} />

        {draft && <LivePreviewListener />}

        {heroDisabled ? null : <RenderHero {...hero} leading={crumbs} />}
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
