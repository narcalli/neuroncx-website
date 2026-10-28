'use client'

import { AnimatePresence, motion as m } from 'motion/react'
import React, { useRef, useState } from 'react'

import { gsap, useGSAP } from '@/motion/gsap'
import '@/motion/gsapMotionPath'
import { SplitText } from '@/motion/gsapSplitText'
import type { MotionSetting } from '@/motion/levels'
import { SPRING } from '@/motion/tokens'
import { useMotionLevel } from '@/motion/useMotionLevel'
import { SplitHeading } from '@/motion/SplitHeading'
import { Reveal } from '@/motion/Reveal'

import { accentVars, designClasses, designVars, type Design } from './design'
import type { FeatureAgent, FeatureFamily } from './featureData'
import { StageLine } from './StageLine'
import { featuresCss, flowCss } from './styles'

/** The list arrives from this side and the old one leaves toward it (prompt 7, point 2). */
const listVariants = {
  enter: (dir: number) => ({ x: dir > 0 ? 36 : -36, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (dir: number) => ({ x: dir > 0 ? -36 : 36, opacity: 0 }),
}

/**
 * Agent features mode: pick a family, then an agent, and see what it does,
 * its features and what it saves. Every agent's panel is in the HTML, so
 * search engines read them all; only the selected one is laid out, the rest
 * sit at opacity 0 and out of flow. The first family is selected on load,
 * and the first agent whenever the family changes. The Design tab
 * (design.ts) sets the eyebrows, tags, colours, line, buttons and panel;
 * with nothing set it draws as it always has.
 *
 * Motion (prompt 7 of the motion plan): the family tab indicator, the agent
 * list, the panel's fade and height, the features and the handler chips use
 * Framer Motion; the agent name and the "Saves to your systems" packet use
 * GSAP (SplitText, MotionPath). Off, every change is instant and the packet
 * never runs.
 */
export const AgentFeatures: React.FC<{
  eyebrow?: string | null
  heading: string
  intro?: string | null
  families: FeatureFamily[]
  pickFamilyLabel: string
  pickAgentLabel: string
  design: Design
  /** The block's own Motion panel. */
  motion?: MotionSetting | null
}> = ({ eyebrow, heading, intro, families, pickFamilyLabel, pickAgentLabel, design: d, motion }) => {
  const doAnimate = useMotionLevel(motion) === 'on'

  // familyAt/agentAt: the tabs' own selection, moves at once so a click
  // always feels answered. shown: which panel is actually laid out; it
  // follows a beat behind, once the outgoing one has faded (changePanel).
  // gen: bumped each time shown changes, so the newly active panel's
  // features and handler chips remount and replay, without the other,
  // always-mounted panels doing the same.
  const [familyAt, setFamilyAt] = useState(0)
  const [agentAt, setAgentAt] = useState(0)
  const [shown, setShown] = useState({ f: 0, a: 0 })
  const [leaving, setLeaving] = useState(false)
  const [dir, setDir] = useState(1)
  const [gen, setGen] = useState(0)
  const pending = useRef<{ f: number; a: number } | null>(null)
  const firstPanel = useRef(true)

  const nameRefs = useRef<Record<string, HTMLElement | null>>({})
  const packetRefs = useRef<Record<string, SVGCircleElement | null>>({})
  const dbRefs = useRef<Record<string, SVGGElement | null>>({})
  const scopeRef = useRef<HTMLDivElement>(null)

  const changePanel = (f: number, a: number, travel: number) => {
    setFamilyAt(f)
    setAgentAt(a)
    if (!doAnimate) {
      setShown({ f, a })
      setGen((g) => g + 1)
      return
    }
    if (leaving) return // ignored until the change in progress finishes (point 4)
    setDir(travel)
    pending.current = { f, a }
    setLeaving(true)
  }

  const pickFamily = (fi: number) => {
    if (fi === familyAt) return
    changePanel(fi, 0, fi > familyAt ? 1 : -1)
  }
  const pickAgent = (ai: number) => {
    if (ai === agentAt) return
    changePanel(familyAt, ai, ai > agentAt ? 1 : -1)
  }

  const activeAgent: FeatureAgent | undefined = families[shown.f]?.agents[shown.a]

  // The name split and the packet: once per panel, never the first (the
  // server HTML already shows it), and never with motion off.
  useGSAP(
    () => {
      if (firstPanel.current) {
        firstPanel.current = false
        return
      }
      if (!doAnimate || !activeAgent) return
      const nameEl = nameRefs.current[activeAgent.id]
      const packetEl = packetRefs.current[activeAgent.id]
      const dbEl = dbRefs.current[activeAgent.id]
      let split: ReturnType<typeof SplitText.create> | null = null
      if (nameEl) {
        split = SplitText.create(nameEl, { type: 'words', mask: 'words' })
        gsap.set(split.words, { yPercent: 110 })
        gsap.to(split.words, { yPercent: 0, duration: 0.55, stagger: 0.05, ease: 'power4.out', onComplete: () => split?.revert() })
      }
      if (packetEl && dbEl) {
        gsap
          .timeline({ delay: 0.5 })
          .fromTo(packetEl, { x: 0, y: 0, opacity: 0, rotation: 0 }, { opacity: 1, duration: 0.15 })
          .to(packetEl, {
            motionPath: { path: [{ x: 0, y: 0 }, { x: 18, y: -18 }, { x: 42, y: -4 }], curviness: 1.2 },
            rotation: 180,
            transformOrigin: '50% 50%',
            duration: 0.7,
            ease: 'power2.in',
          })
          .to(packetEl, { opacity: 0, scale: 0.4, duration: 0.12 }, '-=.08')
          .to(dbEl, { y: 3, duration: 0.1, yoyo: true, repeat: 1, ease: 'power2.out' }, '<')
      }
      return () => {
        split?.revert()
      }
    },
    { dependencies: [shown.f, shown.a, doAnimate], scope: scopeRef },
  )

  if (!families.length) return null

  return (
    <section className={`ncx-flow ncx-flow--features ${designClasses(d)}`} style={designVars(d)} ref={scopeRef}>
      <style>{flowCss}</style>
      <style>{featuresCss}</style>

      <div className="wrap ncx-container">
        {eyebrow ? (
          <Reveal as="p" from="left" className="sec-eyebrow" motion={motion}>
            {eyebrow}
          </Reveal>
        ) : null}
        <SplitHeading as="h2" motion={motion}>
          {heading}
        </SplitHeading>
        {intro ? (
          <Reveal as="p" className="sec-sub" motion={motion}>
            {intro}
          </Reveal>
        ) : null}

        <div className="lab-box">
          <p className="lab-q">{pickFamilyLabel}</p>
          <div className="trig fam-trig" role="group" aria-label={pickFamilyLabel}>
            {families.map((f, fi) => (
              <button key={f.id} type="button" className="tb" aria-pressed={fi === familyAt} onClick={() => pickFamily(fi)}>
                {fi === familyAt ? (
                  <m.span className="fam-ind" layoutId="ncx-fam-ind" transition={doAnimate ? SPRING : { duration: 0 }} />
                ) : null}
                <span className="fam-label">{f.name}</span>
              </button>
            ))}
          </div>

          <p className="lab-q lab-q--agents">{pickAgentLabel}</p>
          <div className="chips-wrap">
            <AnimatePresence mode="popLayout" custom={dir} initial={false}>
              <m.div
                key={families[familyAt].id}
                className="chips"
                role="group"
                aria-label={`${pickAgentLabel}: ${families[familyAt].name}`}
                custom={dir}
                variants={listVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: doAnimate ? 0.22 : 0 }}
              >
                {families[familyAt].agents.map((a, ai) => (
                  <m.button
                    key={a.id}
                    type="button"
                    className="chip"
                    aria-pressed={ai === agentAt}
                    aria-controls={`ncx-agent-${a.id}`}
                    initial={doAnimate ? { opacity: 0 } : false}
                    animate={{ opacity: 1 }}
                    transition={{ duration: doAnimate ? 0.3 : 0, delay: doAnimate ? ai * 0.03 : 0 }}
                    onClick={() => pickAgent(ai)}
                  >
                    {a.name}
                    {a.pilot ? <span className="pilot">Pilot</span> : null}
                  </m.button>
                ))}
              </m.div>
            </AnimatePresence>
          </div>

          <m.div className="stage-outer" layout transition={{ duration: doAnimate ? 0.3 : 0, ease: [0.22, 1, 0.36, 1] }}>
            {families.map((f, fi) =>
              f.agents.map((a, ai) => {
                const isShown = fi === shown.f && ai === shown.a
                const fading = isShown && leaving
                const active = isShown && !leaving
                // Replays the entrance for whichever panel just became
                // active; never on the very first render, which the server
                // HTML already shows in its settled state (gen is bumped
                // only once a change has actually happened).
                const replay = doAnimate && isShown && gen > 0
                return (
                  <m.div
                    key={a.id}
                    id={`ncx-agent-${a.id}`}
                    className="stage"
                    role="region"
                    aria-label={a.name}
                    aria-hidden={!active}
                    style={{ position: isShown ? 'relative' : 'absolute', inset: isShown ? undefined : 0, pointerEvents: active ? 'auto' : 'none' }}
                    animate={{ opacity: active ? 1 : 0, x: fading ? -14 * dir : 0 }}
                    transition={{ duration: doAnimate ? 0.16 : 0 }}
                    onAnimationComplete={() => {
                      if (!isShown || !leaving || !pending.current) return
                      setShown(pending.current)
                      pending.current = null
                      setLeaving(false)
                      setGen((g) => g + 1)
                    }}
                  >
                    {d.lineStyle === 'animated' && isShown ? <StageLine lineStyle="animated" playKey={a.id} /> : null}
                    <div className="node on" style={accentVars(d.accents[0])}>
                      <span className="tag">{d.stageLabels[0]}</span>
                      <b
                        ref={(el) => {
                          nameRefs.current[a.id] = el
                        }}
                      >
                        {a.name}
                      </b>
                      {a.summary ? <small>{a.summary}</small> : null}
                      {a.channels.length ? (
                        <div className="hch">
                          {a.channels.map((c) => (
                            <span key={c}>{c}</span>
                          ))}
                        </div>
                      ) : null}
                    </div>

                    <div className="node on" style={accentVars(d.accents[1])}>
                      <span className="tag">{d.stageLabels[1]}</span>
                      {a.keyPoints.length ? (
                        <ul className="feat" key={isShown ? `feat-${gen}` : 'feat'}>
                          {a.keyPoints.map((line, i) => (
                            <m.li
                              key={i}
                              initial={replay ? { opacity: 0, x: -16 } : false}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ ...SPRING, delay: replay ? 0.1 + i * 0.07 : 0 }}
                            >
                              <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
                                <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              <span>{line}</span>
                            </m.li>
                          ))}
                        </ul>
                      ) : null}
                      <div className="hch hch--handlers" key={isShown ? `hdl-${gen}` : 'hdl'}>
                        <m.span
                          className="on"
                          initial={replay ? { opacity: 0, scale: 0.6 } : false}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ stiffness: 500, damping: 20, type: 'spring' as const, delay: replay ? 0.15 : 0 }}
                        >
                          {d.handlerLabels.agent}
                        </m.span>
                        {a.humanTeam ? (
                          <m.span
                            className="on"
                            initial={replay ? { opacity: 0, scale: 0.6 } : false}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ stiffness: 500, damping: 20, type: 'spring' as const, delay: replay ? 0.23 : 0 }}
                          >
                            {d.handlerLabels.human}
                          </m.span>
                        ) : null}
                      </div>
                    </div>

                    <div className="node ok on" style={accentVars(d.accents[2])}>
                      <span className="tag">{d.stageLabels[2]}</span>
                      {a.records ? (
                        <div className="saves">
                          <svg className="saves-ic" width="46" height="30" viewBox="0 0 64 36" aria-hidden="true" style={{ overflow: 'visible' }}>
                            <circle
                              className="pkt"
                              ref={(el) => {
                                packetRefs.current[a.id] = el
                              }}
                              r={6}
                              cx={2}
                              cy={12}
                              opacity={0}
                            />
                            <g
                              ref={(el) => {
                                dbRefs.current[a.id] = el
                              }}
                            >
                              <path d="M38 9v18c0 2.2 5.4 4 12 4s12-1.8 12-4V9" fill="var(--ncx-white)" stroke="var(--ncx-navy)" strokeWidth="1.8" />
                              <ellipse cx={50} cy={9} rx={12} ry={4} fill="var(--ncx-white)" stroke="var(--ncx-navy)" strokeWidth="1.8" />
                              <path d="M38 18c0 2.2 5.4 4 12 4s12-1.8 12-4" fill="none" stroke="var(--ncx-navy)" strokeWidth="1.4" />
                            </g>
                          </svg>
                          <small>{a.records}</small>
                        </div>
                      ) : null}
                      {a.teamControls ? (
                        <small className="you-set">
                          <strong>You set:</strong> {a.teamControls}
                        </small>
                      ) : null}
                    </div>
                  </m.div>
                )
              }),
            )}
          </m.div>
        </div>
      </div>
    </section>
  )
}
