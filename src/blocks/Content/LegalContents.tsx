'use client'

import React, { useEffect, useState } from 'react'

import type { OutlineItem } from './legalOutline'

// A section counts as current once its heading passes this line, just under the sticky header.
const READ_LINE = 140

/** The contents list: sticky beside the text on wide screens, a collapsible box above it on narrow ones. */
export const LegalContents: React.FC<{ items: OutlineItem[] }> = ({ items }) => {
  const [active, setActive] = useState<string | null>(null)

  useEffect(() => {
    const heads = items.map((i) => document.getElementById(i.id)).filter((h): h is HTMLElement => Boolean(h))
    let frame = 0
    const update = () => {
      frame = 0
      let current: string | null = null
      for (const h of heads) {
        if (h.getBoundingClientRect().top > READ_LINE) break
        current = h.id
      }
      // The last sections can be too short to reach the line, so the end of the page selects the last.
      const atEnd = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 2
      setActive(atEnd && heads.length ? heads[heads.length - 1].id : current)
    }
    const onScroll = () => {
      if (!frame) frame = requestAnimationFrame(update)
    }
    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [items])

  const list = (onPick?: React.MouseEventHandler<HTMLAnchorElement>) => (
    <ol className="ncx-legal__list">
      {items.map((i) => (
        <li key={i.id}>
          <a
            href={`#${i.id}`}
            className={active === i.id ? 'on' : undefined}
            aria-current={active === i.id ? 'location' : undefined}
            onClick={onPick}
          >
            {i.label}
          </a>
        </li>
      ))}
    </ol>
  )

  return (
    <>
      <nav className="ncx-legal__toc" aria-label="On this page">
        <p className="ncx-legal__toc-title">On this page</p>
        {list()}
      </nav>
      <details className="ncx-legal__toc-mobile">
        <summary>On this page</summary>
        <nav aria-label="On this page">
          {/* Picking a section closes the box, so the text is not pushed down under it. */}
          {list((e) => e.currentTarget.closest('details')?.removeAttribute('open'))}
        </nav>
      </details>
    </>
  )
}
