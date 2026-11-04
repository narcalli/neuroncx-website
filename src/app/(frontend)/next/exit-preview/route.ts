import { cookies, draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

import { VERSION_COOKIE } from '@/utilities/versionCookie'

/**
 * Turns draft mode off, and any old-version preview with it. With
 * ?path=/some/page (a path on this site), goes back to that page, as the
 * draft banner's Exit link does; without it, says so in plain text, as
 * before.
 */
export async function GET(req: Request): Promise<Response> {
  const draft = await draftMode()
  draft.disable()
  ;(await cookies()).delete(VERSION_COOKIE)

  const path = new URL(req.url).searchParams.get('path')
  if (path && path.startsWith('/') && !path.startsWith('//')) redirect(path)
  return new Response('Draft mode is disabled')
}
