import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { MotionLab } from './MotionLab'

/**
 * Each motion kit component (src/motion/) with sample content, to check
 * them in isolation, with switches for the site, page and block levels.
 *
 * Development only. The file ends in .dev.tsx, and next.config.ts treats
 * .dev.tsx as a page only while developing, so a production build never
 * includes this route. The notFound() below is a second guard. Never indexed.
 */

export const metadata: Metadata = {
  title: 'Motion lab (development)',
  robots: { index: false, follow: false },
}

export default function MotionLabPage() {
  if (process.env.NODE_ENV !== 'development') notFound()
  return <MotionLab />
}
