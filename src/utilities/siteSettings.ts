import { CMS_TAG, getGlobal } from '@/utilities/cms'
import { absoluteMediaUrl, type MediaValue } from '@/utilities/media'

import type { SiteSetting as SiteSettingsType } from '@/payload-types'

/**
 * Site-wide settings from the CMS. Cached like the other globals and cleared
 * with the CMS tag. Returns an empty object if the CMS can't be reached, so
 * every caller falls back to its built-in default.
 */
export const getSiteSettings = async (): Promise<SiteSettingsType> => {
  const data = await getGlobal<SiteSettingsType>('siteSettings', {
    depth: 1,
    tags: [CMS_TAG, 'site-settings'],
  })
  return data ?? ({} as SiteSettingsType)
}

/** The absolute URL of an uploaded icon or image, or null when none is set. */
export const siteFileUrl = (file: MediaValue): string | null => {
  if (!file || typeof file !== 'object' || !('url' in file)) return null
  return absoluteMediaUrl(file.url)
}
