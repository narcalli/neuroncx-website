'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { animate } from 'motion/react'

import type { AgenticFlowDemoBlock as AgenticFlowDemoProps } from '@/payload-types'

import { flowCss } from './styles'

type DemoEvent = NonNullable<AgenticFlowDemoProps['events']>[number]

const HANDLERS = ['agent', 'human'] as const

/** Flow mode: an event travels through trigger, route and resolve. */
export const FlowDemo: React.FC<AgenticFlowDemoProps> = ({ heading, intro, events, footnote }) => {
  const list: DemoEvent[] = (events || []).filter((e) => e && e.label)

  const stageRef = useRef<HTMLDivElement>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const pathRef = useRef<SVGPathElement>(null)
  const dotRef = useRef<SVGCircleElement>(null)
  const [active, setActive] = useState(0)
  const [progress, setProgress] = useState(1)
  const progressRef = useRef(1)
  const lenRef = useRef(1)

  const ev: DemoEvent | undefined = list[active] ?? list[0]
  const routeOn = progress >= 0.5
  const resolveOn = progress >= 0.995

  // Draws the three-stage path between the node centres, measured from the DOM.
  const layout = () => {
    const stage = stageRef.current
    const path = pathRef.current
    const svg = svgRef.current
    if (!stage || !path || !svg) return
    const sr = stage.getBoundingClientRect()
    if (!sr.width) return
    const centres = ['.n-trig', '.n-route', '.n-res'].map((sel) => {
      const el = stage.querySelector(sel) as HTMLElement | null
      if (!el) return { x: 0, y: 0 }
      const r = el.getBoundingClientRect()
      return { x: r.left - sr.left + r.width / 2, y: r.top - sr.top + r.height / 2 }
    })
    svg.setAttribute('viewBox', `0 0 ${sr.width} ${sr.height}`)
    const d = `M${centres[0].x} ${centres[0].y} L${centres[1].x} ${centres[1].y} L${centres[2].x} ${centres[2].y}`
    path.setAttribute('d', d)
    lenRef.current = path.getTotalLength() || 1
    path.style.strokeDasharray = `${lenRef.current} ${lenRef.current}`
    paint(progressRef.current)
  }

  // Moves the travelling dot and the trail to a point 0..1 along the path.
  const paint = (p: number) => {
    progressRef.current = p
    setProgress(p)
    const path = pathRef.current
    const dot = dotRef.current
    if (!path || !dot) return
    const len = lenRef.current
    path.style.strokeDashoffset = String(len - len * p)
    const pt = path.getPointAtLength(len * p)
    dot.setAttribute('cx', String(pt.x))
    dot.setAttribute('cy', String(pt.y))
  }

  const play = (instant = false) => {
    if (instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      paint(1)
      return
    }
    paint(0)
    animate(0, 1, { duration: 2.6, ease: 'easeInOut', onUpdate: (v) => paint(v) })
  }

  useLayoutEffect(() => {
    layout()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active])

  useEffect(() => {
    const onResize = () => layout()
    window.addEventListener('resize', onResize)
    play(true)
    return () => window.removeEventListener('resize', onResize)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (!list.length) return null

  return (
    <section className="ncx-flow">
      <style>{flowCss}</style>

      <div className="wrap ncx-container">
        <h2>{heading}</h2>
        {intro ? <p className="sec-sub">{intro}</p> : null}

        <div className="lab-box">
          <p className="lab-q">Pick an event and watch it travel through.</p>
          <div className="trig" role="group" aria-label="Pick an event">
            {list.map((e, i) => (
              <button
                key={i}
                type="button"
                className="tb"
                aria-pressed={i === active}
                onClick={() => {
                  setActive(i)
                  play()
                }}
              >
                {e.label}
              </button>
            ))}
          </div>

          <div className="stage" ref={stageRef}>
            <svg className="stage-svg" ref={svgRef} aria-hidden="true" focusable="false">
              <path className="base" ref={pathRef} d="M0 0" />
              <circle className="dot" ref={dotRef} r={6} cx={0} cy={0} />
            </svg>

            <div className={`node n-trig on`}>
              <span className="tag">Trigger</span>
              <b>{ev?.triggerTitle}</b>
              <small>{ev?.triggerText}</small>
            </div>

            <div className={`node n-route${routeOn ? ' on' : ''}`}>
              <span className="tag">Route</span>
              <div className="hch">
                {HANDLERS.map((h) => (
                  <span
                    key={h}
                    className={routeOn && (ev?.handlers || []).includes(h) ? 'on' : ''}
                  >
                    {h === 'agent' ? 'Virtual agent' : 'Human team'}
                  </span>
                ))}
              </div>
              <small>{ev?.routeText}</small>
            </div>

            <div className={`node n-res ok${resolveOn ? ' on' : ''}`}>
              <span className="tag">Resolve</span>
              <b>{ev?.resolveTitle}</b>
              <small>{ev?.resolveText}</small>
            </div>
          </div>

          {footnote ? <p className="note">{footnote}</p> : null}
        </div>
      </div>
    </section>
  )
}
