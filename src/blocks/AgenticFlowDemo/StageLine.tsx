'use client'

import { animate } from 'motion/react'
import React, { useEffect, useLayoutEffect, useRef } from 'react'

import type { LineStyle } from './design'
import { isStill } from '@/motion/still'


/**
 * The line joining a stage's three cards, measured from the cards themselves
 * (the stage is its parent element). Animated: each time `playKey` changes
 * (not on first draw) a dot travels from the first card to the third while
 * the line draws behind it; under reduced motion it is drawn at once.
 * Static: drawn at once, no dot (the CSS hides it). None: nothing is drawn.
 *
 * `onProgress` reports how far along the line is, 0 to 1, so Flow mode can
 * light each card as the dot reaches it.
 */
export const StageLine: React.FC<{
  lineStyle: LineStyle
  playKey: string | number
  onProgress?: (p: number) => void
}> = ({ lineStyle, playKey, onProgress }) => {
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)
  const progressRef = useRef(1)
  const lenRef = useRef(1)
  const firstDraw = useRef(true)
  const running = useRef<{ stop: () => void } | null>(null)
  const report = useRef(onProgress)
  // Kept current before the drawing effect below reads it.
  useLayoutEffect(() => {
    report.current = onProgress
  })

  // Moves the dot and the drawn part of the line to a point 0..1 along it.
  const paint = (p: number) => {
    progressRef.current = p
    report.current?.(p)
    const path = pathRef.current
    const dot = dotRef.current
    if (!path || !dot) return
    const len = lenRef.current
    path.style.strokeDashoffset = String(len - len * p)
    const pt = path.getPointAtLength(len * p)
    dot.setAttribute('cx', String(pt.x))
    dot.setAttribute('cy', String(pt.y))
  }

  // Draws the path through the cards' centres, measured from the DOM.
  const layout = () => {
    const svg = svgRef.current
    const path = pathRef.current
    const stage = svg?.parentElement
    if (!svg || !path || !stage) return
    const sr = stage.getBoundingClientRect()
    if (!sr.width) return
    const centres = [...stage.querySelectorAll<HTMLElement>(':scope > .node')].slice(0, 3).map((el) => {
      const r = el.getBoundingClientRect()
      return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2 }
    })
    if (centres.length < 3) return
    svg.setAttribute('viewBox', `0 0 ${sr.width} ${sr.height}`)
    path.setAttribute('d', `M${centres[0].x} ${centres[0].y} L${centres[1].x} ${centres[1].y} L${centres[2].x} ${centres[2].y}`)
    lenRef.current = path.getTotalLength() || 1
    path.style.strokeDasharray = `${lenRef.current} ${lenRef.current}`
    paint(progressRef.current)
  }

  useLayoutEffect(() => {
    layout()
    if (firstDraw.current || lineStyle !== 'animated' || isStill(pathRef.current)) {
      firstDraw.current = false
      running.current?.stop()
      paint(1)
      return
    }
    running.current?.stop()
    paint(0)
    running.current = animate(0, 1, { duration: 2.6, ease: 'easeInOut', onUpdate: (v) => paint(v) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playKey, lineStyle])

  useEffect(() => {
    const onResize = () => layout()
    window.addEventListener('resize', onResize)
    return () => {
      window.removeEventListener('resize', onResize)
      running.current?.stop()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (lineStyle === 'none') return null
  return (
    <svg className="stage-svg" ref={svgRef} aria-hidden="true" focusable="false">
      <path className="base" ref={pathRef} d="M0 0" />
      <circle className="dot" ref={dotRef} r={6} cx={0} cy={0} />
    </svg>
  )
}
