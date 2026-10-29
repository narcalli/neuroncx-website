'use client'

/**
 * GSAP core and its React hook. Client only: import it from client
 * components, never from a server component.
 *
 * SplitText is the one GSAP plugin, registered in gsapSplitText. Stroke
 * drawing and curved paths use plain tweens instead (draw.ts, arc.ts).
 */

import { useGSAP as useGSAPBase } from '@gsap/react'
import { gsap } from 'gsap'

if (typeof window !== 'undefined') {
  gsap.registerPlugin(useGSAPBase)
}

type Callback = Parameters<typeof useGSAPBase>[0]
type Config = { scope?: unknown; dependencies?: unknown[]; revertOnUpdate?: boolean }

/**
 * useGSAP, reverting on every dependency change rather than only on unmount.
 *
 * Every animated block passes its motion level as a dependency, and that
 * level can change once right after hydration: the visitor's reduced-motion
 * preference has no server value, so the first client render assumes "on"
 * and corrects one render later. @gsap/react's default with a dependency list
 * defers cleanup to unmount, which left that first level-on run in place (its
 * hidden start states set, its in-view triggers armed), so a reduced-motion
 * visitor still saw the entrances. Reverting on update undoes that run and
 * calls its cleanup before the corrected one.
 */
export const useGSAP = (callback?: Callback, config?: unknown[] | Config) => {
  const opts: Config = Array.isArray(config) ? { dependencies: config } : { ...(config ?? {}) }
  return useGSAPBase(callback, { revertOnUpdate: true, ...opts } as Parameters<typeof useGSAPBase>[1])
}

export { gsap }
