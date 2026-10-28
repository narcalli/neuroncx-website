/**
 * Motion levels and how the switches combine. Pure functions, used by
 * useMotionLevel and MotionProvider, and safe to import anywhere.
 *
 * on: the full animation. reduced: a plain fade, with no loops, tilt, 3D,
 * magnetic pull or split text. off: every block in its final state.
 */

export type MotionLevel = 'on' | 'reduced' | 'off'

/** A page's or block's own switch: a level, or follow the one above it. */
export type MotionSetting = MotionLevel | 'follow'

const RANK: Record<MotionLevel, number> = { on: 0, reduced: 1, off: 2 }

const isLevel = (v: unknown): v is MotionLevel => v === 'on' || v === 'reduced' || v === 'off'

/** The stricter of two levels. */
export const stricter = (a: MotionLevel, b: MotionLevel): MotionLevel =>
  RANK[a] >= RANK[b] ? a : b

/**
 * The level a block draws at: the strictest of the visitor's system
 * preference (asking for less motion counts as off), the site, the page and
 * the block. A page or block left to follow, or not set, adds nothing, so
 * site off beats a block set to on.
 */
export const effectiveLevel = ({
  visitorReduced = false,
  site,
  page,
  block,
}: {
  visitorReduced?: boolean
  site?: MotionSetting | null
  page?: MotionSetting | null
  block?: MotionSetting | null
}): MotionLevel =>
  [visitorReduced ? 'off' : 'on', site, page, block]
    .filter(isLevel)
    .reduce<MotionLevel>(stricter, 'on')
