import type { NextConfig } from 'next'

export const redirects: NextConfig['redirects'] = async () => {
  const internetExplorerRedirect = {
    destination: '/ie-incompatible.html',
    has: [
      {
        type: 'header' as const,
        key: 'user-agent',
        value: '(.*Trident.*)', // all ie browsers
      },
    ],
    permanent: false,
    source: '/:path((?!ie-incompatible.html$).*)', // all pages except the incompatibility page
  }

  // The bot swarm hub was previewed here before it took over /bot-swarm.
  const botSwarmPreview = {
    source: '/bot-swarm-preview',
    destination: '/bot-swarm',
    permanent: true,
  }

  // Old neuroncx.in addresses, each to its page on this site.
  const oldSite: [string, string][] = [
    ['/ai-assisted-chatbot-for-admissions-college-and-higher-education-institution/3', '/higher-education'],
    ['/knowledge-base/ai-augmented-semantic-content-management-system/4', '/knowledge-base'],
    ['/knowledge-base/ncx_articlegenerate-generative-content-augmentation-workflows/7', '/knowledge-base'],
    ['/knowledge-base/ncx_responsequalitymonitor-monitors-content-quality-threshold/8', '/knowledge-base'],
    ['/omnichannel-cx/multi-modal-transactional-ai-chatbots-for-inbound-sales/2', '/omnichannel-cx'],
    ['/user-analytics/ai-first-customer-data-accumulation-and-analytics-platform/9', '/user-intelligence'],
    ['/omnichannel-cx/ncx-appointment-assist-workflow-on-transactional-chatbot/5', '/omnichannel-cx'],
    ['/omnichannel-cx/ncx-applicationassist-helps-students-on-admission-appilcation-journey/6', '/higher-education'],
    ['/omnichannel-cx/virtual-agent-chatbots-on-whatsapp-business-api/23', '/omnichannel-cx'],
    ['/omnichannel-cx/full-duplex-voice-bots-and-agentless-call-handling/24', '/omnichannel-cx'],
    ['/deep-integrate-your-ai-apps-with-crm-booking-inventory-and-reservation-managers/14', '/integrations'],
    ['/neuroncx-integrations/fbcloud-whatsapp-api-integration-with-leadsquared-powered-by-neuroncx/15', '/integrations/ncx-integrations-leadsquared'],
    ['/neuroncx-integrations/fbcloud-whatsapp-doctor-appointment-booking-with-docpulse-integration/16', '/integrations/docpulse'],
    ['/neuroncx-integrations/fb-cloud-whatsapp-integration-college-admission-management-system/17', '/integrations/meritto'],
    // The blog addresses: each has a published post with the same subject.
    ['/omnichannel-cx/can-whatsapp-flow-api-form-compare-with-native-apps-experience/26', '/posts/can-whatsapp-flow-api-form-compare-with-native-apps-experience'],
    ['/enhance-application-completion-rates-whatsapp-api/25', '/posts/enhance-application-completion-rates-whatsapp-api'],
    ['/omnichannel-cx/leverage-whatsapp-flows-recent-upgrades-for-complex-transactional-forms/27', '/posts/leverage-whatsapp-flows-recent-upgrades-for-complex-transactional-form'],
    ['/omnichannel-cx/three-whatsapp-flows-for-d2c-and-retail/29', '/posts/three-whatsapp-flows-for-d2c-and-retail'],
    ['/omnichannel-cx/four-essential-whatsapp-flows-for-healthcare/28', '/posts/four-essential-whatsapp-flows-for-healthcare'],
    // Any other old address. The number at the end keeps these clear of pages
    // here, which are never three levels deep under these two.
    ['/omnichannel-cx/:slug/:id(\\d+)', '/omnichannel-cx'],
    ['/knowledge-base/:slug/:id(\\d+)', '/knowledge-base'],
    ['/neuroncx-integrations/:path*', '/integrations'],
    ['/user-analytics/:path*', '/user-intelligence'],
  ]

  // Switches on by itself when the site's address becomes neuroncx.in, so the
  // Netlify address keeps working until then. Deploy previews have other hosts.
  const site = (process.env.NEXT_PUBLIC_SERVER_URL || '').trim().replace(/\/+$/, '')
  const netlifySubdomain =
    site === 'https://neuroncx.in'
      ? [
          {
            source: '/:path*',
            has: [{ type: 'host' as const, value: 'neuroncx.netlify.app' }],
            destination: 'https://neuroncx.in/:path*',
            permanent: true,
          },
        ]
      : []

  return [
    ...netlifySubdomain,
    internetExplorerRedirect,
    botSwarmPreview,
    ...oldSite.map(([source, destination]) => ({ source, destination, permanent: true })),
  ]
}
