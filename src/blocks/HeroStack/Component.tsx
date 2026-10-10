'use client'

import React, { useEffect, useRef, useState } from 'react'
import Image from 'next/image'

import type { HeroStackBlock as HeroStackProps } from '@/payload-types'
import { pickMedia, type MediaValue } from '@/utilities/media'

// An in-page anchor (e.g. #how-it-works) stays on this page. Anything else
// opens in a new tab, the same rule as the Conversation Hero's buttons.
const externalAttrs = (href?: string | null) =>
  href && (href.startsWith('#') || href.startsWith('/')) ? {} : { target: '_blank', rel: 'noopener noreferrer' }

// Below this width the pin and the stack are dropped, and the products
// render as a plain list. The scroll effect needs room it doesn't have there.
const DESKTOP = '(min-width: 881px)'

// Cards further back than this all sit at the same depth and fade out, so a
// six-card stack doesn't slide off the right edge.
const MAX_DEPTH = 3

export const HeroStackBlock: React.FC<HeroStackProps> = ({
  eyebrow,
  heading,
  intro,
  primaryCta,
  secondaryCta,
  products,
  showFrame,
}) => {
  const list = (products || [])
    .map((p) => ({ ...p, pick: pickMedia(p?.screenshot as MediaValue, 'stack1600') }))
    .filter((p) => p.label && p.pick)
  const n = list.length

  const trackRef = useRef<HTMLElement>(null)
  const pinRef = useRef<HTMLDivElement>(null)
  const cardRefs = useRef<(HTMLElement | null)[]>([])
  const meterRef = useRef<HTMLElement>(null)
  const hintRef = useRef<HTMLSpanElement>(null)
  const goToRef = useRef<(i: number) => void>(() => {})
  const [active, setActive] = useState(0)

  // Ported from the reference: measure() turns scroll position into a target,
  // tick() eases towards it, and paint() writes --k and --out onto each card.
  useEffect(() => {
    const track = trackRef.current
    const pin = pinRef.current
    if (!track || !pin || n < 2) return

    const desktop = window.matchMedia(DESKTOP)
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)')
    let target = 0
    let cur = 0
    let raf = 0
    let shown = -1

    const paint = (s: number) => {
      cardRefs.current.forEach((c, i) => {
        if (!c) return
        let k = i - s
        let out = 0
        if (k < 0) {
          out = Math.min(1, -k)
          k = 0
        }
        c.style.setProperty('--k', Math.min(k, MAX_DEPTH).toFixed(3))
        c.style.setProperty('--out', out.toFixed(3))
        c.style.setProperty('--fade', Math.max(0, Math.min(1, k - MAX_DEPTH)).toFixed(3))
      })
      if (meterRef.current) meterRef.current.style.width = `${((s / (n - 1)) * 100).toFixed(2)}%`
      if (hintRef.current) hintRef.current.style.opacity = s > 0.12 ? '0' : '1'
      const a = Math.max(0, Math.min(n - 1, Math.round(s)))
      if (a !== shown) {
        shown = a
        setActive(a)
      }
    }

    const tick = () => {
      raf = 0
      cur = reduce.matches ? target : cur + (target - cur) * 0.14
      if (Math.abs(target - cur) < 0.002) cur = target
      paint(cur)
      if (cur !== target) kick()
    }
    const kick = () => {
      if (!raf) raf = requestAnimationFrame(tick)
    }

    // Where the pin holds still, and the stretch of scrolling it holds for.
    // The site header overlaps the top of the page, so a hero placed first
    // starts stuck from the very top rather than when it reaches the header.
    const span = () => {
      const stickTop = parseFloat(getComputedStyle(pin).top) || 0
      const docTop = track.getBoundingClientRect().top + window.scrollY
      const start = Math.max(0, docTop - stickTop)
      const end = docTop + track.offsetHeight - pin.offsetHeight - stickTop
      return { start, length: Math.max(1, end - start) }
    }

    const measure = () => {
      if (!desktop.matches) return
      const { start, length } = span()
      const p = Math.min(1, Math.max(0, (window.scrollY - start) / length))
      target = p * (n - 1)
      kick()
    }

    goToRef.current = (i: number) => {
      const { start, length } = span()
      window.scrollTo({ top: start + (i / (n - 1)) * length, behavior: reduce.matches ? 'auto' : 'smooth' })
    }

    window.addEventListener('scroll', measure, { passive: true })
    window.addEventListener('resize', measure)
    desktop.addEventListener('change', measure)
    paint(0)
    measure()

    return () => {
      window.removeEventListener('scroll', measure)
      window.removeEventListener('resize', measure)
      desktop.removeEventListener('change', measure)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [n])

  const current = list[active]
  const frame = showFrame !== false

  const buttons =
    primaryCta?.label || secondaryCta?.label ? (
      <div className="hs-ctas">
        {primaryCta?.label ? (
          <a className="hs-btn hs-primary" href={primaryCta.href || '#'} {...externalAttrs(primaryCta.href)}>
            {primaryCta.label}
          </a>
        ) : null}
        {secondaryCta?.label ? (
          <a className="hs-btn hs-ghost" href={secondaryCta.href || '#'} {...externalAttrs(secondaryCta.href)}>
            {secondaryCta.label}
          </a>
        ) : null}
      </div>
    ) : null

  return (
    <section
      className="ncx-hstack"
      ref={trackRef}
      style={{ ['--n' as string]: Math.max(n, 1) } as React.CSSProperties}
    >
      <style>{`
        /* Colours from the HeroStack brief, kept in one place. */
        .ncx-hstack{
          --hs-ink:#1A1A2E;--hs-muted:#4A5573;--hs-bg:#F5F5F7;--hs-surface:#FFFFFF;
          --hs-line:#E4E7F0;--hs-accent:#C62828;--hs-accent-soft:#FCEFEF;
          --hs-shadow:rgba(26,26,46,.45);
          --bar:64px;--step:70svh;
          --pin-h:clamp(540px,calc(100svh - var(--bar) - 8px),720px);
          position:relative;background:var(--hs-bg);color:var(--hs-ink);
          font-family:var(--font-body),Arial,sans-serif;
          height:calc(var(--pin-h) + (var(--n) - 1) * var(--step) + var(--bar))}
        .ncx-hstack .hs-pin{position:sticky;top:calc(var(--bar) + env(safe-area-inset-top,0px));
          height:var(--pin-h);display:grid;grid-template-columns:minmax(0,.85fr) minmax(0,1.25fr);
          gap:56px;align-items:center;overflow-x:clip}
        .ncx-hstack .hs-copy{display:flex;flex-direction:column;gap:22px;align-items:flex-start;min-width:0}
        .ncx-hstack .hs-eyebrow{display:inline-flex;align-items:center;gap:10px;margin:0;
          font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:.75rem;
          letter-spacing:.06em;text-transform:uppercase;color:var(--hs-accent)}
        .ncx-hstack .hs-eyebrow::before{content:"";width:7px;height:7px;border-radius:50%;background:var(--hs-accent)}
        .ncx-hstack h1{margin:0;font-family:var(--font-display),Arial,sans-serif;font-weight:600;
          font-size:clamp(2.1rem,4.4vw,3.4rem);line-height:1.08;letter-spacing:-.02em;text-wrap:balance}
        .ncx-hstack .hs-intro{margin:0;font-size:1.05rem;line-height:1.6;color:var(--hs-muted);max-width:34rem;text-wrap:pretty}
        .ncx-hstack .hs-ctas{display:flex;flex-wrap:wrap;gap:12px}
        .ncx-hstack .hs-btn{display:inline-flex;align-items:center;justify-content:center;padding:.8rem 1.25rem;
          border-radius:9px;font-weight:600;font-size:.95rem;text-decoration:none;border:1px solid transparent;
          transition:filter .15s ease}
        .ncx-hstack .hs-btn:hover{filter:brightness(1.08)}
        .ncx-hstack .hs-primary{background:var(--hs-accent);color:var(--hs-surface)}
        .ncx-hstack .hs-ghost{background:transparent;color:var(--hs-ink);border-color:var(--hs-line)}
        .ncx-hstack :focus-visible{outline:2px solid var(--hs-accent);outline-offset:2px}

        .ncx-hstack .hs-visual{position:relative;min-width:0;padding-inline:8px;display:flex;flex-direction:column;gap:16px}
        .ncx-hstack .hs-glow{position:absolute;inset:-6% -4% 22% -4%;pointer-events:none;z-index:0;
          background:radial-gradient(closest-side,var(--hs-accent),transparent 74%);opacity:.14;filter:blur(24px)}
        .ncx-hstack .hs-stage{position:relative;z-index:1;aspect-ratio:16/11;width:100%}
        .ncx-hstack .hs-deck{position:absolute;inset:0;
          transform:perspective(1500px) rotateY(-11deg) rotateX(5deg) rotateZ(1deg);transform-origin:30% 70%}
        /* --k is the card's depth in the stack, --out how far it has peeled
           away, --fade hides cards past the visible depth. Set by paint().
           94% wide, not the reference's 80%: each card further back moves
           right by 5.2% but also shrinks by 4.5%, so even the deepest card
           ends barely past the front card's right edge. 80% left a fifth of
           the column empty. */
        .ncx-hstack .hs-card{--k:0;--out:0;--fade:0;
          position:absolute;left:0;bottom:0;width:94%;display:flex;flex-direction:column;
          background:var(--hs-surface);border:1px solid var(--hs-line);border-radius:14px;overflow:hidden;
          box-shadow:0 26px 44px -26px var(--hs-shadow),0 2px 6px rgba(0,0,0,.08);
          transform-origin:0 100%;
          transform:translate(calc(var(--k) * 5.2% - var(--out) * 46%),calc(var(--k) * -6% + var(--out) * 8%))
            rotate(calc(var(--out) * -8deg)) scale(calc(1 - var(--k) * .045));
          opacity:calc(1 - var(--k) * .14 - var(--out) * 1.15 - var(--fade));
          filter:brightness(calc(1 - var(--k) * .05));
          animation:hsRise .8s cubic-bezier(.2,.8,.2,1) backwards;
          animation-delay:calc((var(--n) - 1 - var(--i)) * 110ms);will-change:transform,opacity}
        @keyframes hsRise{from{opacity:0;transform:translate(0,14%) scale(.96)}}
        .ncx-hstack .hs-chrome{display:flex;gap:6px;align-items:center;padding:9px 12px;
          background:var(--hs-bg);border-bottom:1px solid var(--hs-line)}
        .ncx-hstack .hs-chrome i{width:8px;height:8px;border-radius:50%;background:var(--hs-line)}
        /* Screenshots fill a 16:10 window, trimmed from the bottom and right
           so a dashboard's header and left edge always stay in view. */
        .ncx-hstack .hs-shot{position:relative;aspect-ratio:16/10;background:var(--hs-surface)}
        .ncx-hstack .hs-shot img{width:100%;height:100%;object-fit:cover;object-position:top left;display:block}

        .ncx-hstack .hs-tabs{position:relative;z-index:2;display:flex;flex-wrap:wrap;gap:8px}
        .ncx-hstack .hs-tab{font:500 .8rem var(--font-body),Arial,sans-serif;padding:.5rem .9rem;border-radius:999px;
          border:1px solid var(--hs-line);background:var(--hs-surface);color:var(--hs-muted);cursor:pointer;
          white-space:nowrap;transition:background .15s ease,color .15s ease,border-color .15s ease}
        .ncx-hstack .hs-tab:hover{color:var(--hs-ink);border-color:var(--hs-muted)}
        .ncx-hstack .hs-tab[aria-pressed="true"]{background:var(--hs-accent);color:var(--hs-surface);border-color:var(--hs-accent)}
        .ncx-hstack .hs-meter{position:relative;z-index:2;height:3px;border-radius:2px;background:var(--hs-line);overflow:hidden}
        .ncx-hstack .hs-meter i{display:block;height:100%;width:0;background:var(--hs-accent)}
        .ncx-hstack .hs-caprow{position:relative;z-index:2;display:flex;justify-content:space-between;
          align-items:flex-start;gap:12px;min-height:3.2rem}
        .ncx-hstack .hs-cap{margin:0;color:var(--hs-muted);font-size:.95rem;min-width:0}
        .ncx-hstack .hs-cap strong{color:var(--hs-ink);font-weight:600;margin-right:.4rem}
        .ncx-hstack .hs-hint{flex:none;font-family:var(--font-display),Arial,sans-serif;font-weight:500;font-size:.7rem;
          letter-spacing:.05em;text-transform:uppercase;color:var(--hs-accent);transition:opacity .3s ease}
        .ncx-hstack .hs-list{display:none}

        /* Phones and small tablets: no pin, no stack, a plain list. */
        @media(max-width:880px){
          .ncx-hstack{height:auto;padding-block:calc(var(--bar) + 28px) 48px}
          .ncx-hstack .hs-pin{position:static;height:auto;display:block}
          .ncx-hstack .hs-copy{gap:14px}
          .ncx-hstack h1{font-size:clamp(1.7rem,7vw,2.2rem)}
          .ncx-hstack .hs-intro{display:none}
          .ncx-hstack .hs-visual{display:none}
          .ncx-hstack .hs-list{display:flex;flex-direction:column;gap:28px;margin:32px 0 0;padding:0;list-style:none}
          .ncx-hstack .hs-item .hs-card{position:relative;width:100%;transform:none;opacity:1;filter:none;animation:none}
          .ncx-hstack .hs-item h2{margin:14px 0 0;font-family:var(--font-display),Arial,sans-serif;font-weight:600;font-size:1.05rem}
          .ncx-hstack .hs-item p{margin:4px 0 0;color:var(--hs-muted);font-size:.95rem}
        }
        @media(prefers-reduced-motion:reduce){
          .ncx-hstack .hs-card{animation:none}
          .ncx-hstack .hs-tab,.ncx-hstack .hs-btn,.ncx-hstack .hs-hint{transition:none}
        }
      `}</style>

      <div className="hs-pin ncx-container" ref={pinRef}>
        <div className="hs-copy">
          {eyebrow ? <p className="hs-eyebrow">{eyebrow}</p> : null}
          <h1>{heading}</h1>
          {intro ? <p className="hs-intro">{intro}</p> : null}
          {buttons}

          {n ? (
            <ol className="hs-list">
              {list.map((p, i) => (
                <li className="hs-item" key={p.id || i}>
                  <div className="hs-card">
                    {frame ? <div className="hs-chrome" aria-hidden="true"><i /><i /><i /></div> : null}
                    <div className="hs-shot">
                      <Image
                        src={p.pick!.src}
                        alt={p.pick!.alt || p.label!}
                        width={p.pick!.width ?? 1600}
                        height={p.pick!.height ?? 1000}
                        sizes="100vw"
                        loading="lazy"
                        unoptimized={p.pick!.unoptimized}
                      />
                    </div>
                  </div>
                  <h2>{p.label}</h2>
                  {p.caption ? <p>{p.caption}</p> : null}
                </li>
              ))}
            </ol>
          ) : null}
        </div>

        {n ? (
          <div className="hs-visual">
            <div className="hs-glow" aria-hidden="true" />
            <div className="hs-stage">
              <div className="hs-deck">
                {list.map((p, i) => (
                  <article
                    key={p.id || i}
                    className="hs-card"
                    ref={(el) => {
                      cardRefs.current[i] = el
                    }}
                    aria-label={p.label!}
                    aria-hidden={i !== active}
                    style={
                      {
                        '--i': i,
                        '--k': Math.min(i, MAX_DEPTH),
                        '--fade': Math.max(0, Math.min(1, i - MAX_DEPTH)),
                        zIndex: n - i,
                      } as React.CSSProperties
                    }
                  >
                    {frame ? <div className="hs-chrome" aria-hidden="true"><i /><i /><i /></div> : null}
                    <div className="hs-shot">
                      <Image
                        src={p.pick!.src}
                        alt={p.pick!.alt || p.label!}
                        width={p.pick!.width ?? 1600}
                        height={p.pick!.height ?? 1000}
                        sizes="(min-width: 881px) 42vw, 100vw"
                        priority={i === 0}
                        loading={i === 0 ? 'eager' : 'lazy'}
                        unoptimized={p.pick!.unoptimized}
                      />
                    </div>
                  </article>
                ))}
              </div>
            </div>

            {n > 1 ? (
              <>
                <div className="hs-tabs" role="group" aria-label="Products">
                  {list.map((p, i) => (
                    <button
                      key={p.id || i}
                      type="button"
                      className="hs-tab"
                      aria-pressed={i === active}
                      onClick={() => goToRef.current(i)}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="hs-meter" aria-hidden="true">
                  <i ref={meterRef} />
                </div>
              </>
            ) : null}
            <div className="hs-caprow">
              <p className="hs-cap" aria-live="polite">
                <strong>{current?.label}</strong>
                {current?.caption ? <span>{current.caption}</span> : null}
              </p>
              {n > 1 ? (
                <span className="hs-hint" ref={hintRef}>
                  Scroll
                </span>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  )
}
