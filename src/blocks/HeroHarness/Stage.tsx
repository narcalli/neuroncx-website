'use client'

import React, { useCallback, useEffect, useId, useLayoutEffect, useMemo, useRef, useState } from 'react'

import type { MotionSetting } from '@/motion/levels'
import { useLoopWhileVisible } from '@/motion/useLoopWhileVisible'
import { useMotionLevel } from '@/motion/useMotionLevel'

import { HarnessDrawing } from './Drawing'
import { buildDrawing, layoutFor, monoMeasure, type HarnessLabels, type Layout, type Measure, type Part } from './geometry'
import { HarnessLoop } from './loop'

export type HarnessCard = { title: string; body: string; highlights: Part[] }

/** The caption's name for each part: the drawing's own label, or the block's caption names for the actions and the loop. */
export const partNames = (labels: HarnessLabels): Record<Part, string> => ({
  trigger: labels.triggerLabel,
  boundary: labels.boundaryLabel,
  ontology: labels.ontologyLabel,
  policy: labels.policyLabel,
  guardrails: labels.guardrailsLabel,
  orchestration: labels.orchestrationLabel,
  actions: labels.actionsName,
  handover: labels.handoverLabel,
  customer360: labels.customer360Label,
  loop: labels.loopName,
})

/** Every text the browser measures once fonts load: the chips (both sizes) and the loop label's lines. */
const measured = (labels: HarnessLabels): { cls: 'chip-t' | 'loop-t'; size: number; text: string }[] => {
  const chips = [...labels.ontologyItems, ...labels.customer360Fields]
  const words = labels.loopLabel.trim().split(/\s+/)
  const half = Math.ceil(words.length / 2)
  const loop = [labels.loopLabel.trim(), words.slice(0, half).join(' '), words.slice(half).join(' ')]
  return [
    ...chips.flatMap((text) => [10.5, 10].map((size) => ({ cls: 'chip-t' as const, size, text }))),
    ...loop.filter(Boolean).map((text) => ({ cls: 'loop-t' as const, size: 10.5, text })),
  ]
}

const keyOf = (cls: string, size: number, text: string) => `${cls}|${size}|${text}`

/** The Speed switch: every duration of the loop is multiplied by this. */
export const PACE = { slower: 1.4, normal: 1, faster: 0.75 } as const

export type StatusMode = 'row' | 'corner' | 'wide'

/** Where the status line goes: above a portrait drawing, in the corner of a mid-size one, above a wide one. */
export const statusModeFor = (layout: Layout, panelWidth: number): StatusMode =>
  layout === 'portrait' ? 'row' : panelWidth > 800 ? 'wide' : 'corner'

/** The BYOC box's left edge in the landscape drawing (x of 760). */
export const BYOC_LEFT = 160

/** The status line's words while the dots do not run. */
export const STILL_STATUS = { reduced: 'Reduced motion: highlights only', off: 'Still view' } as const

/**
 * The cards and the drawing. The cards follow the WAI-ARIA tabs pattern, as
 * Record anatomy's do: a tablist, roving focus, the arrow keys (Up and Down
 * in the column, Left and Right in the phone row), Home and End; Enter or
 * Space selects. The drawing panel is the tabpanel. Each card's explanation
 * is in the server HTML, hidden on the card and shown under the drawing
 * while it is selected.
 *
 * Both layouts of the drawing are in the HTML; the drawing's own width picks
 * one (ResizeObserver, with a container query until the page is
 * interactive). Chip widths start from the font's fixed letter width and
 * are measured once fonts have loaded.
 *
 * Motion, by level (useMotionLevel):
 * - on: the cards take turns (autoplay), with a progress line on the
 *   selected one, and the live loop runs on the drawing (loop.ts) while it
 *   is on screen;
 * - reduced: the cards still take turns and the highlights fade, but no
 *   dots, glows or flashes;
 * - off: no card is selected and nothing moves; a click still lights its
 *   parts, at once.
 * Autoplay pauses while the pointer is over the cards or drawing, while
 * keyboard focus is inside them, off screen and in a hidden tab, and stops
 * for good once a visitor selects a card.
 */
export const HarnessStage: React.FC<{
  cards: HarnessCard[]
  cardsPosition: 'left' | 'above'
  labels: HarnessLabels
  showStatus: boolean
  showCaption: boolean
  description: string
  motion?: MotionSetting | null
  autoplay: boolean
  loop: boolean
  speed: keyof typeof PACE
  autoplaySeconds: number
}> = ({ cards, cardsPosition, labels, showStatus, showCaption, description, motion, autoplay, loop, speed, autoplaySeconds }) => {
  const uid = useId()
  const level = useMotionLevel(motion)
  const [active, setActive] = useState(() => (level === 'off' ? -1 : 0))
  const [focusable, setFocusable] = useState(0)
  // A visitor selected a card: autoplay stops for the rest of the visit.
  const [stopped, setStopped] = useState(false)
  const stage = useRef<HTMLDivElement>(null)
  const cardsBox = useRef<HTMLDivElement>(null)
  const statusText = useRef<HTMLSpanElement>(null)
  const [layout, setLayout] = useState<Layout | null>(null)
  const [widths, setWidths] = useState<Map<string, number> | null>(null)
  const tabs = useRef<(HTMLButtonElement | null)[]>([])
  const dwrap = useRef<HTMLDivElement>(null)
  const measureSvg = useRef<SVGSVGElement>(null)

  /* The drawing's own width picks the layout; the panel's picks where the
     status line goes: a row above a portrait drawing, the drawing's empty
     top-left corner on mid-size panels, a row above the drawing on panels
     over 800px wide, lined up with the BYOC box. */
  const [statusMode, setStatusMode] = useState<StatusMode | null>(null)
  const [drawWidth, setDrawWidth] = useState(0)
  const drawBox = useRef<HTMLDivElement>(null)
  useEffect(() => {
    const el = dwrap.current
    if (!el || typeof ResizeObserver === 'undefined') return
    const panel = el.closest<HTMLElement>('.hh-panel')
    const ro = new ResizeObserver(() => {
      const next = layoutFor(el.clientWidth)
      setLayout(next)
      setStatusMode(statusModeFor(next, panel?.clientWidth ?? 0))
      setDrawWidth(el.clientWidth)
    })
    ro.observe(el)
    return () => ro.disconnect()
  }, [])
  // On wide panels, the status starts where the BYOC box starts: x 160 of the drawing's 760, measured as drawn.
  useLayoutEffect(() => {
    const d = drawBox.current
    if (!d) return
    if (statusMode !== 'wide') {
      d.style.removeProperty('--hh-box-left')
      return
    }
    const svg = d.querySelector<SVGSVGElement>('svg[data-layout="landscape"]')
    const status = d.querySelector<HTMLElement>('.hh-status')
    if (!svg || !status) return
    const sr = svg.getBoundingClientRect()
    const tr = status.getBoundingClientRect()
    d.style.setProperty('--hh-box-left', `${sr.left - tr.left + (sr.width * BYOC_LEFT) / 760}px`)
  }, [statusMode, drawWidth])

  // Once fonts have loaded, measure the chip and loop text for real, then lay out again once.
  const toMeasure = useMemo(() => measured(labels), [labels])
  useEffect(() => {
    let cancelled = false
    const svg = measureSvg.current
    if (!svg) return
    const run = () => {
      if (cancelled) return
      const out = new Map<string, number>()
      for (const m of toMeasure) {
        const t = document.createElementNS('http://www.w3.org/2000/svg', 'text')
        t.setAttribute('class', m.cls)
        t.style.fontSize = `${m.size}px`
        t.textContent = m.text
        svg.appendChild(t)
        out.set(keyOf(m.cls, m.size, m.text), t.getComputedTextLength())
        t.remove()
      }
      setWidths(out)
    }
    if (document.fonts?.ready) document.fonts.ready.then(run)
    else run()
    return () => {
      cancelled = true
    }
  }, [toMeasure])

  const measure: Measure = useMemo(
    () => (text, cls, size) => {
      const w = widths?.get(keyOf(cls, size, text))
      return w && w > 0 ? w : monoMeasure(text, cls, size)
    },
    [widths],
  )
  const landscape = useMemo(() => buildDrawing('landscape', labels, measure), [labels, measure])
  const portrait = useMemo(() => buildDrawing('portrait', labels, measure), [labels, measure])

  const selected = active >= 0 ? cards[active] : undefined
  const lit = selected?.highlights ?? []
  const names = partNames(labels)
  const tabId = (i: number) => `${uid}-tab-${i}`
  const titleId = (i: number) => `${uid}-title-${i}`
  const bodyId = (i: number) => `${uid}-body-${i}`
  const panelId = `${uid}-panel`

  const select = (i: number) => {
    setActive(i)
    setFocusable(i)
    setStopped(true)
  }

  // Off: no card selected until a visitor picks one. Back from off, the first card again.
  useEffect(() => {
    if (stopped) return
    if (level === 'off') setActive(-1)
    else setActive((a) => (a < 0 ? 0 : a))
  }, [level, stopped])

  /* Autoplay: the selected card moves on every autoplaySeconds, its progress
     line showing the time left. Frames run only while it can advance. */
  const paused = useRef({ hover: false, focus: false, offscreen: false })
  const resync = useRef<() => void>(() => {})
  useEffect(() => {
    const el = stage.current
    if (!el) return
    const set = (key: 'hover' | 'focus' | 'offscreen', on: boolean) => {
      paused.current[key] = on
      resync.current()
    }
    const enter = () => set('hover', true)
    const leave = () => set('hover', false)
    const focusIn = () => set('focus', true)
    const focusOut = (e: FocusEvent) => {
      if (!el.contains(e.relatedTarget as Node | null)) set('focus', false)
    }
    const visibility = () => resync.current()
    el.addEventListener('mouseenter', enter)
    el.addEventListener('mouseleave', leave)
    el.addEventListener('focusin', focusIn)
    el.addEventListener('focusout', focusOut)
    document.addEventListener('visibilitychange', visibility)
    const io =
      typeof IntersectionObserver === 'undefined'
        ? null
        : new IntersectionObserver((entries) => set('offscreen', !entries.some((x) => x.isIntersecting)), { threshold: 0.15 })
    io?.observe(el)
    return () => {
      el.removeEventListener('mouseenter', enter)
      el.removeEventListener('mouseleave', leave)
      el.removeEventListener('focusin', focusIn)
      el.removeEventListener('focusout', focusOut)
      document.removeEventListener('visibilitychange', visibility)
      io?.disconnect()
    }
  }, [])

  /** Scrolls the phone row of cards to a card, without moving the page. */
  const showCard = useCallback(
    (i: number) => {
      const row = cardsBox.current
      const card = tabs.current[i]
      if (!row || !card || row.scrollWidth <= row.clientWidth + 4) return
      const left = row.scrollLeft + card.getBoundingClientRect().left - row.getBoundingClientRect().left
      row.scrollTo({ left, behavior: level === 'on' ? 'smooth' : 'auto' })
    },
    [level],
  )

  useEffect(() => {
    const prog = active >= 0 ? tabs.current[active]?.querySelector<HTMLElement>('.hh-card-prog') : null
    const runs = autoplay && !stopped && level !== 'off' && cards.length > 1 && active >= 0
    if (!runs || !prog) {
      resync.current = () => {}
      return
    }
    const duration = Math.max(1, autoplaySeconds) * 1000
    let elapsed = 0
    let frame = 0
    let last = 0
    const free = () => !paused.current.hover && !paused.current.focus && !paused.current.offscreen && !document.hidden
    const tick = (now: number) => {
      elapsed += Math.min(now - last, 100)
      last = now
      prog.style.transform = `scaleX(${Math.min(1, elapsed / duration)})`
      if (elapsed >= duration) {
        frame = 0
        const next = (active + 1) % cards.length
        setActive(next)
        setFocusable(next)
        showCard(next)
        return
      }
      frame = requestAnimationFrame(tick)
    }
    const sync = () => {
      if (free() && !frame) {
        last = performance.now()
        frame = requestAnimationFrame(tick)
      } else if (!free() && frame) {
        cancelAnimationFrame(frame)
        frame = 0
      }
    }
    resync.current = sync
    sync()
    return () => {
      cancelAnimationFrame(frame)
      resync.current = () => {}
      prog.style.transform = ''
    }
  }, [active, autoplay, stopped, level, cards.length, autoplaySeconds, showCard])

  /* The live loop, at level on only, on the layout being shown. */
  const events = labels.triggerEvents
  const actions = labels.actions
  const fields = labels.customer360Fields
  const [harness, setHarness] = useState<HarnessLoop | null>(null)
  useEffect(() => {
    const svg = layout ? dwrap.current?.querySelector<SVGSVGElement>(`svg[data-layout="${layout}"]`) : null
    if (level !== 'on' || !svg) {
      setHarness(null)
      return
    }
    const write = (step: string, detail: string) => {
      const el = statusText.current
      if (!el) return
      const b = document.createElement('b')
      b.textContent = step
      const sep = document.createElement('span')
      sep.className = 'hh-sep'
      sep.textContent = ' · '
      const d = document.createElement('span')
      d.textContent = detail
      el.replaceChildren(b, sep, d)
    }
    const run = new HarnessLoop(svg, { events, actions, fields }, { pace: PACE[speed] ?? 1, repeat: loop, status: write })
    setHarness(run)
    return () => {
      run.destroy()
      statusText.current?.replaceChildren()
    }
  }, [level, layout, landscape, portrait, events, actions, fields, speed, loop])
  useLoopWhileVisible(stage, harness, motion)

  const onKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    const current = tabs.current.findIndex((t) => t === document.activeElement)
    if (current < 0) return
    const last = cards.length - 1
    const next =
      e.key === 'ArrowDown' || e.key === 'ArrowRight'
        ? current === last
          ? 0
          : current + 1
        : e.key === 'ArrowUp' || e.key === 'ArrowLeft'
          ? current === 0
            ? last
            : current - 1
          : e.key === 'Home'
            ? 0
            : e.key === 'End'
              ? last
              : null
    if (next === null) return
    e.preventDefault()
    setFocusable(next)
    tabs.current[next]?.focus()
  }

  return (
    <div
      ref={stage}
      className="hh-stage"
      data-cards={cardsPosition}
      data-level={level}
      style={{ '--hh-cards': cards.length } as React.CSSProperties}
    >
      <div
        ref={cardsBox}
        className="hh-cards"
        role="tablist"
        aria-label="What the harness does"
        aria-orientation={cardsPosition === 'above' ? 'horizontal' : 'vertical'}
        onKeyDown={onKeyDown}
      >
        {cards.map((c, i) => (
          <button
            key={i}
            ref={(el) => {
              tabs.current[i] = el
            }}
            type="button"
            role="tab"
            className="hh-card"
            id={tabId(i)}
            aria-selected={i === active}
            aria-controls={panelId}
            aria-labelledby={titleId(i)}
            aria-describedby={c.body ? bodyId(i) : undefined}
            tabIndex={i === focusable ? 0 : -1}
            onClick={() => select(i)}
          >
            <span className="hh-card-top">
              <span className="hh-card-dot" aria-hidden="true" />
              <span className="hh-card-title" id={titleId(i)}>
                {c.title}
              </span>
            </span>
            {c.body ? (
              <span className="hh-sr" id={bodyId(i)}>
                {c.body}
              </span>
            ) : null}
            <span className="hh-card-prog" aria-hidden="true" />
          </button>
        ))}
      </div>

      {/* Named by the selected card's title alone; the card's own text also holds its hidden explanation.
          It holds nothing focusable, so it takes the focus stop itself, as Record anatomy's panels do. */}
      <div className="hh-panel" id={panelId} role="tabpanel" aria-labelledby={titleId(active >= 0 ? active : 0)} tabIndex={0}>
        <div className="hh-draw" ref={drawBox} data-layout={layout ?? undefined} data-status={statusMode ?? undefined}>
          {showStatus ? (
            <div className="hh-status">
              <span className="hh-live">
                <i aria-hidden="true" data-loop="" />
                Live loop
              </span>
              {/* Not live for screen readers: it changes every second or so; the drawing's description covers it. */}
              {level === 'on' ? null : <span className="hh-status-text">{STILL_STATUS[level]}</span>}
              <span className="hh-status-text" ref={statusText} />
            </div>
          ) : null}
          <div className="hh-dwrap" ref={dwrap}>
            <HarnessDrawing drawing={landscape} lit={lit} label={description} hidden={layout === 'portrait'} />
            <HarnessDrawing drawing={portrait} lit={lit} label={description} hidden={layout === 'landscape'} />
          </div>
        </div>
        {showCaption ? (
          // Every caption sits in the same cell, only the selected one visible, so the
          // panel is as tall as the longest one and never jumps when the card changes.
          <div className="hh-caption">
            <div className="hh-cap" data-on={active < 0 ? '' : undefined}>
              <p className="hh-cap-body">Select a card to highlight that part of the harness.</p>
            </div>
            {cards.map((c, i) => (
              <div key={i} className="hh-cap" data-on={i === active ? '' : undefined}>
                {c.body ? <p className="hh-cap-body">{c.body}</p> : null}
                {c.highlights.length ? (
                  <ul className="hh-cap-tags">
                    {c.highlights.includes('boundary') ? (
                      <li>Highlighted: everything inside the dashed line</li>
                    ) : (
                      <>
                        <li>Highlighted:</li>
                        {c.highlights.map((p) => (
                          <li key={p} className="hh-tag">
                            {names[p]}
                          </li>
                        ))}
                      </>
                    )}
                  </ul>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}
        <svg className="hh-svg hh-measure" ref={measureSvg} aria-hidden="true" />
      </div>
    </div>
  )
}
