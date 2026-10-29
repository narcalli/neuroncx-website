'use client'

import React, { createContext } from 'react'

import type { MotionSetting } from './levels'

/**
 * The motion setting of the block or section a component sits in. A section
 * built from several components (a heading, an intro, cards, a closing
 * panel) gets one setting from the CMS; BlockWrapper and the section
 * renderers provide it here, so every useMotionLevel() inside follows it
 * without each component being handed the prop.
 */
export const BlockMotionContext = createContext<MotionSetting | null>(null)

export const BlockMotion: React.FC<{ motion?: string | null; children: React.ReactNode }> = ({
  motion,
  children,
}) => {
  const value = motion === 'on' || motion === 'reduced' || motion === 'off' ? motion : null
  return value ? (
    <BlockMotionContext.Provider value={value}>{children}</BlockMotionContext.Provider>
  ) : (
    <>{children}</>
  )
}
