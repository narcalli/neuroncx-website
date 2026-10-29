'use client'

/**
 * Moves an element along quadratic curves, without the MotionPath plugin.
 *
 * A chain is [start, control, end] for one curve, or [p0, c1, p1, c2, p2, ...]
 * for several joined end to end. A plain GSAP tween runs 0 to 1, each curve
 * gets an equal share of it, and each render sets the element's x and y.
 */

import { gsap } from './gsap'

export type Point = { x: number; y: number }

/** The control point that makes the curve from `a` to `b` pass through `via` halfway along. */
export const controlThrough = (a: Point, via: Point, b: Point): Point => ({
  x: 2 * via.x - (a.x + b.x) / 2,
  y: 2 * via.y - (a.y + b.y) / 2,
})

/**
 * Two joined curves from `a` through `via` to `b`, smooth at `via`: the path
 * leaves `via` heading the way from `a` to `b`. `bend` sets how far the two
 * controls sit from `via`, as a share of the distance from `a` to `b`.
 */
export const chainThrough = (a: Point, via: Point, b: Point, bend = 0.25): Point[] => {
  const dx = (b.x - a.x) * bend
  const dy = (b.y - a.y) * bend
  return [a, { x: via.x - dx, y: via.y - dy }, via, { x: via.x + dx, y: via.y + dy }, b]
}

/** The point at `progress` (0 to 1) along a chain. */
export const pointOnChain = (chain: Point[], progress: number): Point => {
  const curves = (chain.length - 1) / 2
  const at = Math.min(Math.max(progress, 0), 1) * curves
  const i = Math.min(curves - 1, Math.floor(at))
  const t = at - i
  const a = chain[2 * i]
  const c = chain[2 * i + 1]
  const b = chain[2 * i + 2]
  const u = 1 - t
  return {
    x: u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    y: u * u * a.y + 2 * u * t * c.y + t * t * b.y,
  }
}

/** Tweens `target` along `chain`. Takes the usual tween vars (duration, ease, delay); can be added to a timeline. */
export const arc = (
  target: Element | null | undefined,
  chain: Point[],
  vars: gsap.TweenVars = {},
): gsap.core.Tween => {
  if (chain.length < 3 || chain.length % 2 === 0) {
    throw new Error(
      'arc: a chain is start, control, end, then a control and an end per further curve',
    )
  }
  const setX = target ? gsap.quickSetter(target, 'x', 'px') : null
  const setY = target ? gsap.quickSetter(target, 'y', 'px') : null
  // Progress is a getter and setter rather than a number read in onUpdate:
  // GSAP calls the setter on every render, including seek(), which skips
  // onUpdate by default. A timeline sought to a label mid-arc still puts the
  // element where it belongs.
  let progress = 0
  const proxy = {
    p(value?: number): number {
      if (value === undefined) return progress
      progress = value
      const pt = pointOnChain(chain, progress)
      setX?.(pt.x)
      setY?.(pt.y)
      return progress
    },
  }
  return gsap.to(proxy, { p: 1, ease: 'none', ...vars })
}
