'use client'

import { useEffect, type RefObject } from 'react'

import type { MotionSetting } from './levels'
import { useMotionLevel } from './useMotionLevel'

/** What a looping timeline needs: GSAP timelines and tweens have both. */
type Playable = { play: () => unknown; pause: () => unknown }

/**
 * Plays a looping timeline only while its element is on screen, and pauses
 * it otherwise. Loops run only at level on: on reduced or off the timeline
 * stays paused, and the block shows its final state.
 */
export const useLoopWhileVisible = (
  ref: RefObject<Element | null>,
  timeline: Playable | null | undefined,
  block?: MotionSetting | null,
): void => {
  const level = useMotionLevel(block)
  useEffect(() => {
    const el = ref.current
    if (!el || !timeline) return
    if (level !== 'on' || typeof IntersectionObserver === 'undefined') {
      timeline.pause()
      return
    }
    const watch = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) timeline.play()
      else timeline.pause()
    })
    watch.observe(el)
    return () => {
      watch.disconnect()
      timeline.pause()
    }
  }, [ref, timeline, level])
}
