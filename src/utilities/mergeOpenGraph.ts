import type { Metadata } from 'next'

import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, SITE_NAME, shareCard } from './siteDefaults'

type OpenGraph = NonNullable<Metadata['openGraph']>

// The site-wide Open Graph defaults. A page's own values replace them.
const defaultOpenGraph = (): OpenGraph => ({
  type: 'website',
  siteName: SITE_NAME,
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
})

/**
 * A page's Open Graph values over the defaults. With no image of its own the
 * page shares the drawn card with its title (siteDefaults.ts shareCard); the
 * card is left out when the site's address is not set.
 */
export const mergeOpenGraph = (og?: Metadata['openGraph']): Metadata['openGraph'] => {
  const merged = { ...defaultOpenGraph(), ...og }
  const card = shareCard(typeof merged.title === 'string' ? merged.title : null)
  return {
    ...merged,
    images: og?.images ? og.images : card ? [card] : undefined,
  }
}
