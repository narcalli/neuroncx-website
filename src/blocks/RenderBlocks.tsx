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
import { SwarmDiagramBlock } from '@/blocks/SwarmDiagram/Component'
import { AgenticCasesBlock } from '@/blocks/AgenticCases/Component'
import { AgenticClosingBlock } from '@/blocks/AgenticClosing/Component'
import { ArchiveBlock } from '@/blocks/ArchiveBlock/Component'
import { ArticleGridBlock } from '@/blocks/ArticleGrid/Component'
import { CallToActionBlock } from '@/blocks/CallToAction/Component'
import { ContentBlock } from '@/blocks/Content/Component'
import { FeatureThreadBlock } from '@/blocks/FeatureThread/Component'
import { ConversationHeroBlock } from '@/blocks/ConversationHero/Component'
import { HeroStackBlock } from '@/blocks/HeroStack/Component'
import { HeroFullBackgroundBlock } from '@/blocks/HeroFullBackground/Component'
import { HeroRightPlacementBlock } from '@/blocks/HeroRightPlacement/Component'
import { HeroCustomBlock } from '@/blocks/HeroCustom/Component'
import { HeroHarnessBlock } from '@/blocks/HeroHarness/Component'
import { ComparisonTableBlock } from '@/blocks/ComparisonTable/Component'
import { ClusterLinksBlock } from '@/blocks/ClusterLinks/Component'
import { closingSlot } from '@/blocks/closingSlot'
import { AudienceTabsBlock } from '@/blocks/AudienceTabs/Component'
import { RecordAnatomyBlock } from '@/blocks/RecordAnatomy/Component'
import { HeroWorkforceGridBlock } from '@/blocks/HeroWorkforceGrid/Component'
import { MediaBlock } from '@/blocks/MediaBlock/Component'
import { ClosingCtaBlock } from '@/blocks/ClosingCTA/Component'
import { HowItWorksBlock } from '@/blocks/HowItWorks/Component'
import { HowItWorks2Block } from '@/blocks/HowItWorks2/Component'
import { LogoWallBlock } from '@/blocks/LogoWall/Component'
import { StatHeroBlock } from '@/blocks/StatHero/Component'
import { BenefitsBlock } from '@/blocks/Benefits/Component'
import { IntegrationsBlock } from '@/blocks/Integrations/Component'
import { IntegrationsLandingBlock } from '@/blocks/IntegrationsLanding/Component'
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
  swarmDiagram: SwarmDiagramBlock,
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
  heroStack: HeroStackBlock,
  cta: CallToActionBlock,
  detailedProductSuite: DetailedProductSuiteBlock,
  faq: FAQBlock,
  featureThread: FeatureThreadBlock,
  heroFullBackground: HeroFullBackgroundBlock,
  heroRightPlacement: HeroRightPlacementBlock,
  heroCustom: HeroCustomBlock,
  heroHarness: HeroHarnessBlock,
  comparisonTable: ComparisonTableBlock,
  clusterLinks: ClusterLinksBlock,
  audienceTabs: AudienceTabsBlock,
  recordAnatomy: RecordAnatomyBlock,
  heroWorkforceGrid: HeroWorkforceGridBlock,
  howItWorks: HowItWorksBlock,
  howItWorks2: HowItWorks2Block,
  integrations: IntegrationsBlock,
  integrationsLanding: IntegrationsLandingBlock,
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
  'heroStack',
  'agenticHero',
  'heroFullBackground',
  'heroRightPlacement',
  'heroCustom',
  'heroHarness',
  'heroWorkforceGrid',
  'statHero',
  'closingCta',
  'useCases',
  'comparisonTable',
  'clusterLinks',
  'audienceTabs',
  'recordAnatomy',
  'partnerStrip',
  'platformLayers',
  'platformLayersTwo',
  'productInAction',
  'trustPanel',
  'statBand',
  'integrationsLanding',
]

// Blocks that need to know which page they sit on.
const needsPage = new Set(['clusterLinks'])

export const RenderBlocks: React.FC<{
  blocks: Page['layout'][0][]
  /** Given to the first block shown, to place at the top of its own padding (e.g. the page's breadcrumbs). */
  leading?: React.ReactNode
  /** The page the blocks belong to, for blocks that list what sits under it. */
  pageId?: string | null
  /** Drawn just before the closing call to action, or at the end when there is none (closingSlot.ts). */
  beforeClosing?: React.ReactNode
}> = (props) => {
  const { blocks, leading, pageId, beforeClosing } = props

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0

  if (!hasBlocks) return beforeClosing ? <Fragment>{beforeClosing}</Fragment> : null

  // A hidden block never renders, so the first block shown takes leading.
  const firstShown = blocks.findIndex((b) => b && !(b as any).hidden)
  const slot = closingSlot(blocks as any)
  return (
    <Fragment>
      {blocks.map((block, index) => {
        const { blockType } = block

        if (blockType && blockType in blockComponents) {
          // Block props come straight from the CMS, so their types are not checked here.
        const Block = blockComponents[blockType] as React.ComponentType<any>

          if (Block) {
            // Appearance options chosen in the admin, applied by the wrapper.
            const b = block as any
            const lead = index === firstShown ? leading : undefined

            return (
              <Fragment key={index}>
                {index === slot ? beforeClosing : null}
                <BlockWrapper
                  htmlId={b.htmlId}
                  background={b.background}
                  width={b.width}
                  spacingTop={b.spacingTop}
                  spacingBottom={b.spacingBottom}
                  align={b.align}
                  hidden={b.hidden}
                  motion={b.motion}
                  flush={noMargin.includes(String(blockType))}
                >
                  <Block
                    {...block}
                    disableInnerContainer
                    leading={lead}
                    {...(needsPage.has(String(blockType)) ? { pageId } : {})}
                  />
                </BlockWrapper>
              </Fragment>
            )
          }
        }
        return index === slot ? <Fragment key={index}>{beforeClosing}</Fragment> : null
      })}
      {slot === blocks.length ? beforeClosing : null}
    </Fragment>
  )
}
