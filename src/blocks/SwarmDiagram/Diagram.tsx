'use client'

import { animate } from 'motion/react'
import React, { useEffect, useRef, useState } from 'react'

import { Reveal } from '@/motion/Reveal'
import { SplitHeading } from '@/motion/SplitHeading'
import { gsap, useGSAP } from '@/motion/gsap'
import '@/motion/gsapMotionPath'
import type { MotionSetting } from '@/motion/levels'
import { useLoopWhileVisible } from '@/motion/useLoopWhileVisible'
import { useMotionLevel } from '@/motion/useMotionLevel'
import { isPastStart, onceInView } from '@/motion/useOnceInView'

import { familyColor, labelAnchor, ringPositions, shortLabel, CORE_R, CX, CY, type Agent, type Pair } from './geometry'

type FactRow = { value: string; label: string }

type Props = {
  eyebrow?: string | null
  heading: string
  intro?: string | null
  facts: FactRow[]
  caption?: string | null
  agents: Agent[]
  pairs: Pair[]
  motion?: MotionSetting | null
  autoplay?: boolean | null
  loop?: boolean | null
}

const LEGEND = [
  { label: 'Book and get paid', color: 'var(--ncx-crimson)' },
  { label: 'Read and match documents', color: 'var(--ncx-navy)' },
  { label: 'Check and coach your team', color: 'var(--ncx-muted)' },
]

/** A number from a fact's value, or null when it is not one (an editor's own text, shown as is). */
const asCount = (value: string): number | null => (/^\d+$/.test(value.trim()) ? Number(value) : null)

const FactValue: React.FC<{ value: string; play: boolean }> = ({ value, play }) => {
  const count = asCount(value)
  const [shown, setShown] = useState(count ?? value)
  useEffect(() => {
    if (count === null || !play) return
    const controls = animate(0, count, { duration: 1.2, ease: 'easeOut', onUpdate: (v) => setShown(Math.round(v)) })
    return () => controls.stop()
  }, [count, play])
  return <>{shown}</>
}

/**
 * The bot swarm diagram: every live and pilot agent on a ring around the
 * shared customer record, coloured by family (geometry.ts). Entrance plays
 * once in view; the hand-off loop after it pauses off screen and, with
 * autoplay or motion off, never starts, leaving the static diagram and the
 * caption field in its place.
 */
export const SwarmDiagramClient: React.FC<Props> = ({
  eyebrow,
  heading,
  intro,
  facts,
  caption,
  agents,
  pairs,
  motion,
  autoplay,
  loop,
}) => {
  const level = useMotionLevel(motion)
  const doLoad = level === 'on' && autoplay !== false
  const [assembled, setAssembled] = useState(!doLoad)
  const [playCounts, setPlayCounts] = useState(!doLoad)
  const [hopCaption, setHopCaption] = useState<string | null>(null)
  const [hopTimeline, setHopTimeline] = useState<ReturnType<typeof gsap.timeline> | null>(null)

  const sectionRef = useRef<HTMLDivElement>(null)
  const ringRef = useRef<SVGCircleElement>(null)
  const coreRef = useRef<SVGGElement>(null)
  const coreRingRef = useRef<SVGCircleElement>(null)
  const packetRef = useRef<SVGCircleElement>(null)
  const nodeRefs = useRef<(SVGGElement | null)[]>([])
  const dotRefs = useRef<(SVGCircleElement | null)[]>([])
  const spokeRefs = useRef<(SVGLineElement | null)[]>([])
  const legendRef = useRef<HTMLUListElement>(null)

  const positions = ringPositions(agents.length)
  const byId = new Map(agents.map((a, i) => [a.id, i]))

  useGSAP(
    () => {
      const el = sectionRef.current
      if (!el || !doLoad || isPastStart(el)) return

      const nodes = nodeRefs.current.filter(Boolean)
      const spokes = spokeRefs.current.filter(Boolean)
      gsap.set([ringRef.current, coreRef.current, ...nodes, ...spokes], { opacity: 0 })
      gsap.set(ringRef.current, { scale: 0.5, transformOrigin: `${CX}px ${CY}px` })
      gsap.set(coreRef.current, { scale: 0, transformOrigin: `${CX}px ${CY}px` })
      if (legendRef.current) gsap.set(legendRef.current.children, { opacity: 0, y: 8 })

      const stop = onceInView(el, () => {
        const rnd = (a: number, b: number) => a + Math.random() * (b - a)
        const timeline = gsap.timeline()
        timeline
          .to(ringRef.current, { opacity: 1, scale: 1, duration: 1, ease: 'power2.out' }, 0)
          .to(coreRef.current, { opacity: 1, scale: 1, duration: 0.9, ease: 'back.out(2.2)' }, 0.1)
          .to(
            nodes,
            {
              opacity: 1,
              x: 0,
              y: 0,
              scale: 1,
              rotation: 0,
              startAt: { x: () => rnd(-260, 260), y: () => rnd(-200, 200), rotation: () => rnd(-90, 90) },
              duration: 1.3,
              stagger: { each: 0.07, from: 'random' },
              ease: 'power3.out',
            },
            0.3,
          )
          .to(spokes, { opacity: 1, duration: 0.8, stagger: 0.05, ease: 'power2.out' }, 1.1)
          .add(() => setPlayCounts(true), 0.2)
        if (legendRef.current?.children.length) {
          timeline.to(legendRef.current.children, { opacity: 1, y: 0, stagger: 0.1, duration: 0.4 }, 1.4)
        }
        timeline.add(() => setAssembled(true))
      })
      return stop
    },
    { dependencies: [doLoad], scope: sectionRef },
  )

  // The hand-off loop: a crimson packet from one agent through the centre to
  // the next, only once assembled. useLoopWhileVisible pauses it off screen.
  useGSAP(
    () => {
      if (!assembled || !doLoad || !pairs.length) return
      const clearHot = () => {
        nodeRefs.current.forEach((n) => n?.classList.remove('on'))
        spokeRefs.current.forEach((s) => s?.classList.remove('hot'))
      }
      const timeline = gsap.timeline({ repeat: loop === false ? 0 : -1, paused: true })
      pairs.forEach(({ fromId, toId, fromName, toName }) => {
        const a = byId.get(fromId)
        const b = byId.get(toId)
        if (a === undefined || b === undefined) return
        const pa = positions[a]
        const pb = positions[b]
        timeline
          .call(() => {
            clearHot()
            nodeRefs.current[a]?.classList.add('on')
            spokeRefs.current[a]?.classList.add('hot')
            spokeRefs.current[b]?.classList.add('hot')
            setHopCaption(`${fromName} hands the work to ${toName}.`)
          })
          .set(packetRef.current, { x: pa.x, y: pa.y })
          .to(packetRef.current, { opacity: 1, duration: 0.15 })
          .to(
            packetRef.current,
            { motionPath: { path: [{ x: pa.x, y: pa.y }, { x: CX, y: CY }, { x: pb.x, y: pb.y }], curviness: 1.5 }, duration: 1.5, ease: 'power2.inOut' },
            '<',
          )
          .fromTo(coreRingRef.current, { attr: { r: CORE_R }, opacity: 0.8 }, { attr: { r: CORE_R + 22 }, opacity: 0, duration: 0.7, ease: 'power2.out' }, '<.6')
          .call(() => nodeRefs.current[b]?.classList.add('on'), undefined, '>-.1')
          .fromTo(
            dotRefs.current[b],
            { scale: 1 },
            { scale: 1.4, transformOrigin: `${pb.x}px ${pb.y}px`, duration: 0.16, yoyo: true, repeat: 1, ease: 'power2.out' },
          )
          .to(packetRef.current, { opacity: 0, duration: 0.2 }, '<')
          .to({}, { duration: 0.6 })
      })
      setHopTimeline(timeline)
      return () => {
        timeline.kill()
        setHopTimeline(null)
        clearHot()
      }
    },
    { dependencies: [assembled, doLoad, pairs.length, loop], scope: sectionRef },
  )

  useLoopWhileVisible(sectionRef, assembled ? hopTimeline : null, motion)

  const captionText = doLoad && pairs.length ? hopCaption || caption : caption

  if (!agents.length) return null

  return (
    <section className="ncx-swarm" ref={sectionRef}>
      <style>{swarmCss}</style>
      <div className="inner ncx-container">
        <div className="grid">
          <div className="copy">
            {eyebrow ? (
              <Reveal as="p" from="left" className="eyebrow" motion={motion}>
                {eyebrow}
              </Reveal>
            ) : null}
            <SplitHeading as="h2" motion={motion}>
              {heading}
            </SplitHeading>
            {intro ? (
              <Reveal as="p" className="intro" motion={motion}>
                {intro}
              </Reveal>
            ) : null}
            {facts.length ? (
              <div className="facts">
                {facts.map((f, i) => (
                  <div className="fact" key={i}>
                    <b>
                      <FactValue value={f.value} play={playCounts} />
                    </b>
                    <span>{f.label}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          <div className="stage">
            <svg className="orbit" viewBox="0 0 640 450" role="img" aria-label={`${agents.length} agents arranged around one shared customer record`}>
              <circle className="ring" ref={ringRef} cx={CX} cy={CY} r={158} />
              {agents.map((a, i) => (
                <line
                  className="spoke"
                  key={`spoke-${a.id}`}
                  ref={(el) => {
                    spokeRefs.current[i] = el
                  }}
                  x1={CX}
                  y1={CY}
                  x2={positions[i].x}
                  y2={positions[i].y}
                />
              ))}
              <circle className="core-ring" ref={coreRingRef} cx={CX} cy={CY} r={CORE_R} opacity={0} />
              <g ref={coreRef}>
                <circle className="core" cx={CX} cy={CY} r={CORE_R} />
                <text className="core-t" x={CX} y={CY - 3} textAnchor="middle">
                  Customer
                </text>
                <text className="core-t" x={CX} y={CY + 14} textAnchor="middle">
                  record
                </text>
              </g>
              {agents.map((a, i) => {
                const label = labelAnchor(positions[i])
                return (
                  <g
                    className="node"
                    key={a.id}
                    ref={(el) => {
                      nodeRefs.current[i] = el
                    }}
                  >
                    <circle className="halo" cx={positions[i].x} cy={positions[i].y} r={22} />
                    <circle
                      className="dot"
                      ref={(el) => {
                        dotRefs.current[i] = el
                      }}
                      cx={positions[i].x}
                      cy={positions[i].y}
                      r={13}
                      fill={familyColor(a.familyName)}
                    />
                    <text className="lbl" x={label.x} y={label.y} textAnchor={label.anchor}>
                      {shortLabel(a.name)}
                    </text>
                  </g>
                )
              })}
              <circle className="packet" ref={packetRef} r={7} cx={0} cy={0} opacity={0} />
            </svg>
            {captionText ? (
              <p className="cap" aria-live="polite">
                {captionText}
              </p>
            ) : null}
            <ul className="legend" ref={legendRef}>
              {LEGEND.map((l) => (
                <li key={l.label}>
                  <i style={{ background: l.color }} />
                  {l.label}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  )
}

const swarmCss = `
.ncx-swarm{background:var(--ncx-white);color:var(--ncx-ink);font-family:var(--font-body),Arial,sans-serif}
.ncx-swarm .inner{padding-block:clamp(56px,7vw,88px)}
.ncx-swarm .grid{display:grid;grid-template-columns:.92fr 1.08fr;gap:48px;align-items:center}
.ncx-swarm .eyebrow{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.82rem;
  letter-spacing:.04em;color:var(--ncx-crimson-ink);margin:0 0 14px}
.ncx-swarm h2{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:clamp(1.6rem,3.2vw,2.1rem);
  line-height:1.15;margin:0;max-width:var(--ncx-heading-max)}
.ncx-swarm .intro{margin:16px 0 0;font-size:1.02rem;line-height:1.6;color:var(--ncx-muted);max-width:50ch}
.ncx-swarm .facts{display:flex;gap:28px;margin-top:28px;flex-wrap:wrap}
.ncx-swarm .fact{display:flex;flex-direction:column}
.ncx-swarm .fact b{font-family:var(--font-display),Arial,sans-serif;font-weight:700;font-size:2rem;color:var(--ncx-ink)}
.ncx-swarm .fact span{font-size:.86rem;color:var(--ncx-muted)}

.ncx-swarm .stage{background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:var(--ncx-r-panel);
  padding:20px 16px 18px;box-shadow:var(--ncx-shadow)}
.ncx-swarm .orbit{width:100%;height:auto;display:block;overflow:visible}
.ncx-swarm .orbit .ring{fill:none;stroke:var(--ncx-rule);stroke-dasharray:3 6}
.ncx-swarm .orbit .spoke{stroke:var(--ncx-rule-strong);stroke-width:1.5;transition:stroke .3s}
.ncx-swarm .orbit .spoke.hot{stroke:var(--ncx-navy)}
.ncx-swarm .orbit .halo{fill:var(--ncx-crimson-tint);opacity:0;transition:opacity .3s}
.ncx-swarm .orbit .node.on .halo{opacity:1}
.ncx-swarm .orbit .lbl{font:500 13px var(--font-body),Arial,sans-serif;fill:var(--ncx-ink)}
.ncx-swarm .orbit .core{fill:var(--ncx-navy)}
.ncx-swarm .orbit .core-t{font:600 13px var(--font-display),Arial,sans-serif;fill:var(--ncx-on-navy)}
.ncx-swarm .orbit .packet{fill:var(--ncx-crimson)}
.ncx-swarm .orbit .core-ring{fill:none;stroke:var(--ncx-crimson);stroke-width:2}
.ncx-swarm .cap{min-height:3em;margin:6px 0 0;font-size:14px;color:var(--ncx-muted);text-align:center}
.ncx-swarm .legend{margin:4px 0 0;padding:0;list-style:none;display:flex;gap:16px;flex-wrap:wrap;justify-content:center;font-size:.82rem;color:var(--ncx-muted)}
.ncx-swarm .legend li{display:inline-flex;align-items:center;gap:6px}
.ncx-swarm .legend i{width:9px;height:9px;border-radius:50%;flex:none;display:inline-block}

@media(max-width:960px){
  .ncx-swarm .grid{grid-template-columns:1fr;gap:32px}
}
@media(prefers-reduced-motion:reduce){
  .ncx-swarm .orbit .spoke{transition:none}
  .ncx-swarm .orbit .halo{transition:none}
}
`
