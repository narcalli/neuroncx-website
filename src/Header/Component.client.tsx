'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import type { Header } from '@/payload-types'

import { AnnouncementBar } from './AnnouncementBar'
import { headerCss } from './headerStyles'

type NavItem = NonNullable<Header['navItems']>[number]
type MenuItem = NonNullable<NavItem['items']>[number]

type Link = { label: string; href: string; badge?: string | null; groupHeading?: string | null; newTab?: boolean | null; id?: string | null }

/**
 * The links for one dropdown.
 *
 * Normally that is the item's own list. A deployment whose data has not been
 * migrated yet still carries the old columns-of-links shape, so those are
 * folded into the same flat list here — first link of each column takes that
 * column's heading — and the menu works either way.
 */
const linksFor = (item: NavItem): Link[] => {
  const own = (item.items || []).filter((l: MenuItem) => l?.label && l?.href) as Link[]
  if (own.length) return own

  const out: Link[] = []
  ;(item.columns || []).forEach((col) => {
    let headingPending = true
    ;(col.links || []).forEach((l) => {
      if (!l?.label || !l?.href) return
      out.push({
        label: l.label,
        href: l.href,
        groupHeading: headingPending ? col.heading || null : null,
        newTab: /^https?:\/\//.test(l.href),
        id: l.id,
      })
      headingPending = false
    })
  })
  return out
}

const isExternal = (href?: string | null) => /^https?:\/\//.test(String(href || ''))

/** Perceived brightness of a computed colour, or null when it is transparent. */
const luminanceOf = (colour: string): number | null => {
  const parts = colour.match(/[\d.]+/g)
  if (!parts) return null
  const [r, g, b, a = '1'] = parts.map(Number)
  if (!a) return null
  return 0.2126 * r + 0.7152 * g + 0.0722 * b
}

/**
 * What is painted under one point of the header. Walks up from whatever is hit
 * there to the first element that paints a background *and* is big enough to
 * count as a section.
 *
 * Two things are deliberately ignored. A card or a chip can be dark inside a
 * light section, and flipping the whole header for it looks broken — so the
 * walk carries on past anything narrower than most of the viewport until it
 * reaches the section the card sits in. And the page background behind the gaps
 * between blocks is not a section at all, so hitting <body> returns nothing and
 * the header simply keeps the state it had.
 */
const backdropAt = (x: number, y: number): { section: number | null; nearest: number | null } => {
  const minWidth = window.innerWidth * 0.6
  const stack = document.elementsFromPoint(x, y)
  let nearest: number | null = null
  for (const hit of stack) {
    if (hit.closest('.ncx-nav, .ncx-scrim, .ncx-topbar')) continue
    let node: Element | null = hit
    while (node && node !== document.body && node !== document.documentElement) {
      const lum = luminanceOf(window.getComputedStyle(node).backgroundColor)
      if (lum !== null) {
        const box = node.getBoundingClientRect()
        if (nearest === null) nearest = lum
        if (box.width >= minWidth && box.height >= 120) return { section: lum, nearest }
      }
      node = node.parentElement
    }
  }
  return { section: null, nearest }
}

/** Internal addresses go through next/link, absolute ones stay plain anchors. */
const Anchor: React.FC<{
  href?: string | null
  newTab?: boolean | null
  className?: string
  children: React.ReactNode
}> = ({ href, newTab, className, children }) => {
  const target = href || '/'
  if (isExternal(target) || newTab) {
    return (
      <a
        className={className}
        href={target}
        {...(newTab ? { target: '_blank', rel: 'noopener noreferrer' } : { rel: 'noopener' })}
      >
        {children}
      </a>
    )
  }
  return (
    <Link className={className} href={target}>
      {children}
    </Link>
  )
}

const Chevron = () => (
  <svg viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M1 3.2 5 7 9 3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

export const HeaderClient: React.FC<{ data: Header; logoSrc?: string | null }> = ({
  data,
  logoSrc,
}) => {
  const navRef = useRef<HTMLElement | null>(null)
  const closeTimer = useRef<number | null>(null)
  const panels = useRef(new Map<number, HTMLDivElement | null>())
  const triggers = useRef(new Map<number, HTMLButtonElement | null>())
  const [open, setOpen] = useState<number | null>(null)
  const pathname = usePathname()

  // The panel is centred under its trigger, then clamped inside the header so
  // a right-hand menu cannot hang off the edge. Measured, because the width of
  // the trigger and of the header are both unknown until they are laid out.
  const place = useCallback((index: number) => {
    const nav = navRef.current
    const panel = panels.current.get(index)
    const trigger = triggers.current.get(index)
    if (!nav || !panel || !trigger) return
    const navBox = nav.getBoundingClientRect()
    const trigBox = trigger.getBoundingClientRect()
    const w = panel.offsetWidth
    const pad = 8
    const centred = trigBox.left + trigBox.width / 2 - navBox.left - w / 2
    const max = navBox.width - w - pad
    const left = Math.max(pad, Math.min(centred, max > pad ? max : pad))
    panel.style.left = `${Math.round(left)}px`
  }, [])

  // Before paint, so the panel never shows in the wrong place for a frame.
  useLayoutEffect(() => {
    if (open !== null) place(open)
  }, [open, place])

  useEffect(() => {
    if (open === null) return
    const onResize = () => place(open)
    window.addEventListener('resize', onResize, { passive: true })
    return () => window.removeEventListener('resize', onResize)
  }, [open, place])

  const items = (data.navItems || []).filter((i) => i?.label)
  const announcement = data.announcement

  // `is-stuck` and `on-dark` are written straight onto the element rather than
  // held in state: this runs on every scroll frame, and re-rendering the whole
  // nav that often would be wasteful. One rAF per frame, guarded by `ticking`.
  //
  // `on-dark` is decided by sampling what the header is actually sitting on,
  // at three points across its width. `data-nav="dark"` stays as the manual
  // override for the things sampling cannot read: gradients, images, video.
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    let darkZones: Element[] = []
    let ticking = false
    // Separate thresholds, so a boundary drifting across a probe cannot make
    // the header strobe between the two states.
    const GOES_DARK = 92
    const GOES_LIGHT = 132
    let isDark = false

    const collect = () => {
      darkZones = Array.from(document.querySelectorAll('[data-nav="dark"]'))
    }

    const paint = () => {
      ticking = false
      nav.classList.toggle('is-stuck', window.scrollY > 36)
      const r = nav.getBoundingClientRect()
      const probe = r.top + r.height / 2

      const tagged = darkZones.some((zone) => {
        const z = zone.getBoundingClientRect()
        return z.top <= probe && z.bottom >= probe
      })

      const w = window.innerWidth
      const probes = [w * 0.2, w * 0.5, w * 0.8].map((x) => backdropAt(x, probe))

      if (tagged) {
        isDark = true
      } else {
        const sections = probes.map((r) => r.section).filter((l): l is number => l !== null)
        if (sections.length) {
          const mean = sections.reduce((a, b) => a + b, 0) / sections.length
          if (mean < GOES_DARK) isDark = true
          else if (mean > GOES_LIGHT) isDark = false
        }
      }

      nav.classList.toggle('on-dark', isDark)

      // A dark card or panel can sit under a light section — too small to flip
      // the whole header for, but enough to swallow dark text. Thicken the veil
      // over it instead, so the text keeps something to sit on either way.
      const busy =
        !isDark &&
        probes.some((r) => r.nearest !== null && r.nearest < GOES_DARK && r.section !== r.nearest)
      nav.classList.toggle('is-busy', busy)
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        window.requestAnimationFrame(paint)
      }
    }

    const onResize = () => {
      collect()
      onScroll()
    }

    collect()
    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
    }
    // Re-reads the dark sections after a client-side navigation.
  }, [pathname])

  // Any navigation closes whatever was open.
  useEffect(() => {
    setOpen(null)
  }, [pathname])

  // The scrim is a sibling of the nav, so it keys off a class on <body>.
  useEffect(() => {
    document.body.classList.toggle('ncx-menu-open', open !== null)
    return () => document.body.classList.remove('ncx-menu-open')
  }, [open])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(null)
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [])

  useEffect(
    () => () => {
      if (closeTimer.current) window.clearTimeout(closeTimer.current)
    },
    [],
  )

  const hold = () => {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current)
      closeTimer.current = null
    }
  }

  // Leaving the nav gives a little grace, so crossing a gap between two
  // triggers does not flicker the panel shut.
  const closeSoon = () => {
    hold()
    closeTimer.current = window.setTimeout(() => setOpen(null), 120)
  }

  const signInHref = data.signInHref || 'https://dash.neuroncx.in'

  return (
    <>
      <style>{headerCss}</style>

      {announcement?.enabled && announcement.text ? (
        <AnnouncementBar
          text={announcement.text}
          ctaLabel={announcement.ctaLabel}
          ctaHref={announcement.ctaHref}
        />
      ) : null}

      <div className="ncx-scrim" aria-hidden="true" onMouseEnter={() => setOpen(null)} />

      <header className="ncx-nav" ref={navRef}>
        <div className="ncx-nav__in">
          <Link className="ncx-mark" href="/">
            {logoSrc ? (
              // Decorative: the wordmark beside it already says NeuronCx.
              // eslint-disable-next-line @next/next/no-img-element
              <img className="ncx-mark__img" src={logoSrc} alt="" width={20} height={20} />
            ) : (
              <span className="ncx-mark__dot" aria-hidden="true" />
            )}
            NeuronCx
          </Link>

          <nav className="ncx-nav__links" onMouseLeave={closeSoon} onMouseEnter={hold}>
            {items.map((item, i) => {
              const links = linksFor(item)
              // A row that predates the type field reads back as "link",
              // because that is the field's default — so the field alone
              // cannot decide. A row is a plain link when it was explicitly
              // set to one *and* has somewhere to go; otherwise its links win.
              const isDropdown = links.length > 0 && !(item.type === 'link' && item.href)

              if (!isDropdown) {
                if (!item.href) return null
                return (
                  <Anchor key={item.id || i} className="ncx-navlink" href={item.href}>
                    {item.label}
                  </Anchor>
                )
              }

              const panelId = `ncx-menu-${item.id || i}`

              return (
                <div
                  key={item.id || i}
                  className={`ncx-navitem${open === i ? ' is-open' : ''}`}
                  onMouseEnter={() => {
                    hold()
                    setOpen(i)
                  }}
                >
                  <button
                    className="ncx-navlink"
                    type="button"
                    ref={(el) => {
                      triggers.current.set(i, el)
                    }}
                    aria-expanded={open === i}
                    aria-controls={panelId}
                    onClick={() => setOpen((cur) => (cur === i ? null : i))}
                    onFocus={() => setOpen(i)}
                  >
                    {item.label}
                    <Chevron />
                  </button>

                  <div
                    className="ncx-menu"
                    id={panelId}
                    ref={(el) => {
                      panels.current.set(i, el)
                    }}
                  >
                    {links.map((l, li) => (
                      <React.Fragment key={l.id || li}>
                        {/* A heading opens a group; the CSS drops the rule and
                            the top margin when it is the first child. */}
                        {l.groupHeading ? <h5>{l.groupHeading}</h5> : null}
                        <Anchor href={l.href} newTab={l.newTab}>
                          <span>{l.label}</span>
                          {l.badge ? <span className="ncx-badge-new">{l.badge}</span> : null}
                        </Anchor>
                      </React.Fragment>
                    ))}
                  </div>
                </div>
              )
            })}
          </nav>

          <div className="ncx-nav__right">
            {data.signInLabel ? (
              <Anchor className="ncx-ghost" href={signInHref}>
                {data.signInLabel}
              </Anchor>
            ) : null}
            {data.ctaLabel ? (
              <Anchor className="ncx-btn-pill" href={data.ctaHref || '/contact'}>
                {data.ctaLabel}
              </Anchor>
            ) : null}
          </div>
        </div>
      </header>
    </>
  )
}
