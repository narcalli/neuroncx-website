import React from 'react'

import { BlockWrapper } from '@/blocks/BlockWrapper'
import type { IndustryTopic, Sector } from '@/payload-types'

import { industrySectionContent, industrySectionKey } from './IndustrySections'
import { topicSectionContent, topicSectionKey } from './TopicSections'

type Block = { blockType?: string | null; id?: string | null } & Record<string, unknown>

/** The key of an industry or industry topic section, or null for any other block. */
export const ownSectionKey = (blockType: unknown): string | null => topicSectionKey(blockType) ?? industrySectionKey(blockType)

/**
 * One industry or industry topic section on an entry page (RenderSections):
 * its content in a band with the row's background and anchor ID, the only
 * Appearance options these sections offer. Nothing at all when the section
 * has nothing to show, so no empty band is left. The shared section's block
 * brings its own appearance, so it is not wrapped again.
 */
export const EntrySectionBand = async ({
  block,
  entry,
  index,
  draft,
}: {
  block: Block
  entry: Sector | IndustryTopic
  index: number
  draft: boolean
}) => {
  const topicKey = topicSectionKey(block.blockType)
  const industryKey = topicKey ? null : industrySectionKey(block.blockType)
  const content = topicKey
    ? topicSectionContent(topicKey, block, entry as IndustryTopic, draft, index)
    : industryKey
      ? await industrySectionContent(industryKey, block, entry as Sector)
      : null
  if (!content) return null
  if (industryKey === 'shared') return <>{content}</>
  return (
    <BlockWrapper flush htmlId={block.htmlId as string | null} background={block.background as string | null}>
      {content}
    </BlockWrapper>
  )
}
