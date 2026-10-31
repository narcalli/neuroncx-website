import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { absoluteMediaUrl } from './media'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE, readableTitle, SITE_NAME, siteUrlFor } from './siteDefaults'
import { getSiteSettings, siteFileUrl } from './siteSettings'

// Share tags take full addresses only: Next would resolve a relative one
// against localhost when the site's address is not set.
const absoluteOnly = (url?: string | null): string | null =>
  url && /^https?:\/\//.test(url) ? url : null

// A media image's address on the CMS (its "og" size when there is one).
const mediaImageURL = (image?: Media | Config['db']['defaultIDType'] | null): string | null =>
  image && typeof image === 'object' && 'url' in image
    ? absoluteOnly(absoluteMediaUrl(image.sizes?.og?.url || image.url))
    : null

/**
 * Metadata for a CMS page or post. Each value comes from the page's own SEO
 * fields first (the title falls back to the page's title), then the CMS
 * Site Settings, then the site defaults
 * (siteDefaults.ts). `path` is the page's address on this site, for the
 * canonical URL and og:url.
 */
export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
  path?: string
}): Promise<Metadata> => {
  const { doc, path } = args
  const settings = await getSiteSettings()

  const siteName = settings.siteName || SITE_NAME
  const suffix = settings.titleSuffix ?? ''
  // With no SEO title, the page's own title and the site name (SEO titles
  // carry the brand themselves), so pages do not all share the site's; the
  // home page keeps the site title.
  const pageTitle = !doc?.meta?.title && doc?.slug && doc.slug !== 'home' && doc.title ? readableTitle(doc.title) : null
  const title = doc?.meta?.title
    ? doc.meta.title + suffix
    : pageTitle
      ? pageTitle + (suffix || ` | ${siteName}`)
      : settings.defaultTitle || DEFAULT_TITLE
  const description = doc?.meta?.description || settings.defaultDescription || DEFAULT_DESCRIPTION

  // The page's own share image, else the Site Settings one; with neither,
  // mergeOpenGraph supplies the site's default image.
  const image =
    mediaImageURL(doc?.meta?.image) || absoluteOnly(siteFileUrl(settings.defaultShareImage))
  const url = path ? siteUrlFor(path) : undefined

  return {
    title,
    description,
    // The page's own full address, such as /higher-education/fees for a
    // cluster page. Left out when the site's address is not set.
    ...(url ? { alternates: { canonical: url } } : {}),
    openGraph: mergeOpenGraph({
      siteName,
      title,
      description,
      ...(image ? { images: [{ url: image }] } : {}),
      ...(url ? { url } : {}),
    }),
  }
}
