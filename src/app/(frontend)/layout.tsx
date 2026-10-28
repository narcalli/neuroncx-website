import type { Metadata } from 'next'

import { cn } from '@/utilities/ui'
import { GeistMono } from 'geist/font/mono'
import { GeistSans } from 'geist/font/sans'
import { IBM_Plex_Mono, Inter, Poppins } from 'next/font/google'
import React from 'react'

import { AdminBar } from '@/components/AdminBar'
import { DraftBanner } from '@/components/DraftBanner'
import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { DEFAULT_DESCRIPTION, DEFAULT_TITLE } from '@/utilities/siteDefaults'
import { draftMode } from 'next/headers'

import './globals.css'
import { MotionProvider } from '@/motion/MotionProvider'
import { ReadingProgress } from '@/motion/ReadingProgress'
import { getServerSideURL } from '@/utilities/getURL'
import { getSiteSettings, siteFileUrl } from '@/utilities/siteSettings'

// The site's three faces, self-hosted at build time. Every block reads these
// variables instead of importing from Google itself, so swapping a face is a
// change here and nowhere else. Weights are the union of what the blocks were
// requesting before they were centralised.
const displayFont = Poppins({
  subsets: ['latin'],
  weight: ['500', '600', '700'],
  display: 'swap',
  variable: '--font-display',
})
const bodyFont = Inter({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  display: 'swap',
  variable: '--font-body',
})
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
  // Site Settings, Animations: on until set. In the server HTML, so CSS holds before any script runs.
  const animations = settings.animations || 'on'

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
      data-motion={animations}
      suppressHydrationWarning
    >
      <head>
        <link href={faviconIco} rel="icon" sizes="32x32" />
        <link href={faviconSvg} rel="icon" type="image/svg+xml" />
        {favicon32 ? <link href={favicon32} rel="icon" type="image/png" sizes="32x32" /> : null}
        {appleTouchIcon ? <link href={appleTouchIcon} rel="apple-touch-icon" sizes="180x180" /> : null}
        <link href="/manifest.webmanifest" rel="manifest" />
        {settings.themeColor ? <meta name="theme-color" content={settings.themeColor} /> : null}
      </head>
      <body>
        {/* <AdminBar
          adminBarProps={{
            preview: isEnabled,
          }}
        /> */}

        <MotionProvider site={animations}>
          <ReadingProgress />
          <Header />
          {children}
          <Footer />
        </MotionProvider>
        {/* Every page, while draft mode is on: a preview is never mistaken for the live site. */}
        {isEnabled ? <DraftBanner /> : null}
      </body>
    </html>
  )
}

// metadataBase only when the site's address is known: without it there are
// no relative share URLs left to resolve (see mergeOpenGraph, generateMeta).
const siteUrl = getServerSideURL()

// The site-wide defaults (siteDefaults.ts). Each page's own metadata replaces them.
export const metadata: Metadata = {
  ...(siteUrl ? { metadataBase: new URL(siteUrl) } : {}),
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
    // TODO: add `creator` (and `site`) once NeuronCx has an X/Twitter handle.
  },
}
