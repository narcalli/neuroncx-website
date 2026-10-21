'use client'

import Link from 'next/link'
import React, { useState, useSyncExternalStore } from 'react'

const KEY = 'ncx-announcement-dismissed'

// Only this bar writes the key, and it also keeps its own state when it
// does, so there is no change to listen for.
const subscribe = () => () => {}

const readDismissed = (): boolean => {
  try {
    return window.sessionStorage.getItem(KEY) === '1'
  } catch {
    // Storage unavailable. Leave the bar up.
    return false
  }
}

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
  // The server, and the first render in the browser, show the bar; a
  // dismissal stored earlier this session hides it right after hydration.
  const dismissedBefore = useSyncExternalStore(subscribe, readDismissed, () => false)

  const dismiss = () => {
    setDismissed(true)
    try {
      window.sessionStorage.setItem(KEY, '1')
    } catch {
      // Not persisted, but it stays closed for this page view.
    }
  }

  if (dismissed || dismissedBefore) return null

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
