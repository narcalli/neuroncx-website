import type { Metadata } from 'next'

import type { Media, Page, Post, Config } from '../payload-types'

import { mergeOpenGraph } from './mergeOpenGraph'
import { getServerSideURL } from './getURL'
import { getSiteSettings, siteFileUrl } from './siteSettings'

const getImageURL = (image?: Media | Config['db']['defaultIDType'] | null) => {
  const serverUrl = getServerSideURL()

  let url = serverUrl + '/website-template-OG.webp'

  if (image && typeof image === 'object' && 'url' in image) {
    const ogUrl = image.sizes?.og?.url

    url = ogUrl ? serverUrl + ogUrl : serverUrl + image.url
  }

  return url
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

  const shareImage = siteFileUrl(settings.defaultShareImage)
  const ogImage = doc?.meta?.image ? getImageURL(doc?.meta?.image) : shareImage || getImageURL(null)

  const title = doc?.meta?.title ? doc?.meta?.title + suffix : defaultTitle

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
      url: Array.isArray(doc?.slug) ? doc?.slug.join('/') : '/',
    }),
    title,
  }
}
