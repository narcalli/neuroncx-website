import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { RenderBlocks } from '@/blocks/RenderBlocks'
import type { MotionSetting } from '@/motion/levels'
import { MotionPage, MotionProvider } from '@/motion/MotionProvider'
import type { Page } from '@/payload-types'

/**
 * The Expanding Card CTA with sample content, drawn through RenderBlocks as
 * on a page, between two light bands, to check it in isolation.
 *
 * Query: shape=square|portrait|wide, block=, page= and site= (follow, on,
 * reduced or off) for the three motion levels, both=1 to add a closing CTA
 * block above it, and one=1 for a one line heading.
 *
 * Development only, like the motion lab: the file ends in .dev.tsx, which
 * next.config.ts treats as a page only while developing, and notFound() is a
 * second guard. Never indexed.
 */

export const metadata: Metadata = {
  title: 'Expanding Card CTA lab (development)',
  robots: { index: false, follow: false },
}

type Search = Promise<Record<string, string | string[] | undefined>>

const one = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v)
const setting = (v: string | string[] | undefined): MotionSetting | undefined => {
  const s = one(v)
  return s === 'on' || s === 'reduced' || s === 'off' || s === 'follow' ? s : undefined
}

export default async function ExpandingCtaLabPage({ searchParams }: { searchParams: Search }) {
  if (process.env.NODE_ENV !== 'development') notFound()
  const q = await searchParams
  const shape = one(q.shape)
  const startShape = shape === 'portrait' || shape === 'wide' ? shape : 'square'
  const site = setting(q.site)
  const page = setting(q.page)

  const blocks = [
    ...(one(q.both) === '1'
      ? [
          {
            blockType: 'closingCta',
            heading: 'A closing call to action above it',
            subhead: 'The existing closing block, to check the two do not style each other.',
            primaryLabel: 'Talk to us',
            primaryLink: '/contact',
          },
        ]
      : []),
    {
      blockType: 'expandingCardCta',
      headingLine1: 'Run every conversation',
      headingLine2: one(q.one) === '1' ? null : 'from one place.',
      description:
        'See how NeuronCx brings acquisition, engagement and retention onto one record, with agents that act on your own rules and hand over to your team when a person is needed.',
      ctaLabel: 'Book a demo',
      ctaUrl: '/contact',
      startShape,
      motion: setting(q.block) ?? 'follow',
      htmlId: 'closing',
    },
  ] as unknown as Page['layout'][0][]

  const body = (
    <article>
      <section className="ncx-container" style={{ paddingBlock: 96, minHeight: '110vh' }}>
        <h1 style={{ fontSize: 40, fontWeight: 600, margin: '0 0 16px' }}>Expanding Card CTA lab</h1>
        <p style={{ maxWidth: '60ch', color: 'var(--ncx-muted)' }}>
          A light band above the block. Scroll down to the panel. Query: shape, block, page, site, both, one.
        </p>
      </section>
      <RenderBlocks blocks={blocks} />
      <section style={{ background: 'var(--ncx-white)', padding: '64px 0' }}>
        <div className="ncx-container">
          <p style={{ margin: 0, color: 'var(--ncx-muted)' }}>A light band below the block.</p>
        </div>
      </section>
    </article>
  )

  // The site level as the root layout gives it: in context, and on the HTML so CSS holds still before scripts run.
  return site ? (
    <MotionProvider site={site}>
      <div data-motion={site === 'off' || site === 'reduced' ? site : undefined} style={{ display: 'contents' }}>
        <MotionPage page={page}>{body}</MotionPage>
      </div>
    </MotionProvider>
  ) : (
    <MotionPage page={page}>{body}</MotionPage>
  )
}
