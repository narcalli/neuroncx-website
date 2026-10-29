'use client'

import { useContext } from 'react'

import { BlockMotionContext } from './BlockMotion'
import { MotionContext, usePrefersReducedMotion } from './context'
import { effectiveLevel, type MotionLevel, type MotionSetting } from './levels'

/**
 * The level a block animates at: the strictest of the visitor's system
 * preference, the site, the page and the block's own setting (levels.ts).
 * A component not handed its block's setting, or handed follow, takes the
 * one of the block or section it sits in (BlockMotion.tsx).
 * Every animated component reads this; none checks the settings itself.
 */
export const useMotionLevel = (block?: MotionSetting | null): MotionLevel => {
  const { site, page } = useContext(MotionContext)
  const around = useContext(BlockMotionContext)
  const visitorReduced = usePrefersReducedMotion()
  const own = block && block !== 'follow' ? block : around
  return effectiveLevel({ visitorReduced, site, page, block: own })
}
