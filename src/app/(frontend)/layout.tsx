import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { IBM_Plex_Mono, Instrument_Sans, Inter } from 'next/font/google'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { InitTheme } from '@/providers/Theme/InitTheme'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { draftMode } from 'next/headers'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'
import { getSiteSettings, siteFileUrl } from '@/utilities/siteSettings'

// Self-hosted at build time, so no render-blocking Google Fonts request.
// Exposed as variables only — nothing here changes what the existing blocks
// render, they keep naming their own families.
const displayFont = Instrument_Sans({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-display',
})
const bodyFont = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-body' })
const labelFont = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-label',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { isEnabled } = await draftMode()
  const settings = await getSiteSettings()

  // Each icon falls back to the file shipped in public/ when the CMS field is empty.
  const faviconIco = siteFileUrl(settings.faviconIco) || '/favicon.ico'
  const faviconSvg = siteFileUrl(settings.faviconSvg) || '/favicon.svg'
  const favicon32 = siteFileUrl(settings.favicon32)
  const appleTouchIcon = siteFileUrl(settings.appleTouchIcon)

  return (
    <html
      className={cn(
        GeistSans.variable,
        GeistMono.variable,
        displayFont.variable,
        bodyFont.variable,
        labelFont.variable,
      )}
      lang="en"
      suppressHydrationWarning
    >
      <head>
        <InitTheme />
        <link href={faviconIco} rel="icon" sizes="32x32" />
        <link href={faviconSvg} rel="icon" type="image/svg+xml" />
        {favicon32 ? <link href={favicon32} rel="icon" type="image/png" sizes="32x32" /> : null}
        {appleTouchIcon ? <link href={appleTouchIcon} rel="apple-touch-icon" sizes="180x180" /> : null}
        <link href="/manifest.webmanifest" rel="manifest" />
        {settings.themeColor ? <meta name="theme-color" content={settings.themeColor} /> : null}
      </head>
      <body>
        <Providers>
          {/* <AdminBar
            adminBarProps={{
              preview: isEnabled,
            }}
          /> */}

          <Header />
          {children}
          <Footer />
        </Providers>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    creator: '@payloadcms',
  },
}
