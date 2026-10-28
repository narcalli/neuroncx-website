'use client'

import { createContext, useSyncExternalStore } from 'react'

import type { MotionSetting } from './levels'

/**
 * The site's and the page's motion settings, set by MotionProvider, and how
 * deep the provider sits (the root is 1, a page inside it 2).
 */
export type MotionSettings = { site: MotionSetting; page: MotionSetting; depth: number }

/** With no provider, both are on: blocks animate as designed. */
export const MotionContext = createContext<MotionSettings>({ site: 'on', page: 'follow', depth: 0 })

const QUERY = '(prefers-reduced-motion: reduce)'

const subscribe = (onChange: () => void) => {
  const media = window.matchMedia(QUERY)
  media.addEventListener('change', onChange)
  return () => media.removeEventListener('change', onChange)
}

/**
 * Whether the visitor's system asks for less motion, kept up to date. The
 * server cannot know, so server HTML assumes not; blocks render the same
 * markup either way, and only their animations depend on it.
 */
export const usePrefersReducedMotion = (): boolean =>
  useSyncExternalStore(
    subscribe,
    () => window.matchMedia(QUERY).matches,
    () => false,
  )
