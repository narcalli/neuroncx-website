import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'
import { NextRequest } from 'next/server'

export type PreviewSearchParams = {
  path: string
  previewSecret: string
}

/**
 * Enables draft mode so the preview link from the CMS admin shows unpublished
 * content.
 *
 * The coupled version called payload.auth() to confirm a logged-in editor.
 * With the CMS on another origin that session cookie is not available here, so
 * the shared PREVIEW_SECRET is what authorises the request. Treat that secret
 * as a credential: anyone holding it can read drafts.
 */
export async function GET(req: NextRequest): Promise<Response> {
  const { searchParams } = new URL(req.url)

  const path = searchParams.get('path')
  const previewSecret = searchParams.get('previewSecret')

  const expected = process.env.PREVIEW_SECRET

  if (!expected) {
    return new Response('Preview is not configured', { status: 500 })
  }

  if (previewSecret !== expected) {
    return new Response('You are not allowed to preview this page', { status: 403 })
  }

  if (!path) {
    return new Response('Insufficient search params', { status: 404 })
  }

  if (!path.startsWith('/')) {
    return new Response('This endpoint can only be used for relative previews', { status: 500 })
  }

  const draft = await draftMode()
  draft.enable()

  redirect(path)
}
