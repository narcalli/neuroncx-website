import { getSiteSettings, siteFileUrl } from '@/utilities/siteSettings'

/** Web app manifest, served at /manifest.webmanifest. Filled from Site Settings. */
export async function GET(): Promise<Response> {
  const settings = await getSiteSettings()

  const name = settings.siteName || 'NeuronCx'
  const icons: { src: string; sizes: string; type: string; purpose?: string }[] = []

  const android = siteFileUrl(settings.androidIcon)
  if (android) icons.push({ src: android, sizes: '192x192', type: 'image/png' })

  const large = siteFileUrl(settings.largeIcon)
  if (large) icons.push({ src: large, sizes: '512x512', type: 'image/png' })

  const maskable = siteFileUrl(settings.maskableIcon)
  if (maskable) icons.push({ src: maskable, sizes: '512x512', type: 'image/png', purpose: 'maskable' })

  const manifest = {
    name,
    short_name: settings.manifestShortName || name,
    display: settings.manifestDisplay === 'standalone' ? 'standalone' : 'browser',
    background_color: settings.manifestBackground || '#FFFFFF',
    theme_color: settings.themeColor || '#1A2035',
    icons,
  }

  return new Response(JSON.stringify(manifest), {
    headers: { 'Content-Type': 'application/manifest+json' },
  })
}
