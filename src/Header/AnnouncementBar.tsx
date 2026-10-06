'use client'

import Link from 'next/link'
import React, { useEffect, useState } from 'react'

const KEY = 'ncx-announcement-dismissed'

type Props = {
  text: string
  ctaLabel?: string | null
  ctaHref?: string | null
}

/**
 * Dismissal lasts the browser session. sessionStorage throws in a few real
 * situations — private windows with site data blocked, embedded webviews — so
 * every access is guarded and a throw just means the bar keeps showing.
 */
export const AnnouncementBar: React.FC<Props> = ({ text, ctaLabel, ctaHref }) => {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    try {
      if (window.sessionStorage.getItem(KEY) === '1') setDismissed(true)
    } catch {
      // Storage unavailable. Leave the bar up.
    }
  }, [])

  const dismiss = () => {
    setDismissed(true)
    try {
      window.sessionStorage.setItem(KEY, '1')
    } catch {
      // Not persisted, but it stays closed for this page view.
    }
  }

  if (dismissed) return null

  const external = /^https?:\/\//.test(String(ctaHref || ''))

  return (
    <div className="ncx-topbar">
      <div className="ncx-topbar__in">
        <span>{text}</span>
        {ctaLabel && ctaHref ? (
          external ? (
            <a className="ncx-topbar__cta" href={ctaHref} rel="noopener noreferrer">
              {ctaLabel}
            </a>
          ) : (
            <Link className="ncx-topbar__cta" href={ctaHref}>
              {ctaLabel}
            </Link>
          )
        ) : null}
        <button
          className="ncx-topbar__x"
          type="button"
          onClick={dismiss}
          aria-label="Dismiss announcement"
        >
          &times;
        </button>
      </div>
    </div>
  )
}
