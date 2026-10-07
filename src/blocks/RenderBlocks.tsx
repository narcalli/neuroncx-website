import React, { Fragment } from 'react'

import type { Page } from '@/payload-types'

import { BentoGrid } from '@/components/blocks/BentoGrid/BentoGrid'
import { IntegrationsMarqueeBlock } from '@/components/blocks/IntegrationsMarquee/IntegrationsMarquee'
import { DetailedProductSuiteBlock } from '@/blocks/DetailedProductSuite/Component'
import { FAQBlock } from '@/blocks/FAQ/Component'
import { AgenticHeroBlock } from '@/blocks/AgenticHero/Component'
import { AgenticFlowDemoBlock } from '@/blocks/AgenticFlowDemo/Component'
import { AgenticStatsBlock } from '@/blocks/AgenticStats/Component'
import { AgenticCartsDemoBlock } from '@/blocks/AgenticCartsDemo/Component'
import { AgenticOrbitBlock } from '@/blocks/AgenticOrbit/Component'
import { AgenticEpisodeBlock } from '@/blocks/AgenticEpisode/Component'
import { AgenticCasesBlock } from '@/blocks/AgenticCases/Component'
import { AgenticClosingBlock } from '@/blocks/AgenticClosing/Component'
import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { ArticleGridBlock } from '@/blocks/ArticleGrid/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FeatureThreadBlock } from '@/blocks/FeatureThread/Component'
import { ConversationHeroBlock } from '@/blocks/ConversationHero/Component'
import { HeroFullBackgroundBlock } from '@/blocks/HeroFullBackground/Component'
import { HeroRightPlacementBlock } from '@/blocks/HeroRightPlacement/Component'
import { HeroWorkforceGridBlock } from '@/blocks/HeroWorkforceGrid/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { ClosingCtaBlock } from '@/blocks/ClosingCTA/Component'
import { HowItWorksBlock } from '@/blocks/HowItWorks/Component'
import { LogoWallBlock } from '@/blocks/LogoWall/Component'
import { StatHeroBlock } from '@/blocks/StatHero/Component'
import { BenefitsBlock } from '@/blocks/Benefits/Component'
import { IntegrationsBlock } from '@/blocks/Integrations/Component'
import { ProductSuiteBlock } from '@/blocks/ProductSuite/Component'
import { ProductSuite2Block } from '@/blocks/ProductSuite2/Component'
import { ProductInActionBlock } from '@/blocks/ProductInAction/Component'
import { TestimonialBlock } from '@/blocks/Testimonial/Component'
import { CaseStudyGridBlock } from '@/blocks/CaseStudyGrid/Component'
import { CustomerDirectoryBlock } from '@/blocks/CustomerDirectory/Component'
import { WhatsappWidgetBlock } from '@/blocks/WhatsappWidget/Component'
import { UseCasesBlock } from '@/blocks/UseCases/Component'
import { ContactFormBlock } from '@/blocks/ContactForm/Component'
import { PartnerStripBlock } from '@/blocks/PartnerStrip/Component'
import { ProblemStatementBlock } from '@/blocks/ProblemStatement/Component'
import { PlatformLayersBlock } from '@/blocks/PlatformLayers/Component'
import { PlatformLayersTwoBlock } from '@/blocks/PlatformLayersTwo/Component'
import { JourneyEngineBlock } from '@/blocks/JourneyEngine/Component'
import { ContextEngineBlock } from '@/blocks/ContextEngine/Component'
import { SolutionGridBlock } from '@/blocks/SolutionGrid/Component'
import { TrustPanelBlock } from '@/blocks/TrustPanel/Component'
import { StatBandBlock } from '@/blocks/StatBand/Component'
import { BlockWrapper } from '@/blocks/BlockWrapper'

const blockComponents = {
  agenticFlowDemo: AgenticFlowDemoBlock,
  agenticStats: AgenticStatsBlock,
  agenticCartsDemo: AgenticCartsDemoBlock,
  agenticOrbit: AgenticOrbitBlock,
  agenticEpisode: AgenticEpisodeBlock,
  agenticCases: AgenticCasesBlock,
  agenticClosing: AgenticClosingBlock,
  agenticHero: AgenticHeroBlock,
  archive: ArchiveBlock,
  articleGrid: ArticleGridBlock,
  benefits: BenefitsBlock,
  bentoGrid: BentoGrid,
  closingCta: ClosingCtaBlock,
  contactForm: ContactFormBlock,
  content: ContentBlock,
  conversationHero: ConversationHeroBlock,
  cta: CallToActionBlock,
  detailedProductSuite: DetailedProductSuiteBlock,
  faq: FAQBlock,
  featureThread: FeatureThreadBlock,
  heroFullBackground: HeroFullBackgroundBlock,
  heroRightPlacement: HeroRightPlacementBlock,
  heroWorkforceGrid: HeroWorkforceGridBlock,
  howItWorks: HowItWorksBlock,
  integrations: IntegrationsBlock,
  integrationsMarquee: IntegrationsMarqueeBlock,
  logoWall: LogoWallBlock,
  mediaBlock: MediaBlock,
  partnerStrip: PartnerStripBlock,
  productSuite: ProductSuiteBlock,
  productSuite2: ProductSuite2Block,
  productInAction: ProductInActionBlock,
  testimonial: TestimonialBlock,
  caseStudyGrid: CaseStudyGridBlock,
  customerDirectory: CustomerDirectoryBlock,
  whatsappWidget: WhatsappWidgetBlock,
  statHero: StatHeroBlock,
  useCases: UseCasesBlock,
  problemStatement: ProblemStatementBlock,
  platformLayers: PlatformLayersBlock,
  platformLayersTwo: PlatformLayersTwoBlock,
  journeyEngine: JourneyEngineBlock,
  contextEngine: ContextEngineBlock,
  solutionGrid: SolutionGridBlock,
  trustPanel: TrustPanelBlock,
  statBand: StatBandBlock,
}

// Blocks that manage their own vertical spacing and should sit flush.
const noMargin = [
  'whatsappWidget',
  'conversationHero',
  'agenticHero',
  'heroFullBackground',
  'heroRightPlacement',
  'heroWorkforceGrid',
  'statHero',
  'closingCta',
  'useCases',
  'partnerStrip',
  'platformLayers',
  'platformLayersTwo',
  'productInAction',
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
                  htmlId={b.htmlId}
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
