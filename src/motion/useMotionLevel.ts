'use client'

import { useContext } from 'react'

import { MotionContext, usePrefersReducedMotion } from './context'
import { effectiveLevel, type MotionLevel, type MotionSetting } from './levels'

/**
 * The level a block animates at: the strictest of the visitor's system
 * preference, the site, the page and the block's own setting (levels.ts).
 * Every animated component reads this; none checks the settings itself.
 */
export const useMotionLevel = (block?: MotionSetting | null): MotionLevel => {
  const { site, page } = useContext(MotionContext)
  const visitorReduced = usePrefersReducedMotion()
  return effectiveLevel({ visitorReduced, site, page, block })
}
