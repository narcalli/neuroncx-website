'use client'

import { useEffect, useRef, type RefObject } from 'react'

import { IN_VIEW } from './tokens'

/**
 * Whether an element is already in view, past the start point, or the
 * window is scrolled to it. Content a visitor has already seen when the
 * script loads is left as it is, so nothing visible disappears to animate in.
 */
export const isPastStart = (el: Element): boolean =>
  el.getBoundingClientRect().top <= window.innerHeight * IN_VIEW.ratio

/**
 * Calls `callback` once when the element's top reaches 80% of the window
 * height, or when it is fully in view (an element near the end of the page
 * that can never reach the 80% line). Returns a function that stops
 * watching. Without IntersectionObserver it calls at once.
 */
export const onceInView = (el: Element, callback: () => void): (() => void) => {
  if (typeof IntersectionObserver === 'undefined') {
    callback()
    return () => {}
  }
  let done = false
  const fire = () => {
    if (done) return
    done = true
    stop()
    callback()
  }
  const atStart = new IntersectionObserver(
    (entries) => entries.some((e) => e.isIntersecting) && fire(),
    {
      rootMargin: IN_VIEW.rootMargin,
    },
  )
  const whole = new IntersectionObserver(
    (entries) => entries.some((e) => e.intersectionRatio >= 0.99) && fire(),
    {
      threshold: 0.99,
    },
  )
  const stop = () => {
    atStart.disconnect()
    whole.disconnect()
  }
  atStart.observe(el)
  whole.observe(el)
  return stop
}

/** Calls `callback` once when the element comes into view (onceInView), while `enabled`. */
export const useOnceInView = (
  ref: RefObject<Element | null>,
  callback: () => void,
  enabled = true,
): void => {
  const latest = useRef(callback)
  latest.current = callback
  useEffect(() => {
    const el = ref.current
    if (!el || !enabled) return
    return onceInView(el, () => latest.current())
  }, [ref, enabled])
}
