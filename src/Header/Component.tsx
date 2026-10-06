import React from 'react'

import type { Header as HeaderType } from '@/payload-types'

import { HeaderClient } from './Component.client'
import { getGlobal, CMS_TAG } from '@/utilities/cms'
import { pickMedia } from '@/utilities/media'

export async function Header() {
  // Fetched from the CMS over HTTP and cached under the `header` tag, so a
  // webhook from the CMS can clear just the nav rather than the whole site.
  const headerData = await getGlobal<HeaderType>('header', {
    depth: 2,
    tags: [CMS_TAG, 'header'],
  })

  if (!headerData) return null

  // The CMS returns media paths relative to its own origin, and the site runs
  // on a different one, so the URL has to be made absolute here on the server
  // — CMS_URL is not exposed to the browser.
  const logo = pickMedia(headerData.logo)

  return <HeaderClient data={headerData} logoSrc={logo?.src || null} />
}
