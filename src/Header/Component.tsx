import { HeaderClient } from './Component.client'
import { getGlobal, CMS_TAG } from '@/utilities/cms'
import React from 'react'

export async function Header() {
  // Fetched from the CMS over HTTP and cached under the `header` tag, so a
  // webhook from the CMS can clear just the nav rather than the whole site.
  const headerData = await getGlobal<any>('header', {
    depth: 2,
    tags: [CMS_TAG, 'header'],
  })

  if (!headerData) return null

  return <HeaderClient data={headerData} />
}
