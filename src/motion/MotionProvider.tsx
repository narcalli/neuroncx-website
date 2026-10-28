'use client'

import { MotionConfig } from 'motion/react'
import React, { useContext, useEffect, useMemo } from 'react'

import { MotionContext } from './context'
import type { MotionLevel, MotionSetting } from './levels'
import { useMotionLevel } from './useMotionLevel'

/**
 * Puts the motion settings in context for every block below. The root
 * layout gives the site's setting; each page route adds its own setting
 * with MotionPage. Also:
 * - sets data-motion="on|reduced|off" on <html> from the innermost page's
 *   level, so one CSS rule finishes every transition when it is off
 *   (globals.css);
 * - tells Motion (motion/react) components to skip their movement when the
 *   level is not on, through MotionConfig.
 */
export const MotionProvider: React.FC<{
  site?: MotionSetting | null
  page?: MotionSetting | null
  children: React.ReactNode
}> = ({ site, page, children }) => {
  const parent = useContext(MotionContext)
  const value = useMemo(
    () => ({ site: site || 'on', page: page || 'follow', depth: parent.depth + 1 }),
    [site, page, parent.depth],
  )
  return (
    <MotionContext.Provider value={value}>
      <LevelEffects depth={value.depth}>{children}</LevelEffects>
    </MotionContext.Provider>
  )
}

/**
 * A page's own motion setting, inside the root's: the page's level for its
 * blocks, and data-motion on a wrapper in the server HTML, so CSS holds the
 * page still before any script runs. The wrapper does not affect layout.
 */
export const MotionPage: React.FC<{ page?: MotionSetting | null; children: React.ReactNode }> = ({
  page,
  children,
}) => {
  const { site } = useContext(MotionContext)
  const still = page === 'off' || page === 'reduced' ? page : undefined
  return (
    <MotionProvider site={site} page={page}>
      <div data-motion={still} style={{ display: 'contents' }}>
        {children}
      </div>
    </MotionProvider>
  )
}

// The levels of the mounted providers, by depth: <html> shows the deepest.
const mounted = new Map<symbol, { depth: number; level: MotionLevel }>()
const showDeepest = () => {
  let deepest: { depth: number; level: MotionLevel } | undefined
  for (const entry of mounted.values()) if (!deepest || entry.depth >= deepest.depth) deepest = entry
  if (deepest) document.documentElement.dataset.motion = deepest.level
}

const LevelEffects: React.FC<{ depth: number; children: React.ReactNode }> = ({ depth, children }) => {
  const level = useMotionLevel()
  useEffect(() => {
    const key = Symbol('motion')
    mounted.set(key, { depth, level })
    showDeepest()
    return () => {
      mounted.delete(key)
      showDeepest()
    }
  }, [depth, level])
  return <MotionConfig reducedMotion={level === 'on' ? 'user' : 'always'}>{children}</MotionConfig>
}
