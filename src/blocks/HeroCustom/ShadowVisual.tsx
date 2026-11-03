'use client'

import React, { useLayoutEffect, useRef } from 'react'

/**
 * Your HTML and CSS, in a sealed box (a shadow root): its CSS styles only
 * what is inside, and the page's CSS does not reach in. The site's colour and
 * font variables still do, so var(--ncx-crimson) and var(--font-display)
 * work. The box clips what it holds and starts its own stacking, so nothing
 * in it can spill over the page or sit above the header.
 *
 * On a first page load the browser builds the box from the HTML itself (a
 * declarative shadow root), so the text is in the page for search engines
 * and shows before any script runs. After an in-site navigation that HTML
 * arrives as plain markup, which the browser does not turn into a box, so
 * the box is made here instead.
 */

// What every visual starts from, before its own CSS.
const BASE = `:host{display:block;position:relative;width:100%;height:100%;overflow:hidden;contain:paint;isolation:isolate;
container-type:inline-size;container-name:visual;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
*,*::before,*::after{box-sizing:border-box}`

// After its own CSS, so it wins: for visitors who ask for reduced motion,
// every animation runs straight to its end and nothing transitions.
const REDUCED = `@media (prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:.001ms!important;
animation-delay:0s!important;animation-iteration-count:1!important;transition:none!important;scroll-behavior:auto!important}}`

// Also after its own CSS: while the host carries data-anim="hold" (animateOnView,
// below), every animation waits at its first frame.
const HOLD = `:host([data-anim="hold"]) *,:host([data-anim="hold"]) *::before,:host([data-anim="hold"]) *::after{animation-play-state:paused!important}`

/** The box's contents: the base, the visual's CSS, the reduced-motion and hold rules, then its HTML. */
export const visualMarkup = (html: string, css: string): string =>
  `<style>${BASE}\n${css}\n${REDUCED}\n${HOLD}</style>${html}`

/** How much of an element is on screen, from 0 to 1. */
const shownShare = (el: Element): number => {
  const r = el.getBoundingClientRect()
  const seen = Math.min(r.bottom, window.innerHeight) - Math.max(r.top, 0)
  return r.height > 0 ? Math.max(0, seen) / r.height : 0
}

export const ShadowVisual: React.FC<{
  html: string
  css: string
  alt?: string | null
  /**
   * Start the visual's animations when it first comes into view rather than
   * on load, for a visual further down the page (Custom Visual). The server
   * HTML is the plain, finished visual; once the page runs, a visual not yet
   * in view is rewound to its first frame and held there until at least 20%
   * of it shows. Off for the hero, which is in view at load.
   */
  animateOnView?: boolean
}> = ({ html, css, alt, animateOnView = false }) => {
  const hostRef = useRef<HTMLDivElement>(null)
  // The markup the box holds: what the browser built it from on first load,
  // or what was last put in it here.
  const shown = useRef<string | null>(null)
  const markup = visualMarkup(html, css)

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!host) return
    if (!host.shadowRoot) {
      host.attachShadow({ mode: 'open' }).innerHTML = markup
    } else if (shown.current !== null && shown.current !== markup) {
      // Changed content, such as a live preview update: refill the box.
      host.shadowRoot.innerHTML = markup
    }
    shown.current = markup
  }, [markup])

  useLayoutEffect(() => {
    const host = hostRef.current
    if (!animateOnView || !host?.shadowRoot || typeof IntersectionObserver === 'undefined') return
    // Already in view, or motion reduced (everything is at its end at once): nothing to hold.
    if (shownShare(host) >= 0.2 || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    host.dataset.anim = 'hold'
    // Back to the first frame: they started on load, before this ran.
    for (const a of host.shadowRoot.getAnimations()) a.currentTime = 0
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting && e.intersectionRatio >= 0.2)) {
          host.dataset.anim = 'run'
          io.disconnect()
        }
      },
      { threshold: 0.2 },
    )
    io.observe(host)
    return () => io.disconnect()
  }, [animateOnView])

  return (
    <div
      ref={hostRef}
      className="hcx-visual"
      {...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true })}
      suppressHydrationWarning
      dangerouslySetInnerHTML={{ __html: `<template shadowrootmode="open">${markup}</template>` }}
    />
  )
}
