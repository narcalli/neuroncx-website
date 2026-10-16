'use client'
import { getPayloadURL } from '@/utilities/getURL'
import { RefreshRouteOnSave as PayloadLivePreview } from '@payloadcms/live-preview-react'
import { useRouter } from 'next/navigation'
import React from 'react'

// Rendered only in draft mode, which only the admin's preview link turns on.
// serverURL is the Payload admin's address: the CMS runs on its own host.
export const LivePreviewListener: React.FC = () => {
  const router = useRouter()
  return <PayloadLivePreview refresh={router.refresh} serverURL={getPayloadURL()} />
}
