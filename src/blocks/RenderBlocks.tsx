import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { ArticleGridBlock } from '@/blocks/ArticleGrid/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FeatureThreadBlock } from '@/blocks/FeatureThread/Component'
import { ConversationHeroBlock } from '@/blocks/ConversationHero/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { ClosingCtaBlock } from '@/blocks/ClosingCTA/Component'
import { HowItWorksBlock } from '@/blocks/HowItWorks/Component'
import { LogoWallBlock } from '@/blocks/LogoWall/Component'
import { StatHeroBlock } from '@/blocks/StatHero/Component'
import { BenefitsBlock } from '@/blocks/Benefits/Component'
import { IntegrationsBlock } from '@/blocks/Integrations/Component'
import { ProductSuiteBlock } from '@/blocks/ProductSuite/Component'
import { UseCasesBlock } from '@/blocks/UseCases/Component'
import { ContactFormBlock } from '@/blocks/ContactForm/Component'
import { PartnerStripBlock } from '@/blocks/PartnerStrip/Component'
import { ProblemStatementBlock } from '@/blocks/ProblemStatement/Component'
import { PlatformLayersBlock } from '@/blocks/PlatformLayers/Component'
import { JourneyEngineBlock } from '@/blocks/JourneyEngine/Component'
import { ContextEngineBlock } from '@/blocks/ContextEngine/Component'
import { SolutionGridBlock } from '@/blocks/SolutionGrid/Component'
import { TrustPanelBlock } from '@/blocks/TrustPanel/Component'
import { StatBandBlock } from '@/blocks/StatBand/Component'
import { BlockWrapper } from '@/blocks/BlockWrapper'

const blockComponents = {
  archive: ArchiveBlock,
  articleGrid: ArticleGridBlock,
  benefits: BenefitsBlock,
  closingCta: ClosingCtaBlock,
  contactForm: ContactFormBlock,
  content: ContentBlock,
  conversationHero: ConversationHeroBlock,
  cta: CallToActionBlock,
  featureThread: FeatureThreadBlock,
  howItWorks: HowItWorksBlock,
  integrations: IntegrationsBlock,
  logoWall: LogoWallBlock,
  mediaBlock: MediaBlock,
  partnerStrip: PartnerStripBlock,
  productSuite: ProductSuiteBlock,
  statHero: StatHeroBlock,
  useCases: UseCasesBlock,
  problemStatement: ProblemStatementBlock,
  platformLayers: PlatformLayersBlock,
  journeyEngine: JourneyEngineBlock,
  contextEngine: ContextEngineBlock,
  solutionGrid: SolutionGridBlock,
  trustPanel: TrustPanelBlock,
  statBand: StatBandBlock,
}

// Blocks that manage their own vertical spacing and should sit flush.
const noMargin = [
  'conversationHero',
  'statHero',
  'closingCta',
  'useCases',
  'partnerStrip',
  'platformLayers',
  'trustPanel',
  'statBand',
]

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
}> = (props) => {
  const { blocks } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType]

            if (Block) {
              // Appearance options chosen in the admin, applied by the wrapper.
              const b = block as any

              return (
                <BlockWrapper
                  key={index}
                  background={b.background}
                  width={b.width}
                  spacingTop={b.spacingTop}
                  spacingBottom={b.spacingBottom}
                  align={b.align}
                  hidden={b.hidden}
                  flush={noMargin.includes(String(blockType))}
                >
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} disableInnerContainer />
                </BlockWrapper>
              )
            }
          }
          return null
        })}
      </Fragment>
    )
  }

  return null
}
