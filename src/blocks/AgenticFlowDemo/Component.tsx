'use client'

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { animate } from 'motion/react'

import type { AgenticFlowDemoBlock as AgenticFlowDemoProps } from '@/payload-types'

type DemoEvent = NonNullable<AgenticFlowDemoProps['events']>[number]
type Step = NonNullable<AgenticFlowDemoProps['steps']>[number]

const HANDLERS = ['agent', 'human'] as const

export const AgenticFlowDemoBlock: React.FC<AgenticFlowDemoProps> = ({ heading, intro, events, steps, footnote }) => {
  const list: DemoEvent[] = (events || []).filter((e) => e && e.label)
  const stepList: Step[] = (steps || []).filter((s) => s && s.title)

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
      <style>{`
        .ncx-flow{padding:84px 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-flow h2{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:clamp(1.55rem,3.4vw,2.2rem);
          max-width:24ch;letter-spacing:-.01em;margin:0;color:var(--ncx-ink)}
        .ncx-flow .sec-sub{max-width:62ch;margin-top:18px;color:var(--ncx-muted)}
        .ncx-flow .lab-box{margin-top:44px;border-radius:18px;padding:22px;background:var(--ncx-cloud);border:1px solid var(--ncx-rule)}
        .ncx-flow .lab-q{margin:0 0 14px;color:var(--ncx-muted);font-size:.92rem}
        .ncx-flow .trig{display:flex;flex-wrap:wrap;gap:10px}
        .ncx-flow .tb{color:var(--ncx-body);background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:999px;
          padding:9px 16px;cursor:pointer;font-weight:500;font-size:.92rem;font-family:inherit}
        .ncx-flow .tb[aria-pressed="true"]{background:var(--ncx-crimson);border-color:var(--ncx-crimson);color:var(--ncx-on-navy)}
        .ncx-flow .stage{position:relative;display:grid;grid-template-columns:1fr 1fr 1fr;gap:clamp(28px,6vw,80px);margin-top:26px;align-items:stretch}
        .ncx-flow .stage-svg{position:absolute;inset:0;width:100%;height:100%;z-index:0;pointer-events:none;overflow:visible}
        .ncx-flow .base{fill:none;stroke:var(--ncx-rule);stroke-width:2;stroke-dasharray:4 7}
        .ncx-flow .trail{fill:none;stroke:var(--ncx-crimson);stroke-width:3;stroke-linecap:round}
        .ncx-flow .dot{fill:var(--ncx-crimson);stroke:var(--ncx-white);stroke-width:2}
        .ncx-flow .node{position:relative;z-index:1;background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:14px;
          padding:16px 16px 18px;min-height:136px;display:flex;flex-direction:column;gap:7px;transition:border-color .3s,box-shadow .4s}
        .ncx-flow .node.on{border-color:var(--ncx-crimson);box-shadow:0 0 0 1px var(--ncx-crimson),0 14px 30px -18px var(--ncx-crimson)}
        .ncx-flow .node.ok.on{border-color:var(--ncx-teal);box-shadow:0 0 0 1px var(--ncx-teal),0 14px 30px -18px var(--ncx-teal)}
        .ncx-flow .tag{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.7rem;letter-spacing:.14em;text-transform:uppercase;color:var(--ncx-muted)}
        /* The node's ring and glow stay flat crimson/teal — they are state
           marks at area, not text. The tags are text, so they take the -ink
           stops and step to the on-navy tones inside a highlight. */
        .ncx-flow .node.on .tag{color:var(--ncx-crimson-ink)}
        .ncx-flow .node.ok.on .tag{color:var(--ncx-teal-ink)}
        .ncx-flow .node b{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:1.05rem;line-height:1.25;color:var(--ncx-ink)}
        .ncx-flow .node small{color:var(--ncx-muted);font-size:.85rem;line-height:1.45}
        .ncx-flow .node.ok:not(.on) b,.ncx-flow .node.ok:not(.on) small{opacity:.45}
        .ncx-flow .hch{display:flex;gap:8px;flex-wrap:wrap}
        .ncx-flow .hch span{border-radius:999px;padding:5px 11px;font-size:.8rem;border:1px solid var(--ncx-rule);color:var(--ncx-muted);transition:background .3s,color .3s}
        .ncx-flow .hch span.on{background:var(--ncx-crimson);color:var(--ncx-on-navy);border-color:var(--ncx-crimson)}
        .ncx-flow .note{margin:18px 0 0;font-size:.82rem;color:var(--ncx-muted)}
        .ncx-flow .steps{display:grid;grid-template-columns:repeat(3,1fr);gap:22px;margin-top:36px}
        .ncx-flow .step{padding:22px 22px 24px;border-radius:14px;background:var(--ncx-white);border:1px solid var(--ncx-rule);border-top:3px solid var(--ncx-rule)}
        .ncx-flow .step h3{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:1.1rem;color:var(--ncx-crimson-ink);margin:0 0 8px}
        .ncx-flow .step p{font-size:.97rem;margin:0}
        @media (max-width:720px){
          .ncx-flow{padding:60px 0}
          .ncx-flow .stage{grid-template-columns:1fr;gap:30px}
          .ncx-flow .steps{grid-template-columns:1fr}
        }
      `}</style>

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

        {stepList.length ? (
          <div className="steps">
            {stepList.map((s, i) => (
              <div className="step" key={i}>
                <h3>{s.title}</h3>
                <p>{s.text}</p>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </section>
  )
}
