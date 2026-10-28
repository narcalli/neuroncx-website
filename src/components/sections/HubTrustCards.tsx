'use client'

import React, { useRef } from 'react'

import { BlockIcon } from '@/components/BlockIcon'
import { gsap, useGSAP } from '@/motion/gsap'
import '@/motion/gsapDrawSVG'
import type { MotionSetting } from '@/motion/levels'
import { useMotionLevel } from '@/motion/useMotionLevel'
import { isPastStart, onceInView } from '@/motion/useOnceInView'

type Card = { id?: string | null; title: string; line?: string | null; icon?: string | null }

/** A drawable part's own stroke, when it has one: DrawSVG needs a stroke to draw along, not a fill. */
const isStrokedPart = (el: Element): boolean => {
  const fill = el.getAttribute('fill')
  return !fill || fill === 'none'
}

/**
 * The trust section's cards (prompt 9 of the motion plan): once in view,
 * each rises 120ms after the one before it, and its icon draws itself
 * stroke by stroke. Hovering a card redraws its icon. Every icon in the
 * shared library (components/BlockIcon) is a stroked outline already, so
 * none needs to fall back to a static icon; a future one that is not would
 * be left as it is (isStrokedPart), not forced to draw.
 */
export const HubTrustCards: React.FC<{ cards: Card[]; motion?: MotionSetting | null }> = ({ cards, motion }) => {
  const level = useMotionLevel(motion)
  const doLoad = level === 'on'
  const doFade = level === 'reduced'
  const sectionRef = useRef<HTMLUListElement>(null)
  const cardRefs = useRef<(HTMLLIElement | null)[]>([])

  useGSAP(
    () => {
      const el = sectionRef.current
      if (!el) return

      if (doFade) {
        if (isPastStart(el)) return
        gsap.set(el, { opacity: 0 })
        const stop = onceInView(el, () => gsap.to(el, { opacity: 1, duration: 0.5 }))
        return () => {
          stop()
          gsap.set(el, { clearProps: 'opacity' })
        }
      }
      if (!doLoad) return

      // Held here, not read from the refs again in the cleanup: a re-render can
      // detach and reattach them in the same commit the cleanup runs in.
      const cardEls = cardRefs.current.slice()
      const stops = cardEls.map((card, i) => {
        if (!card || isPastStart(card)) return undefined
        const parts = Array.from(card.querySelectorAll<SVGElement>('.icon svg > *')).filter(isStrokedPart)
        gsap.set(card, { opacity: 0, y: 40 })
        if (parts.length) gsap.set(parts, { drawSVG: '0%' })
        return onceInView(card, () => {
          const timeline = gsap.timeline({ delay: i * 0.12 })
          timeline.to(card, { opacity: 1, y: 0, duration: 0.7, ease: 'power3.out' })
          if (parts.length) timeline.to(parts, { drawSVG: '100%', duration: 0.8, stagger: 0.15, ease: 'power2.inOut' }, '<.2')
        })
      })

      const listeners = cardEls.map((card) => {
        if (!card) return undefined
        const onEnter = () => {
          const parts = Array.from(card.querySelectorAll<SVGElement>('.icon svg > *')).filter(isStrokedPart)
          if (!parts.length) return
          gsap.fromTo(parts, { drawSVG: '0%' }, { drawSVG: '100%', duration: 0.6, stagger: 0.08, ease: 'power2.inOut', overwrite: true })
        }
        card.addEventListener('pointerenter', onEnter)
        return onEnter
      })

      return () => {
        stops.forEach((stop) => stop?.())
        cardEls.forEach((card, i) => {
          if (!card) return
          const onEnter = listeners[i]
          if (onEnter) card.removeEventListener('pointerenter', onEnter)
          gsap.set(card, { clearProps: 'all' })
          gsap.set(card.querySelectorAll('.icon svg > *'), { clearProps: 'all' })
        })
      }
    },
    { dependencies: [doLoad, doFade, cards.length] },
  )

  return (
    <ul className="ncx-sec__grid ncx-trust__grid" ref={sectionRef}>
      {cards.map((c, i) => (
        <li
          className="ncx-sec__card"
          key={c.id || i}
          ref={(el) => {
            cardRefs.current[i] = el
          }}
        >
          {c.icon ? (
            <span className="icon" aria-hidden="true">
              <BlockIcon name={c.icon} fallback="check" />
            </span>
          ) : null}
          <h3>{c.title}</h3>
          {c.line ? <p>{c.line}</p> : null}
        </li>
      ))}
    </ul>
  )
}
