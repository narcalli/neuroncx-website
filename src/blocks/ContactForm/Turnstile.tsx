'use client'

import React, { useEffect, useRef } from 'react'

/**
 * Cloudflare Turnstile on the contact form: proves a person sent it, usually
 * without asking them anything (it shows a checkbox only when unsure). Shown
 * only when NEXT_PUBLIC_TURNSTILE_SITE_KEY is set at build time; the enquiry
 * route checks the answer (utilities/enquiryGuard.ts).
 */

type TurnstileApi = {
  render: (el: HTMLElement, options: Record<string, unknown>) => string
  reset: (widgetId: string) => void
  remove: (widgetId: string) => void
}

declare global {
  interface Window {
    turnstile?: TurnstileApi
  }
}

export const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY || ''

const SCRIPT_SRC = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'

// One script for the page, however many forms it has.
let loading: Promise<void> | null = null
const loadScript = (): Promise<void> => {
  if (window.turnstile) return Promise.resolve()
  if (!loading) {
    loading = new Promise((resolve, reject) => {
      const script = document.createElement('script')
      script.src = SCRIPT_SRC
      script.async = true
      script.onload = () => resolve()
      script.onerror = () => {
        loading = null
        reject(new Error('Turnstile did not load'))
      }
      document.head.appendChild(script)
    })
  }
  return loading
}

type Props = {
  /** The widget's answer, or '' when it has none (expired, failed, not loaded). */
  onToken: (token: string) => void
  /** Changes after each submission: an answer is good for one enquiry only. */
  round: number
}

export const Turnstile: React.FC<Props> = ({ onToken, round }) => {
  const box = useRef<HTMLDivElement>(null)
  const widget = useRef<string | null>(null)
  const report = useRef(onToken)

  useEffect(() => {
    report.current = onToken
  })

  useEffect(() => {
    let cancelled = false
    loadScript()
      .then(() => {
        if (cancelled || !box.current || !window.turnstile) return
        widget.current = window.turnstile.render(box.current, {
          sitekey: TURNSTILE_SITE_KEY,
          action: 'enquiry',
          appearance: 'interaction-only',
          callback: (token: string) => report.current(token),
          'expired-callback': () => report.current(''),
          'error-callback': () => report.current(''),
        })
      })
      .catch(() => report.current(''))
    return () => {
      cancelled = true
      if (widget.current && window.turnstile) window.turnstile.remove(widget.current)
      widget.current = null
    }
  }, [])

  useEffect(() => {
    if (round && widget.current && window.turnstile) window.turnstile.reset(widget.current)
  }, [round])

  return <div ref={box} className="turnstile" />
}
