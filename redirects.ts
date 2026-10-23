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

  return [internetExplorerRedirect, botSwarmPreview]
}
