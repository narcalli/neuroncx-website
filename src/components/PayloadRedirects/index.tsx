import type React from 'react'

import { getMany, CMS_TAG, notFoundUnlessCmsDown } from '@/utilities/cms'
import { permanentRedirect, redirect } from 'next/navigation'

interface Props {
  disableNotFound?: boolean
  url: string
}

type RedirectDoc = {
  from?: string | null
  to?: {
    url?: string | null
    reference?: {
      relationTo?: string | null
      value?: { slug?: string | null } | string | null
    } | null
  } | null
  type?: ('308' | '307') | null
}

/** Permanent (308) unless the document is set to 307. */
const sendRedirect = (destination: string, type?: ('308' | '307') | null): never =>
  type === '307' ? redirect(destination) : permanentRedirect(destination)

/**
 * Server-side redirects, driven by the Redirects collection in the CMS.
 *
 * Fetched over HTTP with depth 2, so the target document arrives resolved and
 * we can read its slug without a second request — the local API used to do
 * that lookup for us.
 */
export const PayloadRedirects: React.FC<Props> = async ({ disableNotFound, url }) => {
  const redirects = await getMany<RedirectDoc>(
    'redirects',
    { limit: 300, depth: 2 },
    { tags: [CMS_TAG, 'redirects'], revalidate: 300 },
  )

  const match = redirects.find((r) => r.from === url)

  if (match) {
    if (match.to?.url) {
      sendRedirect(match.to.url, match.type)
    }

    const reference = match.to?.reference
    const value = reference?.value

    if (value && typeof value === 'object' && value.slug) {
      const prefix = reference?.relationTo !== 'pages' ? `/${reference?.relationTo}` : ''
      sendRedirect(`${prefix}/${value.slug}`, match.type)
    }
  }

  if (disableNotFound) return null

  notFoundUnlessCmsDown()
}
