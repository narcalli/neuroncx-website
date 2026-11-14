'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

import type { AgenticFlowDemoBlock as AgenticFlowDemoProps } from '@/payload-types'

import { accentVars, designClasses, designVars, nextEvent, type Design } from './design'
import { StageLine } from './StageLine'
import { tallest, useMeasured } from './useMeasured'
import { flowCss } from './styles'
import { useMotionLevel } from '@/motion/useMotionLevel'
import { SplitHeading } from '@/motion/SplitHeading'
import { Reveal } from '@/motion/Reveal'

type DemoEvent = NonNullable<AgenticFlowDemoProps['events']>[number]

const HANDLERS = ['agent', 'human'] as const

/** An event's link under the resolve card, resolved on the server. */
export type EventLink = { label: string; href: string; newTab: boolean }

const isExternal = (href: string) => /^https?:\/\//.test(href)

/**
 * Flow mode: an event travels through trigger, route and resolve. The Design
 * tab (design.ts) sets the labels, colours, line, buttons and panel; with
 * nothing set it draws as it always has. Autoplay moves to the next event on
 * a timer until a visitor clicks a button, and never runs for visitors who
 * ask for reduced motion.
 */
export const FlowDemo: React.FC<
  Pick<AgenticFlowDemoProps, 'heading' | 'intro' | 'events' | 'footnote'> & {
    /** The small line above the heading (an industry topic's agents section). */
    eyebrow?: string | null
    /** The block's Motion panel: anything but on (with the page and site) stops the autoplay. */
    motion?: AgenticFlowDemoProps['motion']
    design: Design
    /** By event id. */
    links?: Record<string, EventLink>
  }
> = ({ eyebrow, heading, intro, events, footnote, design: d, links = {}, motion }) => {
  const level = useMotionLevel(motion)
  const list: DemoEvent[] = (events || []).filter((e) => e && e.label)

  const [active, setActive] = useState(d.startIndex < list.length ? d.startIndex : 0)
  const [plays, setPlays] = useState(0)
  const [progress, setProgress] = useState(1)
  // Set once a visitor clicks: autoplay stops for good.
  const [touched, setTouched] = useState(false)
  const timer = useRef<number | null>(null)

  const ev: DemoEvent | undefined = list[active] ?? list[0]
  const p = d.lineStyle === 'animated' ? progress : 1
  const routeOn = p >= 0.5
  const resolveOn = p >= 0.995

  useEffect(() => {
    if (!d.autoplay || touched || list.length < 2) return
    if (level !== 'on') return
    timer.current = window.setInterval(() => {
      setActive((i) => nextEvent(i, list.length))
      setPlays((n) => n + 1)
    }, d.autoplay * 1000)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [d.autoplay, touched, list.length, level])

  // The stage keeps the height of its tallest event, so nothing below it moves as
  // events change (route points can differ in number). Each event's cards are laid
  // out once, hidden, while measuring (useMeasured).
  const ghosts = useRef<HTMLDivElement>(null)
  const { value: stageMin, measuring } = useMeasured(list.length > 1, () => tallest(ghosts.current?.children), [list.length])

  if (!list.length) return null

  const link = ev?.id ? links[ev.id] : undefined
  // The link row stays while any event has a link, so the block keeps its height across events.
  const anyLink = list.some((e) => e.id && links[e.id])
  const [first, second, third] = d.stageLabels

  // One event's three cards: on the stage, and hidden while the stage height is measured.
  const cards = (e: DemoEvent | undefined, routeOn: boolean, resolveOn: boolean) => {
    // Ticks under the route text. No animation: the line is measured from the cards' heights.
    const points = (e?.routePoints ?? []).map((p) => p?.line?.trim()).filter((l): l is string => Boolean(l))
    return (
      <>
        <div className={`node n-trig on`} style={accentVars(d.accents[0])}>
          <span className="tag">{first}</span>
          <b>{e?.triggerTitle}</b>
          <small>{e?.triggerText}</small>
        </div>

        <div className={`node n-route${routeOn ? ' on' : ''}`} style={accentVars(d.accents[1])}>
          <span className="tag">{second}</span>
          <div className="hch">
            {HANDLERS.map((h) => (
              <span key={h} className={routeOn && (e?.handlers || []).includes(h) ? 'on' : ''}>
                {d.handlerLabels[h]}
              </span>
            ))}
          </div>
          <small>{e?.routeText}</small>
          {points.length ? (
            <ul className="pts">
              {points.map((line, i) => (
                <li key={i}>
                  <svg viewBox="0 0 16 16" width="16" height="16" fill="none" aria-hidden="true">
                    <path d="M3.5 8.5 6.5 11.5 12.5 4.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span>{line}</span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>

        <div className={`node n-res ok${resolveOn ? ' on' : ''}`} style={accentVars(d.accents[2])}>
          <span className="tag">{third}</span>
          <b>{e?.resolveTitle}</b>
          <small>{e?.resolveText}</small>
        </div>
      </>
    )
  }

  return (
    <section className={`ncx-flow ${designClasses(d)}`} style={designVars(d)}>
      <style>{flowCss}</style>

      <div className="wrap ncx-container">
        {eyebrow ? <Reveal as="p" from="left" className="sec-eyebrow">{eyebrow}</Reveal> : null}
        <SplitHeading as="h2">{heading}</SplitHeading>
        {intro ? <Reveal as="p" className="sec-sub">{intro}</Reveal> : null}

        <div className="lab-box">
          {d.prompt ? <p className="lab-q">{d.prompt}</p> : null}
          <div className="trig" role="group" aria-label={d.prompt || 'Pick an event'}>
            {list.map((e, i) => (
              <button
                key={i}
                type="button"
                className="tb"
                aria-pressed={i === active}
                onClick={() => {
                  setTouched(true)
                  setActive(i)
                  setPlays((n) => n + 1)
                }}
              >
                {e.label}
              </button>
            ))}
          </div>

          <div className="stage" style={stageMin ? { minHeight: stageMin } : undefined}>
            <StageLine lineStyle={d.lineStyle} playKey={plays} onProgress={setProgress} remeasure={stageMin} />

            {cards(ev, routeOn, resolveOn)}

            {measuring ? (
              <div className="stage-ghosts" ref={ghosts} aria-hidden="true">
                {list.map((e, i) => (
                  <div key={i} className="stage">
                    {cards(e, true, true)}
                  </div>
                ))}
              </div>
            ) : null}
          </div>

          {anyLink ? (
            <div className="stage-foot">
              {!link ? (
                <span className="ev-link ev-link--none" aria-hidden="true">
                  &nbsp;
                </span>
              ) : isExternal(link.href) || link.newTab ? (
                <a
                  className="ev-link"
                  href={link.href}
                  {...(link.newTab ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                >
                  {link.label} &rarr;
                </a>
              ) : (
                <Link className="ev-link" href={link.href}>
                  {link.label} &rarr;
                </Link>
              )}
            </div>
          ) : null}

          {d.showFootnote && footnote ? <p className="note">{footnote}</p> : null}
        </div>
      </div>
    </section>
  )
}
