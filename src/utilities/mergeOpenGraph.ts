import type { Metadata } from 'next'

import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, defaultShareImage } from './siteDefaults'

// The site-wide Open Graph defaults. A page's own values replace them; the
// default image is left out when the site's address is not set.
const defaultOpenGraph = (): Metadata['openGraph'] => {
  const image = defaultShareImage()
  return {
    type: 'website',
    siteName: SITE_NAME,
    title: DEFAULT_TITLE,
    description: DEFAULT_DESCRIPTION,
    ...(image ? { images: [image] } : {}),
  }
}

export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  const defaults = defaultOpenGraph()
  return {
    ...defaults,
    ...og,
    images: og?.images ? og.images : defaults?.images,
  }
}
