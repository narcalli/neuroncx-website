import { ImageResponse } from 'next/og'

import { getServerSideURL } from '@/utilities/getURL'
import { DEFAULT_DESCRIPTION, SHARE_CARD, SITE_NAME, shareCardTitle } from '@/utilities/siteDefaults'

/**
 * The share card: the image a link to a page shows on LinkedIn, WhatsApp and
 * similar when the page has no share image of its own (mergeOpenGraph.ts).
 * /og?title=... draws the page's title; with no title, the site's
 * description. The title is cut to SHARE_CARD_TITLE_MAX characters, so the
 * card cannot be stretched by a long address.
 */

const NAVY = '#1a2035'
const CRIMSON = '#c62828'
const ON_NAVY = '#ffffff'
const ON_NAVY_SOFT = '#a3abc6'

// The logo from this site's public folder, as a data URI; null if it cannot be
// read quickly, and the card then shows the name alone.
const logoFor = async (origin: string): Promise<string | null> => {
  try {
    const res = await fetch(`${origin}/ncx-logo.png`, { signal: AbortSignal.timeout(2000) })
    if (!res.ok) return null
    return `data:image/png;base64,${Buffer.from(await res.arrayBuffer()).toString('base64')}`
  } catch {
    return null
  }
}

export async function GET(req: Request): Promise<Response> {
  const url = new URL(req.url)
  const title = shareCardTitle(url.searchParams.get('title'))
  // The public address, not the one the server sees behind the CDN.
  const site = new URL(getServerSideURL() || url.origin)
  const logo = await logoFor(site.origin)
  const text = title || DEFAULT_DESCRIPTION

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: NAVY,
          color: ON_NAVY,
          padding: '72px 80px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
          {/* eslint-disable-next-line @next/next/no-img-element -- drawn by ImageResponse, not a page */}
          {logo ? <img src={logo} width={64} height={64} alt="" style={{ borderRadius: 12 }} /> : null}
          <div style={{ fontSize: 40, letterSpacing: '-0.02em' }}>{SITE_NAME}</div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
          <div style={{ width: 96, height: 8, background: CRIMSON, borderRadius: 4 }} />
          <div
            style={{
              fontSize: title ? (text.length > 60 ? 56 : 68) : 44,
              lineHeight: 1.15,
              letterSpacing: '-0.02em',
              maxWidth: 1000,
              color: title ? ON_NAVY : ON_NAVY_SOFT,
            }}
          >
            {text}
          </div>
        </div>
        <div style={{ display: 'flex', fontSize: 28, color: ON_NAVY_SOFT }}>{site.host}</div>
      </div>
    ),
    {
      width: SHARE_CARD.width,
      height: SHARE_CARD.height,
      // How long it is kept: next.config.ts, with the other cache rules.
    },
  )
}
