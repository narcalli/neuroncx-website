import type { Metadata } from 'next'
import { getServerSideURL } from './getURL'

const siteUrl = getServerSideURL()

// The default share image needs the site's address. Without one it is left
// out rather than pointing at localhost.
const defaultOpenGraph: Metadata['openGraph'] = {
  type: 'website',
  description: 'An open-source blog built with Payload CMS and Next.js.',
  ...(siteUrl ? { images: [{ url: `${siteUrl}/website-template-OG.webp` }] } : {}),
  siteName: 'Blog',
  title: 'Blog',
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  return {
    ...defaultOpenGraph,
    ...og,
    images: og?.images ? og.images : defaultOpenGraph.images,
  }
}
