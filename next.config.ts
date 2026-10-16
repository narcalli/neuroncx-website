import { withPayload } from '@payloadcms/next/withPayload'
import type { NextConfig } from 'next'
import path from 'path'
import { fileURLToPath } from 'url'

import { redirects } from './redirects'

const __filename = fileURLToPath(import.meta.url)
const dirname = path.dirname(__filename)

// The site's own address and the Payload CMS address (see src/utilities/getURL.ts).
// localhost only while developing; a production build without them warns
// instead of quietly pointing pages at localhost.
const isDev = process.env.NODE_ENV === 'development'
const SITE_URL = process.env.NEXT_PUBLIC_SERVER_URL || (isDev ? 'http://localhost:3000' : '')
const PAYLOAD_URLS = [process.env.NEXT_PUBLIC_PAYLOAD_URL, process.env.CMS_URL].filter(
  (u): u is string => Boolean(u),
)
if (isDev && !PAYLOAD_URLS.length) PAYLOAD_URLS.push('http://localhost:3001')

if (process.env.NODE_ENV === 'production') {
  if (!process.env.NEXT_PUBLIC_SERVER_URL) {
    console.warn(
      '\n[site URL] NEXT_PUBLIC_SERVER_URL is not set. Share links, canonical links and the sitemap will have no site address. Set it to the public site address, for example https://neuroncx.netlify.app.\n',
    )
  }
  if (!process.env.NEXT_PUBLIC_PAYLOAD_URL) {
    console.warn(
      `\n[site URL] NEXT_PUBLIC_PAYLOAD_URL is not set. Images and live preview in the browser cannot reach the CMS${process.env.CMS_URL ? ' (CMS_URL covers server code only)' : ''}. Set it to the Payload CMS address, for example https://main.duebzy83yxxuo.amplifyapp.com.\n`,
    )
  }
}

const patternFor = (value: string) => {
  const url = new URL(value)
  return { hostname: url.hostname, protocol: url.protocol.replace(':', '') as 'http' | 'https' }
}

const nextConfig: NextConfig = {
  sassOptions: {
    loadPaths: ['./node_modules/@payloadcms/ui/dist/scss/'],
  },
  images: {
    localPatterns: [
      {
        pathname: '/api/media/file/**',
      },
    ],
    qualities: [100],
    remotePatterns: [
      ...(SITE_URL ? [patternFor(SITE_URL)] : []),
      // Pictures served by the CMS, for example /api/media/file/... on its own site.
      ...PAYLOAD_URLS.map(patternFor),
      // Direct S3 path-style URLs — bypasses Lambda so Next.js image optimizer
      // fetches source images from S3 directly, avoiding the 6 MB Lambda limit.
      ...(process.env.S3_REGION
        ? [
            {
              hostname: `s3.${process.env.S3_REGION}.amazonaws.com`,
              protocol: 'https' as const,
            },
          ]
        : []),
    ],
  },
  webpack: (webpackConfig) => {
    webpackConfig.resolve.extensionAlias = {
      '.cjs': ['.cts', '.cjs'],
      '.js': ['.ts', '.tsx', '.js', '.jsx'],
      '.mjs': ['.mts', '.mjs'],
    }

    return webpackConfig
  },
  reactStrictMode: true,
  redirects,
  // CloudFront in front of Amplify caches rendered HTML. The revalidatePage hook
  // calls revalidatePath, which only clears the Lambda instance that handled the
  // request — the CDN keeps serving the old page until a redeploy. These headers
  // cap how long that can happen: the CDN holds a page for 60s, then serves the
  // stale copy while fetching a fresh one for up to 5 minutes. Published edits
  // appear within about a minute without a deployment.
  // Excludes /admin and /api, which must never be cached.
  async headers() {
    return [
      {
        source: '/((?!admin|api|_next/static|_next/image).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=0, s-maxage=60, stale-while-revalidate=300',
          },
        ],
      },
      {
        source: '/admin/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
      {
        source: '/api/:path*',
        headers: [{ key: 'Cache-Control', value: 'no-store, must-revalidate' }],
      },
    ]
  },
  turbopack: {
    root: path.resolve(dirname),
  },
}

export default withPayload(nextConfig, { devBundleServerPackages: false })
