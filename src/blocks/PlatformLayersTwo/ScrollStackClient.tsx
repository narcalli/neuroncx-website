'use client'

import React, { useEffect, useRef, useState } from 'react'

export type ScrollStackItem = {
  key: string
  title: string
  tag?: string | null
  description: string
  footnote?: string | null
  footer?: React.ReactNode
}

type Props = {
  items: ScrollStackItem[]
  showIndicators: boolean
  /** Server-rendered left-column copy, so the full text is in the initial HTML. */
  children?: React.ReactNode
}

/**
 * The only client island in the scroll stack. It owns the active index, the
 * observer and the indicator clicks. Everything else is server-rendered.
 */
export const ScrollStackClient: React.FC<Props> = ({ items, showIndicators, children }) => {
  const [active, setActive] = useState(0)
  const cardRefs = useRef<(HTMLLIElement | null)[]>([])
  // Set by a click, cleared by the next real user scroll, so programmatic
  // scrolling never moves the active card on its own.
  const suspended = useRef(false)

  useEffect(() => {
    const last = items.length - 1

    // A thin reading line across the middle of the viewport.
    const io = new IntersectionObserver(
      (entries) => {
        if (suspended.current) return
        for (const e of entries) {
          if (e.isIntersecting) setActive(Number((e.target as HTMLElement).dataset.index))
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    )
    cardRefs.current.forEach((el) => el && io.observe(el))

    // The last card often never reaches the reading line, so force it at the bottom.
    const onScroll = () => {
      if (suspended.current) return
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      if (atBottom) setActive(last)
    }
    const resume = () => {
      suspended.current = false
    }
    const userInputs = ['wheel', 'touchmove', 'keydown'] as const

    window.addEventListener('scroll', onScroll, { passive: true })
    userInputs.forEach((type) => window.addEventListener(type, resume, { passive: true }))

    return () => {
      io.disconnect()
      window.removeEventListener('scroll', onScroll)
      userInputs.forEach((type) => window.removeEventListener(type, resume))
    }
  }, [items.length])

  const choose = (i: number) => {
    suspended.current = true
    setActive(i)
  }

  const scrollTo = (i: number) => {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    cardRefs.current[i]?.scrollIntoView({ block: 'center', behavior: reduce ? 'auto' : 'smooth' })
  }

  return (
    <div className="ncx-ss__grid">
      <div className="ncx-ss__sticky">
        {children}
        {showIndicators ? (
          <ul className="ncx-ss__ind">
            {items.map((item, i) => (
              <li key={item.key}>
                <button
                  type="button"
                  className={i === active ? 'is-active' : undefined}
                  aria-current={i === active ? 'true' : undefined}
                  onClick={() => {
                    choose(i)
                    scrollTo(i)
                  }}
                >
                  <span className="ncx-ss__num">{i + 1}</span>
                  {item.title}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      <ol className="ncx-ss__stack">
        {items.map((item, i) => {
          const state = i === active ? ' is-active' : i < active ? ' is-done' : ''
          return (
            <li
              key={item.key}
              data-index={i}
              ref={(el) => {
                cardRefs.current[i] = el
              }}
              className={`ncx-ss__card${state}`}
              onClick={() => choose(i)}
            >
              <span className="ncx-ss__badge">{String(i + 1).padStart(2, '0')}</span>
              <div className="ncx-ss__body">
                {item.tag ? <span className="ncx-ss__tag">{item.tag}</span> : null}
                <h3>{item.title}</h3>
                <p className="ncx-ss__desc">{item.description}</p>
                {item.footnote ? (
                  <p className="ncx-ss__note">
                    <svg viewBox="0 0 16 16" width="16" height="16" aria-hidden="true">
                      <path d="M3 8.5l3 3 7-7" fill="none" stroke="#C62828" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    {item.footnote}
                  </p>
                ) : null}
                {item.footer ? (
                  // The link must not also trigger the card's active-state handler.
                  <div className="ncx-ss__foot" onClick={(e) => e.stopPropagation()}>
                    {item.footer}
                  </div>
                ) : null}
              </div>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
