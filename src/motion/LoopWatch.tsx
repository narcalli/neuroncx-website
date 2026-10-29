'use client'

import { useEffect } from 'react'

/**
 * One IntersectionObserver for every infinite CSS animation on the site.
 * Any element tagged data-loop gets data-inview while it is on screen; the
 * global CSS (globals.css, "Loops") pauses every animation on or inside a
 * data-loop element that lacks it, and stops them on their final frame at
 * the reduced and off levels. A MutationObserver picks up tagged elements
 * added later (client navigation, a typing indicator that comes and goes).
 *
 * The pause rule waits for html[data-loopwatch], set here, so with no
 * script the loops simply run as before rather than freezing.
 */
export const LoopWatch: React.FC = () => {
  useEffect(() => {
    if (typeof IntersectionObserver === 'undefined' || typeof MutationObserver === 'undefined') return
    const root = document.documentElement
    const io = new IntersectionObserver((entries) => {
      for (const entry of entries) entry.target.toggleAttribute('data-inview', entry.isIntersecting)
    })
    const tagged = (node: Node): Element[] => {
      if (!(node instanceof Element)) return []
      const inside = Array.from(node.querySelectorAll('[data-loop]'))
      return node.matches('[data-loop]') ? [node, ...inside] : inside
    }
    tagged(document.body).forEach((el) => io.observe(el))
    root.setAttribute('data-loopwatch', '')

    const mo = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => tagged(node).forEach((el) => io.observe(el)))
        record.removedNodes.forEach((node) => tagged(node).forEach((el) => io.unobserve(el)))
      }
    })
    mo.observe(document.body, { childList: true, subtree: true })

    return () => {
      mo.disconnect()
      io.disconnect()
      root.removeAttribute('data-loopwatch')
    }
  }, [])
  return null
}
