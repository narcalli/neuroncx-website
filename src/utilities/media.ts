/**
 * Resolves a Payload media file into something a component can render:
 * an absolute URL, the right size, and whether it needs to skip
 * next/image's optimiser.
 *
 * Shared by every block that needs to pick an image or video out of the
 * media collection. Started in HeroFullBackground; ProductSuite's local
 * copy of this logic is meant to move over to it next.
 */

export const CMS_URL = process.env.CMS_URL || 'http://localhost:3001'

type MediaSize = { url?: string | null; width?: number | null; height?: number | null }

/** The subset of a Payload media doc every helper here cares about. */
export type MediaFile = {
  url?: string | null
  alt?: string | null
  mimeType?: string | null
  width?: number | null
  height?: number | null
  sizes?: Record<string, MediaSize | null | undefined> | null
}

/** A media field's raw value: an id, a populated doc, or nothing. */
export type MediaValue = MediaFile | string | number | null | undefined

const hostOf = (value?: string | null): string => {
  try {
    return new URL(value || '').hostname
  } catch {
    return ''
  }
}

const isLocalHost = (host: string) =>
  host === 'localhost' || host === '127.0.0.1' || host === '::1' || host.endsWith('.local')

/**
 * The sites next.config.ts allows next/image to fetch and resize from.
 * Keep this in step with images.remotePatterns there.
 */
const resizableHosts = (): Set<string> => {
  const hosts = new Set<string>()
  ;[process.env.NEXT_PUBLIC_SERVER_URL, CMS_URL].forEach((u) => {
    const h = hostOf(u)
    if (h) hosts.add(h)
  })
  if (process.env.S3_REGION) hosts.add(`s3.${process.env.S3_REGION}.amazonaws.com`)
  return hosts
}

/** True once a media field holds an actual file, not just an id or nothing. */
export const isPopulatedMedia = (value: MediaValue): value is MediaFile =>
  Boolean(value && typeof value === 'object')

export const isVideoFile = (file: MediaFile): boolean => Boolean(file.mimeType?.startsWith('video/'))

export const isGifFile = (file: MediaFile): boolean => file.mimeType === 'image/gif'

export const isSvgFile = (file: MediaFile): boolean =>
  file.mimeType === 'image/svg+xml' || (file.url || '').split('?')[0].toLowerCase().endsWith('.svg')

/** Turns a possibly-relative CMS address into one the browser can fetch. */
export const absoluteMediaUrl = (url?: string | null): string | null => {
  if (!url) return null
  return url.startsWith('/') ? new URL(url, CMS_URL).toString() : url
}

export type PickedMedia = {
  src: string
  alt: string
  mimeType: string
  width: number | null
  height: number | null
  isVideo: boolean
  isGif: boolean
  /**
   * Skip next/image's optimiser: for SVGs (it can't help them), for GIFs
   * (its optimiser drops animation), and for any host that is not in
   * next.config's remotePatterns (so an unlisted source still shows up
   * instead of breaking the page).
   */
  unoptimized: boolean
}

/**
 * Picks the file (or a named size of it) to show, or null when there is
 * nothing usable — no file, only an id, a deleted file, or a file with no
 * address. Callers fall back to text-only, or to another field, on null.
 */
export const pickMedia = (value: MediaValue, want?: string): PickedMedia | null => {
  if (!isPopulatedMedia(value)) return null

  // A GIF always uses the original file, never a named size: the Media
  // collection keeps GIFs out of its resize/format pipeline on purpose, so
  // the file stays animated. Any named-size entry it does have would be a
  // resized copy, exactly what we don't want to serve here.
  const sized = want && !isGifFile(value) ? value.sizes?.[want] : null
  const raw = sized?.url || value.url
  const src = absoluteMediaUrl(raw)
  if (!src) return null

  const host = hostOf(src)
  if (!host) return null

  const mimeType = value.mimeType || ''
  const isVideo = isVideoFile(value)
  const isGif = isGifFile(value)
  const isSvg = isSvgFile(value)

  const unoptimized = isSvg || isGif || isLocalHost(host) || !resizableHosts().has(host)

  return {
    src,
    alt: value.alt || '',
    mimeType,
    width: (sized?.width ?? value.width) || null,
    height: (sized?.height ?? value.height) || null,
    isVideo,
    isGif,
    unoptimized,
  }
}
