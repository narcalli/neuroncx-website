import { draftMode } from 'next/headers'
import { redirect } from 'next/navigation'

/**
 * Turns draft mode off. With ?path=/some/page (a path on this site), goes
 * back to that page, as the draft banner's Exit link does; without it, says
 * so in plain text, as before.
 */
export async function GET(req: Request): Promise<Response> {
  const draft = await draftMode()
  draft.disable()

  const path = new URL(req.url).searchParams.get('path')
  if (path && path.startsWith('/') && !path.startsWith('//')) redirect(path)
  return new Response('Draft mode is disabled')
}
