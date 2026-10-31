import { getServerSideURL } from './getURL'

/**
 * NeuronCx's site-wide metadata defaults. Pages use their own SEO fields from
 * Payload first; the CMS Site Settings (site name, default title, description
 * and share image) come next; these apply when both are empty.
 */

export const SITE_NAME = 'NeuronCx'

export const DEFAULT_TITLE = 'NeuronCx'

export const DEFAULT_DESCRIPTION =
  'NeuronCx is a CRM and omnichannel customer experience platform that brings every customer conversation and record into one place, for businesses in any industry.'

/** The default share image, served from this site's public folder: 1200 x 630 pixels. */
export const DEFAULT_OG_IMAGE = {
  path: '/og-default.webp',
  width: 1200,
  height: 630,
  alt: 'NeuronCx',
}

/**
 * The default share image as a full address on this site, or null when the
 * site's address (NEXT_PUBLIC_SERVER_URL) is not set.
 */
export const defaultShareImage = () => {
  const site = getServerSideURL()
  return site
    ? {
        url: `${site}${DEFAULT_OG_IMAGE.path}`,
        width: DEFAULT_OG_IMAGE.width,
        height: DEFAULT_OG_IMAGE.height,
        alt: DEFAULT_OG_IMAGE.alt,
      }
    : null
}

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
