'use client'

import { motion as m } from 'motion/react'
import React, { useEffect, useRef, useState } from 'react'

import { BlockIcon } from '@/components/BlockIcon'
import { Magnetic } from '@/motion/Magnetic'
import { gsap, useGSAP } from '@/motion/gsap'
import '@/motion/gsapDrawSVG'
import { SplitText } from '@/motion/gsapSplitText'
import type { MotionSetting } from '@/motion/levels'
import { useMotionLevel } from '@/motion/useMotionLevel'

import { badgeForRow, buildPlayScript, chipForFamily, type ChatRow, type PlayItem } from './chatScript'
import { splitUnderline } from './underline'

/** A chat row's spring entrance (docs/motion/bot-swarm-motion-demo.html popIn). */
const BUBBLE_SPRING = { type: 'spring' as const, stiffness: 420, damping: 26 }

/** Speed (prompt 5, point 1 of 12 "Speed" field): scales every wait and tween in this hero. */
const SPEED_SCALE: Record<string, number> = { slower: 1.3, normal: 1, faster: 0.7 }

type Badge = { label: string; icon?: string | null; chatRow?: number | null; id?: string | null }
type Chip = { label?: string | null; id?: string | null }
type Button = { label: string; href: string }

type Props = {
  eyebrow?: string | null
  h1: string
  underlineWord?: string | null
  subheading?: string | null
  chips: Chip[]
  buttons: Button[]
  rows: ChatRow[]
  caption?: string | null
  badges: Badge[]
  motion?: MotionSetting | null
  autoplay?: boolean | null
  loop?: boolean | null
  speed?: string | null
  crumbs?: React.ReactNode
}

const BADGE_POS = ['b0', 'b1', 'b2']

/** The bot's name, short, for the small chip above its typing indicator and bubble. */
const shortName = (name: string) => name.split(' ')[0]

/**
 * The hub's bot swarm hero (heroDesign: conversation): eyebrow, the H1 (with
 * an optional underlined word, never hidden or moved), intro, chips and
 * buttons beside a phone mockup that plays the hero chat. One GSAP load
 * timeline brings the page in; the chat then plays on its own, in a loop,
 * with each bubble on a Framer Motion spring. The full conversation is
 * always in the server HTML, so the hero reads correctly with no script and
 * at every motion level.
 */
export const BotSwarmHero: React.FC<Props> = ({
  eyebrow,
  h1,
  underlineWord,
  subheading,
  chips,
  buttons,
  rows,
  caption,
  badges,
  motion,
  autoplay,
  loop,
  speed,
  crumbs,
}) => {
  const level = useMotionLevel(motion)
  const sp = SPEED_SCALE[speed || 'normal'] ?? 1
  // Off shows the finished state (the shared autoplay description); on
  // reduced there is no sequence to play, only a plain fade.
  const doLoad = level === 'on' && autoplay !== false
  const doFade = level === 'reduced' && autoplay !== false

  const heading = splitUnderline(h1, underlineWord)
  const items = buildPlayScript(rows)

  const heroRef = useRef<HTMLElement>(null)
  const crumbsRef = useRef<HTMLDivElement>(null)
  const eyebrowRef = useRef<HTMLParagraphElement>(null)
  const shineRef = useRef<HTMLSpanElement>(null)
  const underlinePathRef = useRef<SVGPathElement>(null)
  const subRef = useRef<HTMLParagraphElement>(null)
  const chipsRef = useRef<HTMLUListElement>(null)
  const ctaRef = useRef<HTMLDivElement>(null)
  const phoneRef = useRef<HTMLDivElement>(null)
  const badgeRefs = useRef<(HTMLDivElement | null)[]>([])

  // The chat player: starts once the load timeline reaches the phone (or at
  // once, at reduced or off, where there is no timeline to wait for).
  const [chatStarted, setChatStarted] = useState(!doLoad)
  const [revealed, setRevealed] = useState<PlayItem[]>(items)
  const [typingAgent, setTypingAgent] = useState<string | null>(null)
  const [activeChip, setActiveChip] = useState<number | null>(null)
  const [pingedBadge, setPingedBadge] = useState<number | null>(null)
  const [paused, setPaused] = useState(false)
  // Whether a bubble just added to `revealed` should spring in, or (the
  // first render, matching the server HTML) appear already there.
  const [hasLooped, setHasLooped] = useState(false)
  const pausedRef = useRef(paused)
  pausedRef.current = paused
  const visibleRef = useRef(true)
  // The badges' endless bob, started from a timeline callback, so outside the
  // useGSAP context: paused off screen by the observer below, killed by hand.
  const bobsRef = useRef<gsap.core.Tween[]>([])

  /* ---------- load timeline: GSAP, about 2 seconds, scaled by speed ---------- */
  useGSAP(
    () => {
      if (!heroRef.current) return

      if (doFade) {
        gsap.set(heroRef.current, { opacity: 0 })
        gsap.to(heroRef.current, { opacity: 1, duration: 0.5 })
        return
      }
      if (!doLoad) return

      // Hidden instantly, before paint: nothing the timeline will reveal is
      // ever shown in its "about to animate" state.
      const hiddenTargets = [
        crumbsRef.current,
        eyebrowRef.current,
        ...(chipsRef.current ? Array.from(chipsRef.current.children) : []),
        ...(ctaRef.current ? Array.from(ctaRef.current.children) : []),
        phoneRef.current,
        ...badgeRefs.current,
      ].filter(Boolean)
      gsap.set(hiddenTargets, { opacity: 0 })
      gsap.set(crumbsRef.current, { y: -10 })
      gsap.set(eyebrowRef.current, { x: -16 })
      if (chipsRef.current) gsap.set(chipsRef.current.children, { y: 18, scale: 0.85 })
      if (ctaRef.current) gsap.set(ctaRef.current.children, { y: 16 })
      gsap.set(phoneRef.current, { y: 90, rotationX: 18, rotationY: -8, scale: 0.9, transformPerspective: 1200 })
      gsap.set(badgeRefs.current, { scale: 0 })

      let split: ReturnType<typeof SplitText.create> | null = null
      if (subRef.current) {
        split = SplitText.create(subRef.current, { type: 'lines', mask: 'lines' })
        gsap.set(split.lines, { yPercent: 100 })
      }

      shineRef.current?.classList.add('shine')
      const timeline = gsap.timeline({ defaults: { ease: 'power3.out' }, delay: 0.15 })
      timeline
        .to(crumbsRef.current, { opacity: 1, y: 0, duration: 0.5 * sp })
        .to(eyebrowRef.current, { opacity: 1, x: 0, duration: 0.5 * sp }, '<.05')
        .to(
          shineRef.current,
          {
            backgroundPosition: '-30% 0',
            duration: 1.6 * sp,
            ease: 'power2.inOut',
            onComplete: () => shineRef.current?.classList.remove('shine'),
          },
          '<.1',
        )
      if (underlinePathRef.current) {
        timeline.from(underlinePathRef.current, { drawSVG: '0%', duration: 0.9 * sp, ease: 'power2.inOut' }, '<.5')
      }
      if (split) {
        timeline.to(split.lines, { yPercent: 0, duration: 0.8 * sp, stagger: 0.08 * sp, ease: 'power4.out' }, '<-.3')
      }
      if (chipsRef.current?.children.length) {
        timeline.to(
          chipsRef.current.children,
          { opacity: 1, y: 0, scale: 1, stagger: 0.07 * sp, duration: 0.55 * sp, ease: 'back.out(2.2)' },
          '<.25',
        )
      }
      if (ctaRef.current?.children.length) {
        timeline.to(ctaRef.current.children, { opacity: 1, y: 0, stagger: 0.08 * sp, duration: 0.5 * sp }, '<.2')
      }
      timeline.to(
        phoneRef.current,
        { opacity: 1, y: 0, rotationX: 0, rotationY: 0, scale: 1, duration: 1.3 * sp, ease: 'expo.out' },
        0.3,
      )
      if (badgeRefs.current.length) {
        timeline.to(
          badgeRefs.current,
          { opacity: 1, scale: 1, stagger: 0.14 * sp, duration: 0.6 * sp, ease: 'back.out(2.6)' },
          '-=.5',
        )
      }
      timeline.add(() => {
        bobsRef.current = badgeRefs.current.flatMap((b, i) =>
          b ? [gsap.to(b, { y: '+=8', duration: 2.2 + i * 0.35, repeat: -1, yoyo: true, ease: 'sine.inOut', paused: !visibleRef.current })] : [],
        )
        setChatStarted(true)
      })

      // Cursor tilt: the phone and the badges lean toward the pointer, mouse only.
      const section = heroRef.current
      const rx = gsap.quickTo(phoneRef.current, 'rotationX', { duration: 0.8, ease: 'power3' })
      const ry = gsap.quickTo(phoneRef.current, 'rotationY', { duration: 0.8, ease: 'power3' })
      const bx = badgeRefs.current.map((b) => (b ? gsap.quickTo(b, 'x', { duration: 1, ease: 'power3' }) : null))
      const onMove = (e: PointerEvent) => {
        if (e.pointerType !== 'mouse' || !phoneRef.current) return
        const r = phoneRef.current.getBoundingClientRect()
        const nx = Math.max(-1, Math.min(1, (e.clientX - (r.left + r.width / 2)) / r.width))
        const ny = Math.max(-1, Math.min(1, (e.clientY - (r.top + r.height / 2)) / r.height))
        ry(nx * 8)
        rx(ny * -6)
        bx.forEach((f, i) => f?.(nx * (i % 2 ? -14 : 14)))
      }
      const onLeave = () => {
        rx(0)
        ry(0)
        bx.forEach((f) => f?.(0))
      }
      section?.addEventListener('pointermove', onMove)
      section?.addEventListener('pointerleave', onLeave)
      return () => {
        section?.removeEventListener('pointermove', onMove)
        section?.removeEventListener('pointerleave', onLeave)
        bobsRef.current.forEach((t) => t.revert())
        bobsRef.current = []
      }
    },
    { dependencies: [doLoad, doFade, sp], scope: heroRef },
  )

  /* ---------- the chat player: plays once the load timeline reaches the phone ---------- */
  useEffect(() => {
    if (!doLoad || !chatStarted) return
    let cancelled = false
    const wait = (ms: number) =>
      new Promise<void>((resolve) => {
        let left = ms
        const tick = () => {
          if (cancelled) return resolve()
          if (!pausedRef.current && visibleRef.current) left -= 100
          if (left <= 0) return resolve()
          setTimeout(tick, 100)
        }
        setTimeout(tick, 100)
      })
    const pingBadge = (i: number) => {
      const el = badgeRefs.current[i]
      if (!el) return
      setPingedBadge(i)
      gsap.fromTo(el, { scale: 1 }, { scale: 1.08, duration: 0.18, yoyo: true, repeat: 1, ease: 'power2.out' })
      setTimeout(() => setPingedBadge((cur) => (cur === i ? null : cur)), 900)
    }
    const run = async () => {
      // The initial, fully shown conversation (the server HTML) stays up a
      // moment before the first loop begins.
      await wait(2400 * sp)
      while (!cancelled) {
        setHasLooped(true)
        setRevealed([])
        setActiveChip(null)
        for (const item of items) {
          if (cancelled) return
          if (item.kind === 'handoff') {
            setRevealed((r) => [...r, item])
            await wait(450 * sp)
            continue
          }
          const { row, rowNumber } = item
          if (row.sender === 'business' && row.agentName) {
            setTypingAgent(row.agentName)
            setActiveChip(chipForFamily(chips, row.agentFamily))
            await wait(950 * sp)
            setTypingAgent(null)
          }
          setRevealed((r) => [...r, item])
          const badgeIdx = badgeForRow(badges, rowNumber)
          if (badgeIdx !== null) pingBadge(badgeIdx)
          await wait((row.sender === 'business' ? 750 : 650) * sp)
        }
        setActiveChip(null)
        if (!loop) return
        await wait(5000 * sp)
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [doLoad, chatStarted, loop, sp])

  /* ---------- paused when off screen ---------- */
  useEffect(() => {
    const el = phoneRef.current
    if (!el || typeof IntersectionObserver === 'undefined') return
    const io = new IntersectionObserver((entries) => {
      visibleRef.current = entries.some((e) => e.isIntersecting)
      bobsRef.current.forEach((t) => (visibleRef.current ? t.play() : t.pause()))
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])

  const chatLabel = caption || 'WhatsApp Business · online'

  return (
    <section className="ncx-bsh" ref={heroRef}>
      <style>{bshCss}</style>
      <div className="inner ncx-container">
        <div ref={crumbsRef}>{crumbs}</div>
        <div className="grid">
          <div>
            {eyebrow ? (
              <p className="eyebrow" ref={eyebrowRef}>
                {eyebrow}
              </p>
            ) : null}
            <h1>
              <span ref={shineRef}>
                {heading.before}
                {heading.word ? (
                  <span className="word">
                    {heading.word}
                    <svg className="under" viewBox="0 0 200 20" preserveAspectRatio="none" aria-hidden="true">
                      <path ref={underlinePathRef} d="M4 13 C 50 4, 110 4, 196 11" />
                    </svg>
                  </span>
                ) : null}
                {heading.after}
              </span>
            </h1>
            {subheading ? (
              <p className="sub" ref={subRef}>
                {subheading}
              </p>
            ) : null}
            {chips.length ? (
              <ul className="caps" ref={chipsRef}>
                {chips.map((c, i) => (
                  <li key={c.id || i} className={activeChip === i ? 'on' : ''}>
                    <span className="dot" />
                    {c.label}
                  </li>
                ))}
              </ul>
            ) : null}
            {buttons.length ? (
              <div className="cta" ref={ctaRef}>
                {buttons.map((b, i) => (
                  <Magnetic key={b.href + i}>
                    <a className={`btn ${i === 0 ? 'btn-primary' : 'btn-ghost'}`} href={b.href}>
                      {b.label}
                      {i === 0 ? (
                        <svg className="ncx-arrow" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" aria-hidden="true">
                          <path d="M5 12h14M13 6l6 6-6 6" />
                        </svg>
                      ) : null}
                    </a>
                  </Magnetic>
                ))}
              </div>
            ) : null}
          </div>

          {rows.length ? (
            <div className="stage">
              {badges.map((b, i) => (
                <div
                  className={`badge ${BADGE_POS[i] || ''}${pingedBadge === i ? ' ping' : ''}`}
                  key={b.id || i}
                  ref={(el) => {
                    badgeRefs.current[i] = el
                  }}
                >
                  <span className="bi">
                    <BlockIcon name={b.icon} fallback="sparkles" />
                  </span>
                  <span>{b.label}</span>
                </div>
              ))}
              <div className="phone" ref={phoneRef} role="group" aria-label="Example conversation">
                <div className="ph-head">
                  <span className="ph-dot" aria-hidden="true" />
                  <div>
                    <b>Your business</b>
                    <span>{chatLabel}</span>
                  </div>
                  {doLoad ? (
                    <button
                      className="ph-pause"
                      type="button"
                      aria-pressed={paused}
                      onClick={() => setPaused((p) => !p)}
                    >
                      {paused ? 'Play' : 'Pause'}
                    </button>
                  ) : null}
                </div>
                <div className="ph-body">
                  {revealed.map((item, i) => {
                    const initial = hasLooped ? { opacity: 0, y: 14, scale: 0.9 } : false
                    if (item.kind === 'handoff') {
                      return (
                        <m.div className="hand" key={`hand-${i}`} initial={initial} animate={{ opacity: 1, y: 0, scale: 1 }} transition={BUBBLE_SPRING}>
                          <span>
                            Handed to <b>{item.agentName}</b>
                          </span>
                        </m.div>
                      )
                    }
                    const { row } = item
                    return (
                      <m.div
                        className={`msg ${row.sender === 'customer' ? 'in' : row.sender === 'team' ? 'sys' : 'bot'}`}
                        key={`row-${i}`}
                        initial={initial}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        transition={BUBBLE_SPRING}
                      >
                        {row.sender === 'business' && row.agentName ? (
                          <span className="bot-name">{shortName(row.agentName)}</span>
                        ) : null}
                        {row.text}
                      </m.div>
                    )
                  })}
                  {typingAgent ? (
                    <m.div className="typing" initial={{ opacity: 0, y: 14, scale: 0.9 }} animate={{ opacity: 1, y: 0, scale: 1 }} transition={BUBBLE_SPRING}>
                      <span className="bot-name">{shortName(typingAgent)}</span>
                      <span className="dots">
                        <i />
                        <i />
                        <i />
                      </span>
                    </m.div>
                  ) : null}
                </div>
              </div>
            </div>
          ) : null}
        </div>
      </div>
    </section>
  )
}

const bshCss = `
.ncx-bsh{position:relative;background:var(--ncx-cloud);color:var(--ncx-ink);
  font-family:var(--font-body),Arial,sans-serif;overflow:hidden}
.ncx-bsh .inner{padding:calc(64px + clamp(44px,6vw,76px)) 0 clamp(56px,7vw,88px)}
.ncx-bsh .grid{display:grid;grid-template-columns:1.02fr .98fr;gap:56px;align-items:center}
.ncx-bsh .eyebrow{font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.82rem;
  letter-spacing:.04em;color:var(--ncx-crimson-ink);margin:0 0 14px}
.ncx-bsh h1{font-family:var(--font-display),Arial,sans-serif;font-weight:700;
  font-size:clamp(38px,5vw,60px);line-height:1.08;letter-spacing:-.03em;margin:0;
  text-wrap:balance;color:var(--ncx-ink)}
.ncx-bsh h1 .shine{background:linear-gradient(100deg,var(--ncx-ink) 42%,var(--ncx-crimson) 50%,var(--ncx-ink) 58%);
  background-size:260% 100%;background-position:120% 0;-webkit-background-clip:text;background-clip:text;color:transparent}
.ncx-bsh h1 .word{position:relative;display:inline-block}
.ncx-bsh h1 .under{position:absolute;left:-2%;bottom:-.14em;width:104%;height:.26em;overflow:visible}
.ncx-bsh h1 .under path{fill:none;stroke:var(--ncx-crimson);stroke-width:5;stroke-linecap:round}
.ncx-bsh .sub{margin:22px 0 0;font-size:1.05rem;line-height:1.6;color:var(--ncx-muted);max-width:52ch;overflow:hidden}
.ncx-bsh .caps{margin:28px 0 0;padding:0;list-style:none;display:flex;flex-wrap:wrap;gap:9px}
.ncx-bsh .caps li{display:inline-flex;align-items:center;gap:7px;font-size:.84rem;font-weight:500;
  color:var(--ncx-muted);border:1px solid var(--ncx-rule);padding:7px 13px;border-radius:100px;
  background:var(--ncx-white);transition:color .2s,border-color .2s}
.ncx-bsh .caps li .dot{width:6px;height:6px;border-radius:50%;background:var(--ncx-rule-strong);flex:none;transition:background .2s}
.ncx-bsh .caps li.on{color:var(--ncx-ink);border-color:var(--ncx-crimson)}
.ncx-bsh .caps li.on .dot{background:var(--ncx-crimson)}
.ncx-bsh .cta{margin-top:32px;display:flex;gap:12px;flex-wrap:wrap}
.ncx-bsh .btn{display:inline-flex;align-items:center;gap:9px;
  font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:.98rem;
  padding:14px 26px;border-radius:10px;border:1px solid transparent;text-decoration:none}
.ncx-bsh .btn-primary{background:var(--ncx-crimson);color:var(--ncx-on-navy)}
.ncx-bsh .btn-primary:hover{background:var(--ncx-crimson-hover)}
.ncx-bsh .btn-ghost{background:var(--ncx-white);color:var(--ncx-ink);border-color:var(--ncx-rule)}
.ncx-bsh .btn-ghost:hover{border-color:var(--ncx-muted)}
.ncx-bsh .btn:focus-visible{outline:2px solid var(--ncx-focus);outline-offset:3px}

.ncx-bsh .stage{position:relative}
.ncx-bsh .badge{position:absolute;z-index:2;display:inline-flex;align-items:center;gap:7px;
  background:var(--ncx-white);border:1px solid var(--ncx-rule);border-radius:10px;padding:7px 10px 7px 7px;
  font-size:12px;font-weight:500;color:var(--ncx-ink);box-shadow:var(--ncx-shadow);white-space:nowrap}
.ncx-bsh .badge.b0{top:3%;left:0}.ncx-bsh .badge.b1{top:52%;right:0}.ncx-bsh .badge.b2{bottom:9%;left:0}
.ncx-bsh .badge.ping{border-color:var(--ncx-crimson)}
.ncx-bsh .badge .bi{width:24px;height:24px;border-radius:7px;background:var(--ncx-rule-soft);color:var(--ncx-crimson);
  display:flex;align-items:center;justify-content:center;flex:none}
.ncx-bsh .badge .bi svg{width:14px;height:14px}
@media(max-width:1180px){.ncx-bsh .badge{display:none}}

.ncx-bsh .phone{position:relative;background:var(--ncx-navy);border-radius:var(--ncx-r-panel);
  padding:14px;box-shadow:var(--ncx-lift);max-width:380px;margin:0 auto}
.ncx-bsh .ph-head{display:flex;align-items:center;gap:9px;color:var(--ncx-on-navy);padding:2px 6px 12px}
.ncx-bsh .ph-dot{width:9px;height:9px;border-radius:50%;background:var(--ncx-crimson);flex:none}
.ncx-bsh .ph-head div{display:flex;flex-direction:column;line-height:1.25}
.ncx-bsh .ph-head b{font-size:13px;font-weight:600}
.ncx-bsh .ph-head span{font-size:11px;opacity:.72}
.ncx-bsh .ph-pause{margin-left:auto;border:1px solid rgba(255,255,255,.3);background:transparent;
  color:var(--ncx-on-navy);border-radius:8px;padding:5px 10px;font-size:12px;cursor:pointer}
.ncx-bsh .ph-body{background:var(--ncx-cloud);border-radius:14px;padding:14px;
  display:flex;flex-direction:column;gap:9px;min-height:360px;max-height:420px;overflow:hidden}
.ncx-bsh .msg{max-width:84%;font-size:14px;line-height:1.45;padding:9px 13px;border-radius:14px}
.ncx-bsh .msg.in{align-self:flex-end;background:var(--ncx-navy);color:var(--ncx-on-navy);border-bottom-right-radius:4px}
.ncx-bsh .msg.bot{align-self:flex-start;background:var(--ncx-white);border-bottom-left-radius:4px;box-shadow:0 1px 2px rgba(26,32,53,.06)}
.ncx-bsh .msg.sys{align-self:center;background:var(--ncx-white);border:1px solid var(--ncx-rule);
  border-radius:999px;font-size:12.5px;padding:7px 14px;color:var(--ncx-muted)}
.ncx-bsh .bot-name{display:block;font:600 11px/1 var(--font-body),Arial,sans-serif;letter-spacing:.02em;
  padding:3px 7px;border-radius:5px;margin-bottom:6px;color:var(--ncx-on-navy);background:var(--ncx-crimson);
  display:inline-block}
.ncx-bsh .hand{align-self:stretch;display:flex;align-items:center;gap:8px;font-size:11.5px;color:var(--ncx-muted)}
.ncx-bsh .hand::before,.ncx-bsh .hand::after{content:"";flex:1;height:1px;background:var(--ncx-rule)}
.ncx-bsh .hand b{font-weight:600;color:var(--ncx-ink)}
.ncx-bsh .typing{align-self:flex-start;background:var(--ncx-white);border-radius:14px;padding:10px 13px;
  display:flex;align-items:center;gap:8px}
.ncx-bsh .typing .dots{display:flex;gap:4px}
.ncx-bsh .typing .dots i{width:6px;height:6px;border-radius:50%;background:var(--ncx-rule-strong);animation:ncxBhBob 1s infinite}
.ncx-bsh .typing .dots i:nth-child(2){animation-delay:.15s}
.ncx-bsh .typing .dots i:nth-child(3){animation-delay:.3s}
@keyframes ncxBhBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}

@media(max-width:960px){
  .ncx-bsh .grid{grid-template-columns:1fr;gap:36px}
  .ncx-bsh .phone{max-width:420px}
}
@media(prefers-reduced-motion:reduce){
  .ncx-bsh .btn{transition:none}
  .ncx-bsh .caps li{transition:none}
}
`
