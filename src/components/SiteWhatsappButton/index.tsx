import React from 'react'

import { WhatsappButton } from '@/blocks/WhatsappWidget/Button'
import type { Page } from '@/payload-types'
import { CMS_TAG, getMany } from '@/utilities/cms'
import { pagePathOf } from '@/utilities/pages'
import { getSiteSettings, whatsappButtonOn } from '@/utilities/siteSettings'

/**
 * The one WhatsApp button on the site, from Site Settings. Site Settings holds
 * only the ids of the pages to hide it on, so their addresses are looked up here.
 */
export const SiteWhatsappButton = async () => {
  const settings = await getSiteSettings()
  if (!whatsappButtonOn(settings)) return null
  const { phone, label, message, hideOnPages } = settings.whatsappButton!

  const ids = (hideOnPages ?? []).map((page) => (typeof page === 'object' ? page.id : page))
  const pages = ids.length
    ? await getMany<Page>(
        'pages',
        { 'where[id][in]': ids.join(','), limit: ids.length, depth: 1, 'select[slug]': true, 'select[parent]': true, 'select[breadcrumbs]': true },
        { tags: [CMS_TAG, 'site-settings'] },
      )
    : []
  const hiddenPaths = pages.map(pagePathOf).filter((path): path is string => Boolean(path))

  return <WhatsappButton phone={phone!.trim()} label={label} message={message} hiddenPaths={hiddenPaths} />
}
