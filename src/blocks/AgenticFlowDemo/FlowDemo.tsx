'use client'

import Link from 'next/link'
import React, { useEffect, useRef, useState } from 'react'

import type { AgenticFlowDemoBlock as AgenticFlowDemoProps } from '@/payload-types'

import { accentVars, designClasses, designVars, nextEvent, type Design } from './design'
import { StageLine } from './StageLine'
import { flowCss } from './styles'

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
    design: Design
    /** By event id. */
    links?: Record<string, EventLink>
  }
> = ({ eyebrow, heading, intro, events, footnote, design: d, links = {} }) => {
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
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    timer.current = window.setInterval(() => {
      setActive((i) => nextEvent(i, list.length))
      setPlays((n) => n + 1)
    }, d.autoplay * 1000)
    return () => {
      if (timer.current) window.clearInterval(timer.current)
    }
  }, [d.autoplay, touched, list.length])

  if (!list.length) return null

  const link = ev?.id ? links[ev.id] : undefined
  const [first, second, third] = d.stageLabels

  return (
    <section className={`ncx-flow ${designClasses(d)}`} style={designVars(d)}>
      <style>{flowCss}</style>

      <div className="wrap ncx-container">
        {eyebrow ? <p className="sec-eyebrow">{eyebrow}</p> : null}
        <h2>{heading}</h2>
        {intro ? <p className="sec-sub">{intro}</p> : null}

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

          <div className="stage">
            <StageLine lineStyle={d.lineStyle} playKey={plays} onProgress={setProgress} />

            <div className={`node n-trig on`} style={accentVars(d.accents[0])}>
              <span className="tag">{first}</span>
              <b>{ev?.triggerTitle}</b>
              <small>{ev?.triggerText}</small>
            </div>

            <div className={`node n-route${routeOn ? ' on' : ''}`} style={accentVars(d.accents[1])}>
              <span className="tag">{second}</span>
              <div className="hch">
                {HANDLERS.map((h) => (
                  <span key={h} className={routeOn && (ev?.handlers || []).includes(h) ? 'on' : ''}>
                    {d.handlerLabels[h]}
                  </span>
                ))}
              </div>
              <small>{ev?.routeText}</small>
            </div>

            <div className={`node n-res ok${resolveOn ? ' on' : ''}`} style={accentVars(d.accents[2])}>
              <span className="tag">{third}</span>
              <b>{ev?.resolveTitle}</b>
              <small>{ev?.resolveText}</small>
            </div>
          </div>

          {link ? (
            <div className="stage-foot">
              {isExternal(link.href) || link.newTab ? (
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
