'use client'

/**
 * Draws a stroked SVG element in, without the DrawSVG plugin: each element
 * gets pathLength="1", so one dash of length 1 covers its whole stroke, and
 * stroke-dashoffset is tweened from 1 (hidden) to 0 (drawn) with plain GSAP.
 * Works on any SVG shape (path, line, circle, rect, polyline, polygon).
 */

import { gsap } from './gsap'
import type { MotionLevel } from './levels'

type Targets = Element | ArrayLike<Element> | null | undefined

const list = (targets: Targets): Element[] =>
  !targets ? [] : targets instanceof Element ? [targets] : Array.from(targets)

/** Gives each element a length of 1 and one dash that long. Returns them. */
export const drawable = (targets: Targets): Element[] => {
  const els = list(targets)
  for (const el of els) {
    el.setAttribute('pathLength', '1')
    el.setAttribute('stroke-dasharray', '1')
  }
  return els
}

/** Sets the strokes to their undrawn start, ready to draw. */
export const undrawn = (targets: Targets): void => {
  const els = drawable(targets)
  if (els.length) gsap.set(els, { attr: { 'stroke-dashoffset': 1 } })
}

/**
 * Draws the strokes in. `level` is the block's level from useMotionLevel:
 * at anything but on the strokes are shown drawn at once and null is
 * returned. The tween can be added to a timeline.
 */
export const draw = (targets: Targets, level: MotionLevel, vars: gsap.TweenVars = {}): gsap.core.Tween | null => {
  const els = drawable(targets)
  if (!els.length) return null
  if (level !== 'on') {
    gsap.set(els, { attr: { 'stroke-dashoffset': 0 } })
    return null
  }
  return gsap.fromTo(
    els,
    { attr: { 'stroke-dashoffset': 1 } },
    { attr: { 'stroke-dashoffset': 0 }, duration: 0.8, ease: 'power2.inOut', ...vars },
  )
}
