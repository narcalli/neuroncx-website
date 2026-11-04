import { getServerSideURL } from './getURL'

/**
 * NeuronCx's site-wide metadata defaults. Pages use their own SEO fields from
 * Payload first; the CMS Site Settings (site name, default title, description
 * and share image) come next; these apply when both are empty.
 */

export const SITE_NAME = 'NeuronCx'

export const DEFAULT_TITLE = 'NeuronCx'

/** Used only by pages with no description of their own or in Site Settings; under the CMS's 155-character limit. */
export const DEFAULT_DESCRIPTION =
  'NeuronCx is a CRM and omnichannel customer experience platform that brings every customer conversation and record into one place.'

/** The logo in this site's public folder (142 x 141 pixels), for search engines when Site Settings has none. */
export const DEFAULT_LOGO_PATH = '/ncx-logo.png'

/** The drawn share card (app/(frontend)/og/route.tsx): 1200 x 630 pixels. */
export const SHARE_CARD = {
  path: '/og',
  width: 1200,
  height: 630,
}

/** The longest title the share card draws; longer ones are cut with an ellipsis. */
export const SHARE_CARD_TITLE_MAX = 110

/**
 * A title as the share card shows it: without the " | NeuronCx" style suffix
 * (the card carries the brand itself), and cut to SHARE_CARD_TITLE_MAX.
 */
export const shareCardTitle = (title?: string | null): string => {
  const plain = (title || '').replace(/\s*\|[^|]*$/, '').replace(/\s+/g, ' ').trim()
  return plain.length > SHARE_CARD_TITLE_MAX ? `${plain.slice(0, SHARE_CARD_TITLE_MAX - 1).trimEnd()}…` : plain
}

/**
 * The share card for a page as a full address on this site, drawn with the
 * page's title, or null when the site's address (NEXT_PUBLIC_SERVER_URL) is
 * not set. Used when a page has no share image of its own.
 */
export const shareCard = (title?: string | null) => {
  const site = getServerSideURL()
  if (!site) return null
  // The site name alone is no title: the card already shows it.
  const text = shareCardTitle(title) === SITE_NAME ? '' : shareCardTitle(title)
  return {
    url: `${site}${SHARE_CARD.path}${text ? `?title=${encodeURIComponent(text)}` : ''}`,
    width: SHARE_CARD.width,
    height: SHARE_CARD.height,
    alt: text || SITE_NAME,
  }
}

/** The site-wide share image: the card with no page title. */
export const defaultShareImage = () => shareCard()

/**
 * A page's title field as a visitor should read it. One that holds a slug
 * (lowercase with hyphens) becomes words in sentence case: knowledge-base reads
 * Knowledge base. Anything else is left as typed.
 */
export const readableTitle = (title: string): string =>
  /^[a-z0-9]+(-[a-z0-9]+)*$/.test(title)
    ? `${title.charAt(0).toUpperCase()}${title.slice(1).replace(/-/g, ' ')}`
    : title

/** A path on this site as a full address, or undefined when the site's address is not set. */
export const siteUrlFor = (path: string): string | undefined => {
  const site = getServerSideURL()
  if (!site) return undefined
  return path === '/' || path === '' ? site : `${site}${path.startsWith('/') ? path : `/${path}`}`
}
