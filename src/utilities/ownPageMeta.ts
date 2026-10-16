import type { Metadata } from 'next'

import { pickMedia, type MediaValue } from '@/utilities/media'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { defaultShareImage } from '@/utilities/siteDefaults'

/**
 * Metadata for a collection entry's own page, built the way
 * /integrations/[slug] builds it: the entry's title and description, a
 * canonical address on the real site, Open Graph over the site-wide
 * defaults, and Twitter tags. Used by the bot swarm pages.
 */

const isLocalHost = (host: string) =>
  ['localhost', '127.0.0.1', '0.0.0.0', '[::1]', '::1'].includes(host.toLowerCase())

// The public site address, from the project's site URL setting
// (NEXT_PUBLIC_SERVER_URL). When it is unset, or points at this machine,
// there is no real address, so links that need one are left out rather than
// pointing at localhost.
export const siteOrigin = (): string | null => {
  const raw = process.env.NEXT_PUBLIC_SERVER_URL
  if (!raw) return null
  try {
    const url = new URL(raw)
    return isLocalHost(url.hostname) ? null : url.origin
  } catch {
    return null
  }
}

export const ownPageMeta = (opts: {
  title: string
  description?: string | null
  /** The SEO share image, a media value from the record. */
  image?: MediaValue
  /** The page's path, for example /bot-swarm/payment-services. */
  path: string
  /** Adds noindex, nofollow. */
  noindex?: boolean
}): Metadata => {
  const { title, path } = opts
  const description = opts.description || undefined
  const origin = siteOrigin()
  const canonical = origin ? `${origin}${path}` : undefined
  // The record's own share image (its "og" size when there is one), else the
  // site's default share image. A local address is never used.
  const picked = pickMedia(opts.image, 'og')
  const image =
    picked && !isLocalHost(new URL(picked.src).hostname)
      ? {
          url: picked.src,
          ...(picked.width ? { width: picked.width } : {}),
          ...(picked.height ? { height: picked.height } : {}),
          ...(picked.alt ? { alt: picked.alt } : {}),
        }
      : null

  const shareImage = image?.url || defaultShareImage()?.url

  return {
    title,
    description,
    ...(canonical ? { alternates: { canonical } } : {}),
    openGraph: mergeOpenGraph({
      title,
      description,
      ...(canonical ? { url: canonical } : {}),
      ...(image ? { images: [image] } : {}),
    }),
    twitter: {
      card: shareImage ? 'summary_large_image' : 'summary',
      title,
      description,
      ...(shareImage ? { images: [shareImage] } : {}),
    },
    ...(opts.noindex ? { robots: { index: false, follow: false } } : {}),
  }
}
