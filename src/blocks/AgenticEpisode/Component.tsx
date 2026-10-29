'use client'

import React, { useLayoutEffect, useMemo, useRef } from 'react'

import type { AgenticEpisodeBlock as AgenticEpisodeProps } from '@/payload-types'

import { edgeLabelWidth, timeline } from './geometry'
import { gsap, useGSAP } from '@/motion/gsap'
import { arc, controlThrough } from '@/motion/arc'
import { isPastStart, onceInView } from '@/motion/useOnceInView'
import { SplitHeading } from '@/motion/SplitHeading'
import { useMotionLevel } from '@/motion/useMotionLevel'

type Point = NonNullable<AgenticEpisodeProps['points']>[number]

const SPEED_SCALE: Record<string, number> = { slower: 1.3, normal: 1, faster: 0.7 }
const HOLD = 0.75
const INITIAL_HOLD = 0.7
const BRANCH_RAISE = 46

type Pos = { x: number; y: number }

/** An element's centre, relative to `container`'s own box. */
const centerOf = (el: Element, container: Element): Pos => {
  const r = el.getBoundingClientRect()
  const b = container.getBoundingClientRect()
  return { x: r.left - b.left + r.width / 2, y: r.top - b.top + r.height / 2 }
}

/**
 * A callback ref into `store.current[i]`, with a stable identity per index.
 * An inline `(el) => { store.current[i] = el }` is a new function every
 * render, so React detaches and reattaches it on each one; with GSAP's own
 * cleanup landing in that same window, it can read a momentarily null ref.
 */
const indexedRefs = <T,>(store: React.RefObject<(T | null)[]>) => {
  const cache: ((el: T | null) => void)[] = []
  return (i: number): ((el: T | null) => void) => {
    cache[i] ??= (el) => {
      store.current[i] = el
    }
    return cache[i]
  }
}

/**
 * The episode timeline: a bar from the episode's start to its end, with its
 * points, and a panel for the point in focus.
 *
 * From 760px up the bar runs across, inset from the panel edges so the first
 * and last points have room for their labels (geometry.ts). Labels sit under
 * their points on one top line, at most two lines each, and never touch:
 * middle labels are centred, the first and last line up with the outer edge
 * of their point. Below 760px it runs down the left side, each point with
 * its label and caption beside it.
 *
 * The server HTML (and motion off, or reduced) is the finished episode:
 * every point done, the bar filled, the last point's text in the panel. At
 * level on, a GSAP timeline (one label per point, "s0".."sN") resets it and
 * plays once it is in view: a packet travels the bar, the fill grows behind
 * it, each node pops as it arrives, and the panel swaps with it. A point
 * marked as a branch sits raised above the line on a dashed arc, which the
 * packet follows in and out of (motion/arc.ts) on desktop; the arc turns
 * crimson once reached. Clicking a point scrubs the timeline to it,
 * forwards or backwards; with motion off or reduced it only changes the
 * panel. Replay restarts the timeline. The packet's positions are
 * remeasured on resize, keeping the current point.
 */
export const AgenticEpisodeBlock: React.FC<AgenticEpisodeProps> = ({
  heading,
  intro,
  startLabel,
  endLabel,
  points,
  closing,
  motion,
  autoplay,
  speed,
}) => {
  const level = useMotionLevel(motion)
  const doLoad = level === 'on' && autoplay !== false
  const doFade = level === 'reduced' && autoplay !== false
  const sp = SPEED_SCALE[speed || 'normal'] ?? 1

  const list: Point[] = (points || []).filter((p) => p && p.label)
  const paras = (intro || []).filter((p) => p && p.text)
  const count = list.length
  const last = count - 1
  const hasBranch = list.some((p) => p.isBranch)
  const labelKey = list.map((p) => `${p.label}|${p.isBranch ? 1 : 0}`).join('|')

  const sectionRef = useRef<HTMLDivElement>(null)
  const tlRef = useRef<HTMLDivElement>(null)
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])
  const dotRefs = useRef<(HTMLElement | null)[]>([])
  const arcRefs = useRef<(HTMLElement | null)[]>([])
  const fillRef = useRef<HTMLElement>(null)
  const packetRef = useRef<HTMLSpanElement>(null)
  const panelTitleRef = useRef<HTMLElement>(null)
  const panelBodyRef = useRef<HTMLElement>(null)
  const timelineRef = useRef<gsap.core.Timeline | null>(null)
  const scrubRef = useRef<gsap.core.Tween | null>(null)
  const shownRef = useRef(count - 1)
  // indexedRefs only reads these refs inside the callbacks it returns, never
  // during this call itself; react-hooks/refs cannot see that distinction.
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/refs
  const itemRef = useMemo(() => indexedRefs(itemRefs), [])
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/refs
  const dotRef = useMemo(() => indexedRefs(dotRefs), [])
  // eslint-disable-next-line react-hooks/exhaustive-deps, react-hooks/refs
  const arcRef = useMemo(() => indexedRefs(arcRefs), [])

  // Writes the current point's title and text into the panel, without React state.
  const showPanel = (k: number) => {
    const p = list[k]
    if (!p) return
    if (panelTitleRef.current) panelTitleRef.current.textContent = p.label
    if (panelBodyRef.current) panelBodyRef.current.textContent = p.caption || ''
  }

  // The classes (done, arc reached) and the panel, for having reached point k.
  const applyStep = (k: number) => {
    shownRef.current = k
    itemRefs.current.forEach((li, i) => li?.classList.toggle('done', i <= k))
    arcRefs.current.forEach((arc, i) => arc && list[i]?.isBranch && arc.classList.toggle('on', i <= k))
    showPanel(k)
  }

  // One GSAP timeline, labelled "s0".."sN": the packet travels point to
  // point while the fill grows behind it (motion/arc.ts into and out of a
  // branch point), each node pops as it arrives, and a single onUpdate
  // works out which point was last reached, for the classes and the panel.
  const buildTimeline = (vertical: boolean): gsap.core.Timeline | null => {
    const wrap = tlRef.current
    const fill = fillRef.current
    const packet = packetRef.current
    const dots = dotRefs.current.slice(0, count)
    if (!wrap || !fill || !packet || count < 2 || dots.some((d) => !d)) return null
    const P = dots.map((d) => centerOf(d as HTMLElement, wrap))

    const t = gsap.timeline({ paused: true })
    t.set(fill, vertical ? { scaleY: 0 } : { scaleX: 0 }, 0)
    t.set(packet, { x: P[0].x, y: P[0].y, opacity: 0 }, 0)
    t.addLabel('s0', 0)
    t.to(packet, { opacity: 1, scale: 1, duration: 0.3 * sp, startAt: { scale: 0.3 } }, 0)
    t.fromTo(dots[0], { scale: 1 }, { scale: 1.25, duration: 0.15 * sp, yoyo: true, repeat: 1, ease: 'power2.out' }, 0.05)
    t.to({}, { duration: INITIAL_HOLD * sp })

    for (let i = 1; i < count; i++) {
      const dur = 0.75 * sp
      const branching = !vertical && (list[i]?.isBranch || list[i - 1]?.isBranch)
      if (branching) {
        // Up onto (or down off) the branch arc: through a point level with the raised node, halfway along.
        const via = { x: (P[i - 1].x + P[i].x) / 2, y: list[i]?.isBranch ? P[i].y : P[i - 1].y }
        t.add(arc(packet, [P[i - 1], controlThrough(P[i - 1], via, P[i]), P[i]], { duration: dur, ease: 'power2.inOut' }))
      } else {
        t.to(packet, { x: P[i].x, y: P[i].y, duration: dur, ease: 'power2.inOut' })
      }
      t.to(fill, vertical ? { scaleY: i / last, duration: dur, ease: 'power2.inOut' } : { scaleX: i / last, duration: dur, ease: 'power2.inOut' }, '<')
      t.addLabel(`s${i}`)
      t.fromTo(dots[i], { scale: 1 }, { scale: 1.3, duration: 0.14 * sp, yoyo: true, repeat: 1, ease: 'power2.out' }, `s${i}`)
      t.to({}, { duration: HOLD * sp })
    }

    const labelTimes = Array.from({ length: count }, (_, i) => t.labels[`s${i}`] ?? 0)
    let shown = -1
    t.eventCallback('onUpdate', () => {
      const tt = t.time() + 0.001
      let k = 0
      labelTimes.forEach((lt, i) => {
        if (tt >= lt) k = i
      })
      if (k !== shown) {
        shown = k
        applyStep(k)
      }
    })
    return t
  }

  const isVertical = (): boolean => (itemRefs.current[0] ? getComputedStyle(itemRefs.current[0]!).position !== 'absolute' : false)

  useGSAP(
    () => {
      const section = sectionRef.current
      if (!section || count < 2) return

      if (doFade) {
        if (isPastStart(section)) return
        gsap.set(section, { opacity: 0 })
        const stop = onceInView(section, () => gsap.to(section, { opacity: 1, duration: 0.5 }))
        return () => {
          stop()
          gsap.set(section, { clearProps: 'opacity' })
        }
      }
      if (!doLoad) return

      const t = buildTimeline(isVertical())
      if (!t) return
      timelineRef.current = t
      t.progress(1)

      if (isPastStart(section)) {
        return () => {
          scrubRef.current?.kill()
          scrubRef.current = null
          timelineRef.current?.kill()
          timelineRef.current = null
        }
      }

      // Its own tweens at time 0 (fill unfilled, packet at the first point and
      // invisible) render through the same onUpdate that drives the classes
      // and the panel, so resetting is just seeking back to the start.
      t.progress(0)

      // The current timeline, not `t`: a resize before the block comes into
      // view rebuilds it (below) with the new positions.
      const stop = onceInView(section, () => timelineRef.current?.restart())
      return () => {
        stop()
        scrubRef.current?.kill()
        scrubRef.current = null
        // A rebuilt timeline was made outside this context, so it is not
        // reverted with it: kill it by hand along with the first.
        timelineRef.current?.kill()
        t.kill()
        timelineRef.current = null
        // The visitor's reduced-motion preference resolves after the first
        // client render (useSyncExternalStore's server snapshot is always
        // "on"), so this can tear down a level-on run already in its pulled
        // back start state. Leave the finished state behind, same as the
        // server HTML, rather than whatever point the entrance reached.
        applyStep(last)
        gsap.set(packetRef.current, { opacity: 0, clearProps: 'x,y' })
        gsap.set(fillRef.current, { clearProps: 'all' })
      }
    },
    { dependencies: [doLoad, doFade, sp, count, labelKey], scope: sectionRef },
  )

  // Rebuilds the packet's measured positions on resize, keeping the current point.
  useGSAP(
    () => {
      if (!doLoad) return
      let timer: ReturnType<typeof setTimeout>
      const onResize = () => {
        clearTimeout(timer)
        timer = setTimeout(() => {
          const keepStep = Math.min(shownRef.current, last)
          const t = buildTimeline(isVertical())
          if (!t) return
          scrubRef.current?.kill()
          scrubRef.current = null
          timelineRef.current?.kill()
          timelineRef.current = t
          t.seek(`s${keepStep}`)
        }, 200)
      }
      window.addEventListener('resize', onResize)
      return () => {
        clearTimeout(timer)
        window.removeEventListener('resize', onResize)
      }
    },
    { dependencies: [doLoad, count, labelKey] },
  )

  // Each middle button as wide as its label's widest line, which keeps its
  // line breaks; the edge buttons as wide as their neighbour allows.
  useLayoutEffect(() => {
    const wrap = tlRef.current
    if (!wrap) return
    const refine = () => {
      const items = [...wrap.querySelectorAll<HTMLLIElement>(':scope .tl > li')]
      if (!items.length) return
      const across = getComputedStyle(items[0]).position === 'absolute'
      wrap.style.setProperty('--last-h', `${items[items.length - 1].offsetHeight}px`)
      for (const li of items) {
        li.style.removeProperty('--edge-w')
        li.querySelector<HTMLElement>('.pt')?.style.removeProperty('width')
      }
      if (!across || items.length < 3) return
      const { spacing } = timeline(wrap.clientWidth, items.length)
      for (const li of items.slice(1, -1)) {
        const button = li.querySelector<HTMLElement>('.pt')
        const label = li.querySelector('.lbl')
        if (!button || !label) continue
        const range = document.createRange()
        range.selectNodeContents(label)
        button.style.width = `${Math.ceil(range.getBoundingClientRect().width) + 1}px`
      }
      const buttonWidth = (li: HTMLLIElement) => li.querySelector('.pt')?.getBoundingClientRect().width
      const set = (li: HTMLLIElement, neighbour: HTMLLIElement) =>
        li.style.setProperty('--edge-w', `${edgeLabelWidth(spacing, items.length, buttonWidth(neighbour))}px`)
      set(items[0], items[1])
      set(items[items.length - 1], items[items.length - 2])
    }
    refine()
    const watch = new ResizeObserver(refine)
    watch.observe(wrap)
    document.fonts?.ready.then(refine).catch(() => {})
    return () => watch.disconnect()
  }, [count, labelKey])

  if (!count) return null

  const place = (i: number) => (count === 1 ? 'only' : i === 0 ? 'first' : i === last ? 'last' : 'mid')

  const replay = () => {
    scrubRef.current?.kill()
    timelineRef.current?.restart()
  }

  const clickPoint = (i: number) => {
    const t = timelineRef.current
    if (doLoad && t) {
      scrubRef.current?.kill()
      t.pause()
      const target = t.labels[`s${i}`] ?? 0
      scrubRef.current = t.tweenTo(`s${i}`, { duration: Math.min(1.6, 0.35 + Math.abs(t.time() - target) * 0.25), ease: 'power2.inOut' })
    } else {
      showPanel(i)
    }
  }

  return (
    <section className="ncx-epi" ref={sectionRef}>
      <style>{timelineCss}</style>
      <div className="wrap ncx-container">
        <SplitHeading as="h2" motion={motion}>
          {heading}
        </SplitHeading>
        {paras.map((p, i) => (
          <p className="para" key={i}>
            {p.text}
          </p>
        ))}

        <div
          className="card"
          style={{ '--n': count, '--branch-h': hasBranch ? '56px' : '0px' } as React.CSSProperties}
        >
          <div className="head">
            <span className="start">{startLabel || 'Episode open'}</span>
            {doLoad ? (
              <button className="replay" type="button" onClick={replay}>
                Replay
              </button>
            ) : null}
            <span className="end">{endLabel || 'Episode closes'}</span>
          </div>
          <div className="tlwrap" ref={tlRef}>
            <div className="bar">
              <i className="fill" ref={fillRef} />
            </div>
            {list.map((p, i) =>
              p.isBranch ? (
                <span
                  className="arc on"
                  key={`arc-${p.id || i}`}
                  aria-hidden="true"
                  style={{ '--i': i } as React.CSSProperties}
                  ref={arcRef(i)}
                />
              ) : null,
            )}
            <span className="packet" aria-hidden="true" ref={packetRef} />
            <ol className="tl">
              {list.map((p, i) => (
                <li
                  key={p.id || i}
                  className={`${place(i)} done${p.isBranch ? ' branch' : ''}`}
                  style={{ '--i': i } as React.CSSProperties}
                  ref={itemRef(i)}
                >
                  <button type="button" className="pt" onClick={() => clickPoint(i)}>
                    <i className="dot" ref={dotRef(i)} />
                    <span className="lbl">{p.label}</span>
                    {p.isBranch ? <em className="branch-note">{p.branchLabel || 'Only if needed'}</em> : null}
                  </button>
                  {p.caption ? <p className="pcap">{p.caption}</p> : null}
                </li>
              ))}
            </ol>
          </div>
          <div className="caption" aria-live="polite">
            <b ref={panelTitleRef}>{list[last].label}</b>
            <span ref={panelBodyRef}>{list[last].caption}</span>
          </div>
          {closing ? <p className="close">{closing}</p> : null}
        </div>
      </div>
    </section>
  )
}

/*
 * --n is the number of points, set on the card. --branch-h reserves room
 * above the line for a raised branch point and its arc (0 when the episode
 * has none). --inset and --d (the bar's inset and the distance between
 * points, as in geometry.ts) are written in terms of 100%, which each rule
 * resolves against the panel's width: the head, the bar and the points all
 * span the panel.
 */
const timelineCss = `
        .ncx-epi{padding:84px 0;font-family:var(--font-body),Arial,sans-serif;color:var(--ncx-body)}
        .ncx-epi h2{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:clamp(1.55rem,3.4vw,2.2rem);max-width:var(--ncx-heading-max);margin:0;color:var(--ncx-ink)}
        .ncx-epi .para{max-width:62ch;margin-top:18px;color:var(--ncx-muted)}
        .ncx-epi .card{margin-top:46px;background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:16px;padding:24px 24px 22px;
          --inset:max(60px,calc((100% - (var(--n) - 1) * 12px) / (2 * var(--n))));
          --d:calc((100% - 2 * var(--inset)) / (var(--n) - 1))}
        .ncx-epi .head{display:flex;justify-content:space-between;align-items:center;gap:12px;font-size:.8rem;font-weight:500;margin-bottom:14px}
        /* The start and end labels sit over the first and last points, lined up with their outer edges. */
        .ncx-epi .head .start{margin-left:calc(var(--inset) - 10px)}
        .ncx-epi .head .end{margin-right:calc(var(--inset) - 10px);text-align:right}
        .ncx-epi .replay{background:none;border:1px solid var(--ncx-rule);color:var(--ncx-body);border-radius:999px;padding:5px 14px;font-size:.78rem;font-weight:500;cursor:pointer;font-family:inherit}
        .ncx-epi .tlwrap{position:relative;height:calc(92px + var(--branch-h,0px))}
        .ncx-epi .bar{position:absolute;left:var(--inset);right:var(--inset);top:calc(14px + var(--branch-h,0px));height:14px;border-radius:7px;background:var(--ncx-cloud);border:1px solid var(--ncx-rule);overflow:hidden}
        .ncx-epi .fill{position:absolute;inset:0;transform-origin:left center;transform:scaleX(1);background:var(--ncx-crimson)}
        .ncx-epi .packet{position:absolute;left:0;top:0;width:16px;height:16px;margin:-8px 0 0 -8px;border-radius:50%;
          background:var(--ncx-crimson);box-shadow:0 0 0 6px var(--ncx-crimson-tint),0 0 16px rgba(198,40,40,.45);
          z-index:3;pointer-events:none;opacity:0}
        /* A branch point's dashed backdrop, between the line and its raised node. Reached once its point is. */
        .ncx-epi .arc{position:absolute;top:calc(14px + var(--branch-h,0px) - 50px);height:44px;width:calc(var(--d) * 1.1);
          left:calc(var(--inset) + var(--d) * var(--i));transform:translateX(-50%);
          border:2px dashed var(--ncx-rule-strong);border-bottom:0;border-radius:40px 40px 0 0;transition:border-color .4s;pointer-events:none}
        .ncx-epi .arc.on{border-color:var(--ncx-crimson)}
        .ncx-epi .tl{list-style:none;margin:0;padding:0;position:absolute;inset:0}
        /* Every point on one top line. A middle label is centred on its point and
           at most the distance between two points less 12px wide; the first and
           last start at their point's outer edge (their width: geometry.ts). A
           branch point's whole item sits raised, above the line and its own arc. */
        /* The slots only place the labels: clicks pass through their empty
           parts, and each button is as wide as its own label, so one label's
           slot never takes another's click. */
        .ncx-epi .tl li{pointer-events:none;position:absolute;top:calc(11px + var(--branch-h,0px));left:calc(var(--inset) + var(--d) * var(--i));width:calc(var(--d) - 12px);transform:translateX(-50%)}
        .ncx-epi .tl li.branch{top:calc(11px + var(--branch-h,0px) - ${BRANCH_RAISE}px)}
        .ncx-epi .tl li.first{left:calc(var(--inset) - 10px);width:var(--edge-w,calc(var(--d) / 2 + 4px));transform:none}
        .ncx-epi .tl li.last{left:auto;right:calc(var(--inset) - 10px);width:var(--edge-w,calc(var(--d) / 2 + 4px));transform:none}
        .ncx-epi .tl li.only{left:50%;width:auto;max-width:100%}
        .ncx-epi .pt{pointer-events:auto;background:none;border:0;padding:0;margin:0 auto;cursor:pointer;width:fit-content;max-width:100%;display:flex;flex-direction:column;align-items:center;gap:12px;
          font-weight:500;font-size:.78rem;line-height:1.35;color:var(--ncx-muted);font-family:inherit}
        .ncx-epi .tl li.first .pt{align-items:flex-start;margin:0 auto 0 0}
        .ncx-epi .tl li.last .pt{align-items:flex-end;margin:0 0 0 auto}
        .ncx-epi .lbl{display:-webkit-box;-webkit-box-orient:vertical;-webkit-line-clamp:2;line-clamp:2;overflow:hidden;max-width:100%;text-align:center;overflow-wrap:break-word;hyphens:auto}
        .ncx-epi .branch-note{display:block;font-style:normal;font-size:.68rem;letter-spacing:.06em;text-transform:uppercase;color:var(--ncx-crimson-ink);margin-top:2px;white-space:nowrap}
        .ncx-epi .tl li.first .lbl{text-align:left}
        .ncx-epi .tl li.last .lbl{text-align:right}
        .ncx-epi .pcap{display:none}
        .ncx-epi .dot{flex:none;display:block;width:20px;height:20px;border-radius:50%;background:var(--ncx-white);border:3px solid var(--ncx-rule);transition:background .35s,border-color .35s,box-shadow .35s}
        .ncx-epi .tl li.done .dot{background:var(--ncx-crimson);border-color:var(--ncx-on-navy);box-shadow:0 0 0 2px var(--ncx-crimson)}
        .ncx-epi .tl li.branch .dot{border-style:dashed}
        .ncx-epi .tl li.branch.done .dot{border-style:solid}
        /* Keyboard focus only, and only on the point: a 2px crimson ring. */
        .ncx-epi .pt:focus,.ncx-epi .pt:focus-visible{outline:none}
        .ncx-epi .pt:focus-visible .dot{outline:2px solid var(--ncx-crimson);outline-offset:4px}
        .ncx-epi .caption{margin-top:6px;border-radius:12px;padding:14px 18px;background:var(--ncx-cloud);border-left:4px solid var(--ncx-crimson);display:flex;flex-direction:column;gap:2px;min-height:76px;justify-content:center}
        .ncx-epi .caption b{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:1rem}
        .ncx-epi .caption span{font-size:.95rem;color:var(--ncx-muted)}
        .ncx-epi .close{font-size:.88rem;color:var(--ncx-muted);margin-top:16px}
        /* Below 760px: upright, down the left side. Each point has its label and
           caption beside it, so the shared caption box below is not needed. A
           branch point sits indented, with a dashed left edge instead of a raised
           arc; there is no horizontal room to arc the packet around it either. */
        @media (max-width:759.98px){
          .ncx-epi .head .start,.ncx-epi .head .end{margin:0}
          .ncx-epi .tlwrap{height:auto}
          .ncx-epi .bar{left:7px;right:auto;width:6px;top:10px;bottom:calc(var(--last-h,20px) - 10px);height:auto}
          .ncx-epi .fill{transform-origin:center top;transform:scaleY(1)}
          .ncx-epi .arc{display:none}
          .ncx-epi .packet{display:none}
          .ncx-epi .tl{position:relative;inset:auto;display:flex;flex-direction:column;gap:22px}
          .ncx-epi .tl li,.ncx-epi .tl li.first,.ncx-epi .tl li.last,.ncx-epi .tl li.only{position:relative;top:auto;left:auto;right:auto;width:auto;max-width:none;transform:none;padding-left:36px}
          .ncx-epi .tl li.branch{top:auto;margin-left:26px;padding-left:30px;border-left:2px dashed var(--ncx-rule-strong)}
          .ncx-epi .tl li.branch.done{border-left-color:var(--ncx-crimson)}
          .ncx-epi .pt,.ncx-epi .tl li.first .pt,.ncx-epi .tl li.last .pt{display:block;width:100%;margin:0;text-align:left;font-size:.95rem;color:var(--ncx-ink)}
          .ncx-epi .dot{position:absolute;left:0;top:0}
          .ncx-epi .lbl,.ncx-epi .tl li.first .lbl,.ncx-epi .tl li.last .lbl{display:block;text-align:left;-webkit-line-clamp:unset;line-clamp:none;line-height:20px}
          .ncx-epi .pcap{display:block;margin:4px 0 0;font-size:.88rem;line-height:1.5;color:var(--ncx-muted)}
          .ncx-epi .caption{display:none}
        }
`
