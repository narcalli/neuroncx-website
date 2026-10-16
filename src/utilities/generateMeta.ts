import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'
import { absoluteMediaUrl } from './media'
import { getSiteSettings, siteFileUrl } from './siteSettings'

// Share tags take full addresses only: Next would resolve a relative one
// against localhost when the site's address is not set.
const absoluteOnly = (url?: string | null): string | null =>
  url && /^https?:\/\//.test(url) ? url : null

// A media image's address on the CMS (its "og" size when there is one), else
// the site's default share image. Null when there is no real address to use.
const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null): string | null => {
  if (image && typeof image === 'object' && 'url' in image) {
    return absoluteOnly(absoluteMediaUrl(image.sizes?.og?.url || image.url))
  }
  const serverUrl = getServerSideURL()
  return serverUrl ? `${serverUrl}/website-template-OG.webp` : null
}

export const generateMeta = async (args: {
  doc: Partial<Page> | Partial<Post> | null
}): Promise<Metadata> => {
  const { doc } = args
  const settings = await getSiteSettings()

  // Site Settings supply the defaults. Until they are filled in, the old values apply.
  const suffix = settings.titleSuffix ?? ' | Blog'
  const defaultTitle = settings.defaultTitle || 'Blog'
  const description = doc?.meta?.description || settings.defaultDescription || undefined

  const shareImage = absoluteOnly(siteFileUrl(settings.defaultShareImage))
  const ogImage = doc?.meta?.image ? getImageURL(doc?.meta?.image) : shareImage || getImageURL(null)

  const title = doc?.meta?.title ? doc?.meta?.title + suffix : defaultTitle
  const siteUrl = getServerSideURL()

  return {
    description,
    openGraph: mergeOpenGraph({
      description: doc?.meta?.description || '',
      images: ogImage
        ? [
            {
              url: ogImage,
            },
          ]
        : undefined,
      title,
      // Absolute when the site's address is known; left out otherwise, so it
      // never resolves against localhost.
      ...(siteUrl
        ? { url: Array.isArray(doc?.slug) ? `${siteUrl}/${doc?.slug.join('/')}` : `${siteUrl}/` }
        : {}),
    }),
    title,
  }
}
