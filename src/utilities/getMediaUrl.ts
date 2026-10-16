import { getPayloadURL } from './getURL'

/**
 * Processes media resource URL to ensure proper formatting
 * @param url The original URL from the resource
 * @param cacheTag Optional cache tag to append to the URL
 * @returns Properly formatted URL with cache tag if provided
 *
 * Media files live on the Payload CMS, not on this site, so a local path
 * (e.g. `/api/media/file/image.webp`) is resolved against the CMS address.
 * When that address is not set, the path is left as it is.
 */
export const getMediaUrl = (url: string | null | undefined, cacheTag?: string | null): string => {
  if (!url) return ''

  let resolvedURL = url

  if (url.startsWith('/')) {
    const baseURL = getPayloadURL()

    if (baseURL) {
      resolvedURL = new URL(url, baseURL).toString()
    }
  }

  if (cacheTag && cacheTag !== '') {
    cacheTag = encodeURIComponent(cacheTag)
  }

  if (!cacheTag) return resolvedURL

  const separator = resolvedURL.includes('?') ? '&' : '?'
  return `${resolvedURL}${separator}${cacheTag}`
}
