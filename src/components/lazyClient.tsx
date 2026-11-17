'use client'

/**
 * Heavier client components, each loaded only when a page renders it. Every page is served by the same
 * routes, so a component imported directly shipped its script to every page; through next/dynamic it is
 * still rendered on the server, and its script is fetched only where it is used. Import these from here,
 * not from their own files.
 */

import dynamic from 'next/dynamic'

export const AgenticEpisodeBlock = dynamic(() =>
  import('@/blocks/AgenticEpisode/Component').then((m) => m.AgenticEpisodeBlock),
)
export const AgentFeatures = dynamic(() =>
  import('@/blocks/AgenticFlowDemo/AgentFeatures').then((m) => m.AgentFeatures),
)
export const HarnessStage = dynamic(() =>
  import('@/blocks/HeroHarness/Stage').then((m) => m.HarnessStage),
)
export const HeroStackClient = dynamic(() =>
  import('@/blocks/HeroStack/Client').then((m) => m.HeroStackClient),
)
export const SwarmDiagramClient = dynamic(() =>
  import('@/blocks/SwarmDiagram/Diagram').then((m) => m.SwarmDiagramClient),
)
export const ExpandingCardCtaBlock = dynamic(() =>
  import('@/blocks/ExpandingCardCta/Component').then((m) => m.ExpandingCardCtaBlock),
)
export const ContactFormBlock = dynamic(() =>
  import('@/blocks/ContactForm/Component').then((m) => m.ContactFormBlock),
)
export const HowItWorks2Block = dynamic(() =>
  import('@/blocks/HowItWorks2/Component').then((m) => m.HowItWorks2Block),
)
export const RecordAnatomyBlock = dynamic(() =>
  import('@/blocks/RecordAnatomy/Component').then((m) => m.RecordAnatomyBlock),
)
export const AgenticHeroBlock = dynamic(() =>
  import('@/blocks/AgenticHero/Component').then((m) => m.AgenticHeroBlock),
)
export const AgenticOrbitBlock = dynamic(() =>
  import('@/blocks/AgenticOrbit/Component').then((m) => m.AgenticOrbitBlock),
)
export const JourneyEngineBlock = dynamic(() =>
  import('@/blocks/JourneyEngine/Component').then((m) => m.JourneyEngineBlock),
)
export const AudienceTabsBlock = dynamic(() =>
  import('@/blocks/AudienceTabs/Component').then((m) => m.AudienceTabsBlock),
)
export const FAQBlock = dynamic(() => import('@/blocks/FAQ/Component').then((m) => m.FAQBlock))
export const FlowDemo = dynamic(() =>
  import('@/blocks/AgenticFlowDemo/FlowDemo').then((m) => m.FlowDemo),
)
export const ClosingCtaBlock = dynamic(() =>
  import('@/blocks/ClosingCTA/Component').then((m) => m.ClosingCtaBlock),
)
export const AgenticCartsDemoBlock = dynamic(() =>
  import('@/blocks/AgenticCartsDemo/Component').then((m) => m.AgenticCartsDemoBlock),
)
export const PlatformLayersBlock = dynamic(() =>
  import('@/blocks/PlatformLayers/Component').then((m) => m.PlatformLayersBlock),
)
export const AgenticCasesBlock = dynamic(() =>
  import('@/blocks/AgenticCases/Component').then((m) => m.AgenticCasesBlock),
)
export const AgenticStatsBlock = dynamic(() =>
  import('@/blocks/AgenticStats/Component').then((m) => m.AgenticStatsBlock),
)
export const ScrollStackClient = dynamic(() =>
  import('@/blocks/PlatformLayersTwo/ScrollStackClient').then((m) => m.ScrollStackClient),
)
export const ShadowVisual = dynamic(() =>
  import('@/blocks/HeroCustom/ShadowVisual').then((m) => m.ShadowVisual),
)
export const DirectoryList = dynamic(() =>
  import('@/blocks/CustomerDirectory/DirectoryList').then((m) => m.DirectoryList),
)
export const LegalContents = dynamic(() =>
  import('@/blocks/Content/LegalContents').then((m) => m.LegalContents),
)
export const Code = dynamic(() => import('@/blocks/Code/Component.client').then((m) => m.Code))
export const LivePreviewListener = dynamic(() =>
  import('@/components/LivePreviewListener').then((m) => m.LivePreviewListener),
)
