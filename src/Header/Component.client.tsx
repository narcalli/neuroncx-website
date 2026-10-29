'use client'

import { motion } from 'motion/react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'

import type { Header } from '@/payload-types'
import { Magnetic } from '@/motion/Magnetic'
import { SPRING } from '@/motion/tokens'
import { useMotionLevel } from '@/motion/useMotionLevel'

import { AnnouncementBar } from './AnnouncementBar'
import { nextHeaderState } from './headerScroll'
import { headerCss } from './headerStyles'

import { Anchor } from './Anchor'
import { Badge, MegaPanel, type FeaturedImage } from './MegaMenu'
import { menuKind, panelLeft } from './megaMenuLayout'

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
    if (hit.closest('.ncx-nav, .ncx-scrim, .ncx-topbar, .ncx-drawer')) continue
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

const Chevron = () => (
  <svg viewBox="0 0 10 10" fill="none" aria-hidden="true">
    <path d="M1 3.2 5 7 9 3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
  </svg>
)

export const HeaderClient: React.FC<{
  data: Header
  logoSrc?: string | null
  /** Each mega menu's featured image by menu item id, made absolute on the server. */
  featuredImages?: Record<string, FeaturedImage>
}> = ({ data, logoSrc, featuredImages }) => {
  const navRef = useRef<HTMLElement | null>(null)
  // An empty, invisible .ncx-container inside the bar: the page container's
  // edges, measured from the site's own CSS rather than copied from it.
  const frameRef = useRef<HTMLDivElement | null>(null)
  const closeTimer = useRef<number | null>(null)
  const panels = useRef(new Map<number, HTMLDivElement | null>())
  const triggers = useRef(new Map<number, HTMLButtonElement | null>())
  // The pointer that pressed a dropdown trigger ("mouse", "touch", "pen"),
  // read by its focus and click handlers; empty for the keyboard.
  const pressedWith = useRef('')
  const [open, setOpen] = useState<number | null>(null)
  // The pill behind the hovered nav item or link (mouse only). A shared
  // layoutId, not the open dropdown's state: a plain link can take it too.
  const [hovered, setHovered] = useState<number | null>(null)
  const hasFocus = useRef(false)
  const pathname = usePathname()
  // Site and page level only: the bar's own hide-on-scroll is infrastructure,
  // not a block's animation, so it has no Motion panel of its own.
  const level = useMotionLevel()

  // The menu drawer: whether it is open, and which of its dropdown sections
  // is expanded (one at a time).
  const [drawerOpen, setDrawerOpen] = useState(false)
  // Read inside the scroll effect below, which only ever re-attaches on a
  // route change: refs so it sees this frame's values, not the ones it
  // closed over when it last ran.
  const openRef = useRef(open)
  openRef.current = open
  const drawerOpenRef = useRef(drawerOpen)
  drawerOpenRef.current = drawerOpen
  const levelRef = useRef(level)
  levelRef.current = level
  const [section, setSection] = useState<number | null>(null)
  const drawerRef = useRef<HTMLDivElement | null>(null)
  const burgerRef = useRef<HTMLButtonElement | null>(null)
  const closeRef = useRef<HTMLButtonElement | null>(null)
  // Set by closeDrawer, then read and cleared by the effects below once the
  // drawer has closed: whether focus goes back to the menu button, and
  // whether the page goes back to where it was scrolled.
  const restoreFocus = useRef(false)
  const restoreScroll = useRef(false)

  /**
   * Closes the drawer. A plain close (its close button, the menu button,
   * Escape) puts focus back on the menu button and the page back where it
   * was. A tapped link puts the scroll back but not the focus, since the page
   * is about to change. A route change restores neither: the new page owns
   * both.
   */
  const closeDrawer = useCallback((opts: { focus?: boolean; scroll?: boolean } = {}) => {
    restoreFocus.current = opts.focus ?? true
    restoreScroll.current = opts.scroll ?? true
    setDrawerOpen(false)
    setSection(null)
  }, [])

  // Sizes and places a mega menu panel. Its width is its content's
  // (max-content in CSS), capped here at the page container's content width.
  // Its left edge starts under its trigger and moves left only as far as it
  // must to keep its right edge inside the container, never past the
  // container's left edge (panelLeft in megaMenuLayout.ts). Measured, because the
  // panel's width depends on its text, and the container's on the window.
  const place = useCallback((index: number) => {
    const nav = navRef.current
    const frame = frameRef.current
    const panel = panels.current.get(index)
    const trigger = triggers.current.get(index)
    if (!nav || !frame || !panel || !trigger) return
    const box = frame.getBoundingClientRect()
    const pad = window.getComputedStyle(frame)
    const containerLeft = box.left + parseFloat(pad.paddingLeft)
    const containerRight = box.right - parseFloat(pad.paddingRight)
    // The cap first, so the width read next is the one that will show.
    panel.style.maxWidth = `${Math.floor(containerRight - containerLeft)}px`
    const left = panelLeft({
      triggerLeft: trigger.getBoundingClientRect().left,
      panelWidth: panel.offsetWidth,
      containerLeft,
      containerRight,
    })
    // The panel is positioned inside the bar, so viewport pixels become the
    // bar's own.
    panel.style.left = `${Math.round(left - nav.getBoundingClientRect().left)}px`
  }, [])

  // Before paint, so the panel never shows in the wrong place for a frame.
  useLayoutEffect(() => {
    if (open !== null) place(open)
  }, [open, place])

  // Again whenever the window resizes, or the open panel does (a web font
  // arriving late changes its width).
  useEffect(() => {
    if (open === null) return
    const onResize = () => place(open)
    window.addEventListener('resize', onResize, { passive: true })
    const panel = panels.current.get(open)
    const watch = panel && typeof ResizeObserver !== 'undefined' ? new ResizeObserver(onResize) : null
    if (panel) watch?.observe(panel)
    return () => {
      window.removeEventListener('resize', onResize)
      watch?.disconnect()
    }
  }, [open, place])

  const items = (data.navItems || []).filter((i) => i?.label)
  const announcement = data.announcement

  // `is-stuck`, `is-hidden` and `on-dark` are written straight onto the
  // element rather than held in state: this runs on every scroll frame, and
  // re-rendering the whole nav that often would be wasteful. One rAF per
  // frame, guarded by `ticking`.
  //
  // `on-dark` is decided by sampling what the header is actually sitting on,
  // at three points across its width. `data-nav="dark"` stays as the manual
  // override for the things sampling cannot read: gradients, images, video.
  useEffect(() => {
    const nav = navRef.current
    if (!nav) return

    let darkZones: Element[] = []
    let ticking = false
    let lastScrollY = window.scrollY
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
      const scrollY = window.scrollY
      const held = openRef.current !== null || drawerOpenRef.current || hasFocus.current || levelRef.current !== 'on'
      const { stuck, hidden } = nextHeaderState({ scrollY, lastScrollY, held })
      lastScrollY = scrollY
      nav.classList.toggle('is-stuck', stuck)
      nav.classList.toggle('is-hidden', hidden)
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

    // Focus landing anywhere inside the bar holds it shown; the next paint
    // picks this up through the ref, and this also brings it back at once
    // rather than waiting for the next scroll event.
    const onFocusIn = () => {
      hasFocus.current = true
      nav.classList.remove('is-hidden')
    }
    const onFocusOut = (e: FocusEvent) => {
      hasFocus.current = Boolean(e.relatedTarget) && nav.contains(e.relatedTarget as Node)
    }

    collect()
    paint()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onResize, { passive: true })
    nav.addEventListener('focusin', onFocusIn)
    nav.addEventListener('focusout', onFocusOut)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onResize)
      nav.removeEventListener('focusin', onFocusIn)
      nav.removeEventListener('focusout', onFocusOut)
    }
    // Re-reads the dark sections after a client-side navigation.
  }, [pathname])

  // Any navigation closes whatever was open, the drawer included, so it is
  // never left open over a new page. Reset while rendering the new path
  // (React's pattern for state that follows a changing value), so no extra
  // render follows. The refs stay cleared, so neither focus nor scroll is
  // restored: the new page owns both.
  const [shownPath, setShownPath] = useState(pathname)
  if (shownPath !== pathname) {
    setShownPath(pathname)
    setOpen(null)
    setDrawerOpen(false)
    setSection(null)
  }

  // Opening moves focus to the drawer's close button; closing returns it to
  // the menu button.
  useEffect(() => {
    if (drawerOpen) {
      closeRef.current?.focus()
    } else if (restoreFocus.current) {
      restoreFocus.current = false
      burgerRef.current?.focus()
    }
  }, [drawerOpen])

  // While the drawer is open the page behind it does not scroll. The body is
  // pinned at its current offset (position: fixed), which also holds on iOS
  // Safari, where overflow: hidden alone does not; it is released on close.
  useEffect(() => {
    if (!drawerOpen) return
    const body = document.body
    const y = window.scrollY
    const was = {
      position: body.style.position,
      top: body.style.top,
      left: body.style.left,
      right: body.style.right,
      width: body.style.width,
    }
    Object.assign(body.style, {
      position: 'fixed',
      top: `-${y}px`,
      left: '0',
      right: '0',
      width: '100%',
    })
    return () => {
      Object.assign(body.style, was)
      if (restoreScroll.current) {
        restoreScroll.current = false
        window.scrollTo({ top: y, left: 0, behavior: 'instant' as ScrollBehavior })
      }
    }
  }, [drawerOpen])

  // Escape closes the drawer, and Tab stays inside it. Focus that leaves it
  // some other way (a screen reader, a stray click) is brought back.
  useEffect(() => {
    if (!drawerOpen) return
    const drawer = drawerRef.current
    if (!drawer) return
    // Links in a collapsed section have no box, so they drop out here.
    const focusables = () =>
      Array.from(
        drawer.querySelectorAll<HTMLElement>(
          'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      ).filter((el) => el.getClientRects().length > 0)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeDrawer()
        return
      }
      if (e.key !== 'Tab') return
      const list = focusables()
      if (!list.length) return
      const first = list[0]
      const last = list[list.length - 1]
      const active = document.activeElement
      const inside = active instanceof HTMLElement && drawer.contains(active)
      if (e.shiftKey && (!inside || active === first)) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && (!inside || active === last)) {
        e.preventDefault()
        first.focus()
      }
    }
    const onFocusIn = (e: FocusEvent) => {
      if (!drawer.contains(e.target as Node)) closeRef.current?.focus()
    }

    document.addEventListener('keydown', onKey)
    document.addEventListener('focusin', onFocusIn)
    return () => {
      document.removeEventListener('keydown', onKey)
      document.removeEventListener('focusin', onFocusIn)
    }
  }, [drawerOpen, closeDrawer])

  // Above 900px the drawer is never shown (headerStyles.ts). If the window
  // grows past that while it is open, close it, so the page is not left
  // locked behind a drawer nobody can see.
  useEffect(() => {
    if (!drawerOpen) return
    const wide = window.matchMedia('(min-width: 901px)')
    const onChange = () => {
      if (wide.matches) closeDrawer({ focus: false })
    }
    onChange()
    wide.addEventListener('change', onChange)
    return () => wide.removeEventListener('change', onChange)
  }, [drawerOpen, closeDrawer])

  // The scrim is a sibling of the nav, so it keys off a class on <body>.
  useEffect(() => {
    document.body.classList.toggle('ncx-menu-open', open !== null)
    return () => document.body.classList.remove('ncx-menu-open')
  }, [open])

  // A dropdown or the drawer opening brings the bar back at once, rather
  // than waiting for the next scroll event to notice it is held.
  useEffect(() => {
    if (open !== null || drawerOpen) navRef.current?.classList.remove('is-hidden')
  }, [open, drawerOpen])

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

  const mark = (
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
  )

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

      {/* Behind an open dropdown: a mouse moving onto it, or a tap on it,
          closes the dropdown. */}
      <div
        className="ncx-scrim"
        aria-hidden="true"
        onPointerEnter={(e) => {
          if (e.pointerType === 'mouse') setOpen(null)
        }}
        onClick={() => setOpen(null)}
      />

      <header className="ncx-nav" ref={navRef}>
        <div className="ncx-container ncx-nav__frame" ref={frameRef} aria-hidden="true" />
        <div className="ncx-nav__in">
          {mark}

          <nav
            className="ncx-nav__links"
            onPointerLeave={(e) => {
              if (e.pointerType === 'mouse') {
                closeSoon()
                setHovered(null)
              }
            }}
            onPointerEnter={(e) => {
              if (e.pointerType === 'mouse') hold()
            }}
            // Focus leaving the menus (Tab past the last item, or into the
            // page) closes an open panel, so it never sits over the content
            // the keyboard has moved on to. Moving between a trigger and its
            // own panel stays inside, and keeps it open.
            onBlur={(e) => {
              if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setOpen(null)
            }}
          >
            {items.map((item, i) => {
              const entry = menuKind(item)

              if (entry.kind === 'none') return null
              // The hover pill (point 3, prompt 4): one shared element, kept
              // mounted only inside whichever item the mouse is currently
              // over. Its layoutId is how it slides from the last item to
              // this one instead of fading in fresh each time.
              const pill =
                hovered === i ? (
                  <motion.span className="ncx-navpill" layoutId="ncx-navpill" transition={SPRING} />
                ) : null
              if (entry.kind === 'link') {
                return (
                  <div
                    key={item.id || i}
                    className="ncx-navitem"
                    onPointerEnter={(e) => {
                      if (e.pointerType === 'mouse') setHovered(i)
                    }}
                  >
                    <span className="ncx-navslot">
                      {pill}
                      <Anchor className="ncx-navlink" href={entry.href} newTab={entry.newTab}>
                        {item.label}
                      </Anchor>
                    </span>
                  </div>
                )
              }

              const panelId = `ncx-menu-${item.id || i}`

              return (
                // How a dropdown opens and closes, by the input that drives it:
                // - mouse: hovering opens it; a click on the trigger opens it
                //   and never closes it; leaving the menu closes it.
                // - keyboard: focusing the trigger opens it; Enter or Space
                //   keep it open; Escape closes it, focus staying put.
                // - touch or pen: no hover. The first tap opens it, a second
                //   tap on the same trigger closes it, a tap outside closes it.
                // Told apart by each event's pointerType, not by the device,
                // so a laptop with a touch screen works with either.
                <div
                  key={item.id || i}
                  className={`ncx-navitem${open === i ? ' is-open' : ''}`}
                  onPointerEnter={(e) => {
                    if (e.pointerType !== 'mouse') return
                    hold()
                    setOpen(i)
                    setHovered(i)
                  }}
                >
                  <span className="ncx-navslot">
                    {pill}
                    <button
                      className="ncx-navlink"
                      type="button"
                      ref={(el) => {
                        triggers.current.set(i, el)
                      }}
                      aria-expanded={open === i}
                      aria-controls={panelId}
                      onPointerDown={(e) => {
                        pressedWith.current = e.pointerType
                      }}
                      onFocus={() => {
                        // Focus from a press is left to the click below; only
                        // keyboard focus opens the menu here.
                        if (!pressedWith.current) setOpen(i)
                      }}
                      onBlur={() => {
                        // A press dragged off the trigger never clicks; forget it.
                        pressedWith.current = ''
                      }}
                      onClick={() => {
                        const tapped = pressedWith.current !== '' && pressedWith.current !== 'mouse'
                        pressedWith.current = ''
                        if (tapped) setOpen((cur) => (cur === i ? null : i))
                        else setOpen(i)
                      }}
                    >
                      {item.label}
                      <Chevron />
                    </button>
                  </span>

                  <MegaPanel
                    id={panelId}
                    ref={(el) => {
                      panels.current.set(i, el)
                    }}
                    groups={entry.groups}
                    open={open === i}
                    featured={item.featured}
                    image={item.id ? featuredImages?.[item.id] : null}
                  />
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
            {data.signInLabel && data.supportLabel && data.supportHref ? (
              <span className="ncx-sep" aria-hidden="true" />
            ) : null}
            {data.supportLabel && data.supportHref ? (
              <Anchor className="ncx-ghost ncx-support" href={data.supportHref}>
                {data.supportLabel}
              </Anchor>
            ) : null}
            {data.ctaLabel ? (
              <Anchor className="ncx-btn-pill" href={data.ctaHref || '/contact'}>
                {data.ctaLabel}
              </Anchor>
            ) : null}
          </div>

          {/* Shown at phone and tablet width only (headerStyles.ts). Opens and
              closes the menu drawer below. */}
          <button
            ref={burgerRef}
            className="ncx-burger"
            type="button"
            aria-expanded={drawerOpen}
            aria-controls="ncx-drawer"
            aria-label={drawerOpen ? 'Close menu' : 'Open menu'}
            onClick={() => (drawerOpen ? closeDrawer() : setDrawerOpen(true))}
          >
            <span className="ncx-burger__bars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <span className="ncx-burger__label">Menu</span>
          </button>
        </div>
      </header>

      {/* The menu drawer for phone and tablet width: the same items as the bar,
          full screen. Dropdowns list their links in a section that starts
          collapsed; one opens at a time. Any link tapped in it closes it. */}
      <div
        ref={drawerRef}
        className={`ncx-drawer${drawerOpen ? ' is-open' : ''}`}
        id="ncx-drawer"
        role="dialog"
        aria-modal="true"
        aria-label="Menu"
        aria-hidden={!drawerOpen}
        inert={!drawerOpen}
        onClick={(e) => {
          if ((e.target as Element).closest('a[href]')) closeDrawer({ focus: false })
        }}
      >
        <div className="ncx-drawer__bar">
          {mark}
          <button
            ref={closeRef}
            className="ncx-drawer__close"
            type="button"
            aria-label="Close menu"
            onClick={() => closeDrawer()}
          >
            <span className="ncx-drawer__x" aria-hidden="true" />
          </button>
        </div>

        <nav className="ncx-drawer__body" aria-label="Menu">
          <ul className="ncx-drawer__list">
            {items.map((item, i) => {
              const entry = menuKind(item)

              if (entry.kind === 'none') return null
              if (entry.kind === 'link') {
                return (
                  <li
                    className="ncx-drawer__item"
                    key={item.id || i}
                    style={{ '--i': i } as React.CSSProperties}
                  >
                    <Anchor className="ncx-drawer__row" href={entry.href} newTab={entry.newTab}>
                      {item.label}
                    </Anchor>
                  </li>
                )
              }

              const sectionId = `ncx-drawer-${item.id || i}`

              return (
                <li
                  className="ncx-drawer__item"
                  key={item.id || i}
                  style={{ '--i': i } as React.CSSProperties}
                >
                  <button
                    className="ncx-drawer__row"
                    type="button"
                    aria-expanded={section === i}
                    aria-controls={sectionId}
                    onClick={() => setSection((cur) => (cur === i ? null : i))}
                  >
                    {item.label}
                    <Chevron />
                  </button>
                  <ul className="ncx-drawer__sub" id={sectionId} hidden={section !== i}>
                    {/* The mega menu's groups one after another, each under
                        its label when there is more than one group. */}
                    {entry.groups.map((g) => (
                      <React.Fragment key={g.id}>
                        {entry.groups.length > 1 && g.label ? (
                          <li className="ncx-drawer__eyebrow">{g.label}</li>
                        ) : null}
                        {g.items.map((l) => (
                          <li key={l.id}>
                            <Anchor className="ncx-drawer__link" href={l.href} newTab={l.newTab}>
                              <span>{l.label}</span>
                              <Badge badge={l.badge} />
                            </Anchor>
                          </li>
                        ))}
                      </React.Fragment>
                    ))}
                  </ul>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="ncx-drawer__foot">
          {data.ctaLabel ? (
            <Anchor className="ncx-btn-pill ncx-drawer__cta" href={data.ctaHref || '/contact'}>
              {data.ctaLabel}
            </Anchor>
          ) : null}
          {data.signInLabel || (data.supportLabel && data.supportHref) ? (
            <div className="ncx-drawer__minor">
              {data.signInLabel ? <Anchor href={signInHref}>{data.signInLabel}</Anchor> : null}
              {data.supportLabel && data.supportHref ? (
                <Anchor href={data.supportHref}>{data.supportLabel}</Anchor>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>
    </>
  )
}
